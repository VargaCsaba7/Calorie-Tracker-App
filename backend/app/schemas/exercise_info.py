from pydantic import BaseModel


class ExerciseInfoRead(BaseModel):
    id: str
    name: str
    muscle_group: str
    category: str
    level: str
    equipment: str | None
    force: str | None
    mechanic: str | None
    primary_muscles: list[str]
    secondary_muscles: list[str]
    instructions: list[str]
    image_urls: list[str]


class ExerciseInfoList(BaseModel):
    items: list[ExerciseInfoRead]
    total: int
