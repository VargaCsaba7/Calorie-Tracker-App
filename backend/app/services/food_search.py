"""Food search: our own food table first, then Open Food Facts for packaged products.

Open Food Facts results are saved into the foods table, so a product only has to be
fetched once and meals can reference it like any other food.
"""

import logging
import time
from concurrent.futures import ThreadPoolExecutor

import httpx
from sqlalchemy import case, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Food

logger = logging.getLogger(__name__)

OFF_SEARCH_URL = "https://search.openfoodfacts.org/search"
OFF_PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product/{code}"
# Open Food Facts asks every app to identify itself
HEADERS = {"User-Agent": "CalorieTrackerApp/0.1 (portfolio project)"}
TIMEOUT = httpx.Timeout(6.0, connect=3.0)

# Skip the online search when we already have this many local matches
ENOUGH_LOCAL_RESULTS = 8
# Open Food Facts allows about 10 searches and 100 product reads a minute, so
# repeated queries are answered from memory and only a few images are fetched per search.
QUERY_CACHE_SECONDS = 6 * 60 * 60
MAX_IMAGE_FETCHES = 6

_query_cache: dict[str, tuple[float, list[str]]] = {}  # query -> (time, barcodes)


def search_foods(db: Session, query: str, limit: int = 20) -> tuple[list[Food], bool]:
    """Returns (foods, online_search_ok). Local results are returned even if the online search fails."""
    local = _search_local(db, query, limit)
    if len(local) >= ENOUGH_LOCAL_RESULTS:
        return local, True

    key = query.strip().lower()
    cached_query = _query_cache.get(key)
    if cached_query and time.monotonic() - cached_query[0] < QUERY_CACHE_SECONDS:
        online = _foods_by_codes(db, cached_query[1])
    else:
        try:
            products = _search_open_food_facts(query)
        except httpx.HTTPError as exc:
            logger.warning("Open Food Facts search failed: %s", exc)
            return local, False
        online = _cache_products(db, products)
        _query_cache[key] = (time.monotonic(), [f.external_id for f in online if f.external_id])

    seen = {food.id for food in local}
    return (local + [f for f in online if f.id not in seen])[:limit], True


def ensure_image(db: Session, food: Food) -> None:
    """Second chance for a product whose image couldn't be fetched during search."""
    if food.source == "off" and food.image_url is None and food.external_id:
        food.image_url = _fetch_image(food.external_id)
        if food.image_url:
            db.commit()


def _foods_by_codes(db: Session, codes: list[str]) -> list[Food]:
    by_code = {f.external_id: f for f in db.scalars(select(Food).where(Food.external_id.in_(codes)))}
    return [by_code[code] for code in codes if code in by_code]


def _search_local(db: Session, query: str, limit: int) -> list[Food]:
    stmt = (
        select(Food)
        .where(func.lower(Food.name).contains(query.lower(), autoescape=True))
        # Built-in foods first, then shorter (more generic) names
        .order_by(case((Food.source == "builtin", 0), else_=1), func.length(Food.name))
        .limit(limit)
    )
    return list(db.scalars(stmt))


def _search_open_food_facts(query: str) -> list[dict]:
    response = httpx.get(
        OFF_SEARCH_URL,
        params={
            "q": query,
            "page_size": 12,
            "langs": "hu,en",
            "fields": "code,product_name,product_name_hu,product_name_en,brands,nutriments",
        },
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    products = []
    for hit in response.json().get("hits", []):
        parsed = _parse_product(hit)
        if parsed:
            products.append(parsed)
    return products


def _parse_product(hit: dict) -> dict | None:
    """Keeps only products with a name and complete per-100 g nutrition data."""
    nutriments = hit.get("nutriments") or {}
    values = {
        "kcal_100g": nutriments.get("energy-kcal_100g"),
        "protein_100g": nutriments.get("proteins_100g"),
        "carbs_100g": nutriments.get("carbohydrates_100g"),
        "fat_100g": nutriments.get("fat_100g"),
    }
    name = hit.get("product_name_hu") or hit.get("product_name") or hit.get("product_name_en")
    code = hit.get("code")
    if not name or not code or any(not isinstance(v, (int, float)) or v < 0 for v in values.values()):
        return None

    brands = hit.get("brands")
    brand = (brands[0] if isinstance(brands, list) else str(brands).split(",")[0]) if brands else None
    return {
        "external_id": str(code)[:32],
        "name": name.strip()[:150],
        "brand": brand.strip()[:100] if brand else None,
        **{key: round(float(value), 1) for key, value in values.items()},
    }


def _fetch_image(code: str) -> str | None:
    """The search index has no images, so they come from the product endpoint.

    The endpoint sometimes rejects bursts of requests, so a failed call is retried once.
    """
    for attempt in range(2):
        try:
            response = httpx.get(
                OFF_PRODUCT_URL.format(code=code),
                params={"fields": "image_front_small_url"},
                headers=HEADERS,
                timeout=TIMEOUT,
            )
            response.raise_for_status()
            url = (response.json().get("product") or {}).get("image_front_small_url")
            return url if url and len(url) <= 300 else None
        except httpx.HTTPError:
            if attempt == 0:
                time.sleep(0.5)
    return None


def _cache_products(db: Session, products: list[dict]) -> list[Food]:
    codes = [p["external_id"] for p in products]
    existing = {f.external_id: f for f in db.scalars(select(Food).where(Food.external_id.in_(codes)))}
    new_products = [p for p in products if p["external_id"] not in existing]

    # Fetch images for the first few new products, two at a time; the rest get theirs when picked
    with ThreadPoolExecutor(max_workers=2) as pool:
        images = list(pool.map(_fetch_image, [p["external_id"] for p in new_products[:MAX_IMAGE_FETCHES]]))
    images += [None] * (len(new_products) - len(images))

    for product, image_url in zip(new_products, images):
        food = Food(source="off", image_url=image_url, **product)
        db.add(food)
        existing[product["external_id"]] = food
    try:
        db.commit()
    except IntegrityError:
        # Another request cached the same product at the same time; use the saved rows
        db.rollback()
        existing = {f.external_id: f for f in db.scalars(select(Food).where(Food.external_id.in_(codes)))}

    return [existing[code] for code in codes if code in existing]
