"""Nearby gyms from OpenStreetMap, through the public Overpass API.

The public Overpass servers are shared and often answer "busy" (504), so a request is
tried on each of the main servers in turn, and results are cached per area for an hour.
"""

import logging
import math
import time

import httpx

from app.schemas.gym import Gym

logger = logging.getLogger(__name__)

# The main instance and the two servers behind it
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://lambert.openstreetmap.de/api/interpreter",
    "https://gall.openstreetmap.de/api/interpreter",
]
MAX_ATTEMPTS = 6
HEADERS = {"User-Agent": "CalorieTrackerApp/0.1 (portfolio project)"}
MAX_RESULTS = 60
CACHE_SECONDS = 60 * 60

# Key: coordinates rounded to ~100 m plus the radius
_cache: dict[tuple[float, float, int], tuple[float, list[Gym]]] = {}


class GymSearchUnavailableError(Exception):
    """The map data service couldn't be reached or is overloaded."""


def find_gyms(lat: float, lon: float, radius_m: int) -> list[Gym]:
    key = (round(lat, 3), round(lon, 3), radius_m)
    cached = _cache.get(key)
    if cached and time.monotonic() - cached[0] < CACHE_SECONDS:
        return cached[1]

    elements = _query_overpass(lat, lon, radius_m)
    gyms = sorted(
        (gym for gym in (_parse(el, lat, lon) for el in elements) if gym is not None),
        key=lambda g: g.distance_m,
    )[:MAX_RESULTS]

    if len(_cache) > 500:  # keep memory bounded
        _cache.clear()
    _cache[key] = (time.monotonic(), gyms)
    return gyms


def _query_overpass(lat: float, lon: float, radius_m: int) -> list[dict]:
    around = f"(around:{radius_m},{lat},{lon})"
    # Gyms are tagged two ways in OpenStreetMap
    query = f"""[out:json][timeout:25];
(
  nwr["leisure"="fitness_centre"]{around};
  nwr["amenity"="gym"]{around};
);
out center tags {MAX_RESULTS * 2};"""

    for attempt in range(MAX_ATTEMPTS):
        url = OVERPASS_URLS[attempt % len(OVERPASS_URLS)]
        try:
            # Alternate GET and POST: when one is rejected as busy, the other often goes through
            if attempt % 2 == 0:
                response = httpx.post(url, data={"data": query}, headers=HEADERS, timeout=15.0)
            else:
                response = httpx.get(url, params={"data": query}, headers=HEADERS, timeout=15.0)
            if response.status_code == 200:
                return response.json().get("elements", [])
            logger.info("Overpass %s answered %s", url, response.status_code)
        except (httpx.HTTPError, ValueError) as exc:
            logger.info("Overpass %s failed: %s", url, exc)
        time.sleep(0.5)
    raise GymSearchUnavailableError


def _parse(element: dict, user_lat: float, user_lon: float) -> Gym | None:
    tags = element.get("tags", {})
    # Nodes have coordinates; ways and relations (buildings) come with a center point
    lat = element.get("lat") or (element.get("center") or {}).get("lat")
    lon = element.get("lon") or (element.get("center") or {}).get("lon")
    if lat is None or lon is None:
        return None

    street = " ".join(filter(None, [tags.get("addr:street"), tags.get("addr:housenumber")]))
    city = " ".join(filter(None, [tags.get("addr:postcode"), tags.get("addr:city")]))
    address = ", ".join(filter(None, [street, city])) or None

    return Gym(
        id=f"{element['type']}/{element['id']}",
        name=tags.get("name") or tags.get("brand") or "Unnamed gym",
        lat=lat,
        lon=lon,
        distance_m=round(_distance_m(user_lat, user_lon, lat, lon)),
        address=address,
        opening_hours=tags.get("opening_hours"),
        website=tags.get("website") or tags.get("contact:website"),
        phone=tags.get("phone") or tags.get("contact:phone"),
    )


def _distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance (haversine formula)."""
    r = 6_371_000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))
