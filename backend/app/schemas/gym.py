from pydantic import BaseModel


class Gym(BaseModel):
    id: str  # OpenStreetMap id, e.g. "node/123456"
    name: str
    lat: float
    lon: float
    distance_m: int
    address: str | None
    opening_hours: str | None
    website: str | None
    phone: str | None


class GymSearchResult(BaseModel):
    gyms: list[Gym]
    radius_m: int
