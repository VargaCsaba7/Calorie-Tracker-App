from pydantic import BaseModel, ConfigDict, Field


class FoodRead(BaseModel):
    """A food with values per 100 g."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    brand: str | None
    source: str
    image_url: str | None
    emoji: str | None
    kcal_100g: float
    protein_100g: float
    carbs_100g: float
    fat_100g: float
    serving_g: float | None


class FoodSearchResult(BaseModel):
    foods: list[FoodRead]
    # False when Open Food Facts couldn't be reached; local results are still returned
    online_search_ok: bool


class AiStatus(BaseModel):
    enabled: bool


class FoodEstimateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    description: str = Field(min_length=2, max_length=300, examples=["egy tányér gulyásleves két szelet kenyérrel"])


class ModelItem(BaseModel):
    """One food in the meal, as the language model reads it from the description."""

    food: str = Field(description="Simple Hungarian dictionary name of the food, e.g. 'rizs', 'csirkemell'")
    grams: float = Field(description="Total weight of this food in grams")
    kcal_per_100g: float = Field(description="Typical kcal per 100 g")
    protein_per_100g: float = Field(description="Typical grams of protein per 100 g")
    carbs_per_100g: float = Field(description="Typical grams of carbohydrate per 100 g")
    fat_per_100g: float = Field(description="Typical grams of fat per 100 g")


class ModelEstimate(BaseModel):
    """What the language model fills in (the structured output schema)."""

    items: list[ModelItem] = Field(description="Every food in the meal, each one once")


class EstimateItem(BaseModel):
    """One food with its numbers for the eaten amount."""

    name: str
    grams: float
    calories: int
    protein: float
    carbs: float
    fat: float
    # Set when the numbers come from the app's food database instead of the model
    database_food: str | None = None


class FoodEstimate(BaseModel):
    """The estimate returned to the client: the foods plus their totals."""

    name: str
    portion_grams: float
    calories: int
    protein: float
    carbs: float
    fat: float
    items: list[EstimateItem]

    @classmethod
    def from_items(cls, name: str, items: list[EstimateItem]) -> "FoodEstimate":
        def total(field: str) -> float:
            return sum(getattr(item, field) for item in items)

        return cls(
            name=name,
            portion_grams=round(total("grams")),
            calories=round(total("calories")),
            protein=round(total("protein"), 1),
            carbs=round(total("carbs"), 1),
            fat=round(total("fat"), 1),
            items=items,
        )
