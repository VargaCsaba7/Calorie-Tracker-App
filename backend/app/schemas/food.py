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


class FoodEstimate(BaseModel):
    """The AI's estimate for the whole portion described. Also the structured output schema."""

    name: str = Field(description="Short name of the meal, in the user's language")
    portion_grams: float = Field(description="Estimated total weight of the portion in grams")
    calories: int = Field(description="Total kcal for the whole portion")
    protein: float = Field(description="Total grams of protein for the whole portion")
    carbs: float = Field(description="Total grams of carbohydrate for the whole portion")
    fat: float = Field(description="Total grams of fat for the whole portion")
    note: str = Field(description="One short sentence on the main assumptions, in the user's language")
