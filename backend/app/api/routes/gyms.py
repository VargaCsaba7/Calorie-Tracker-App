from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import CurrentUser
from app.schemas.gym import GymSearchResult
from app.services.gyms import GymSearchUnavailableError, find_gyms

router = APIRouter(prefix="/gyms", tags=["gyms"])


@router.get("/nearby", response_model=GymSearchResult)
def nearby_gyms(
    _user: CurrentUser,
    lat: Annotated[float, Query(ge=-90, le=90)],
    lon: Annotated[float, Query(ge=-180, le=180)],
    radius_m: Annotated[int, Query(ge=500, le=10_000)] = 3000,
) -> GymSearchResult:
    """Gyms around a point, nearest first. The location is only used for the search, never stored."""
    try:
        gyms = find_gyms(lat, lon, radius_m)
    except GymSearchUnavailableError:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "The map data service is busy right now. Try again in a minute.",
        ) from None
    return GymSearchResult(gyms=gyms, radius_m=radius_m)
