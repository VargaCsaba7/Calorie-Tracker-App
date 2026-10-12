"""Matches a food name written by the language model ("rizs", "csirkemell") to a built-in food.

Matching works on words, ignoring accents and case. A query word matches a food word
exactly, as its beginning ("csirke" -> "csirkemell"), or with a small typo. Food words
the query doesn't mention lower the score, except cooking words like "főtt" or "sült"
and numbers, and raw ("nyers") foods only match when the name says raw. Below the
threshold there is no match, and the model's own numbers are used instead.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Food
from app.services.text_match import word_score, words

_NEUTRAL_WORDS = {"fott", "sult", "konzerv", "vizben", "bor", "nelkul", "sima"}
# Everyday words that mean the same as a built-in food's name
_ALIASES = {"krumpli": "burgonya", "rizz": "rizs", "cola": "kola", "coca": "kola", "csoki": "csokolade"}
_MIN_SCORE = 0.7


def _words(text: str) -> list[str]:
    return [_ALIASES.get(w, w) for w in words(text)]


def _score(query: list[str], food: list[str]) -> float:
    matched = sum(max((word_score(q, f) for f in food), default=0.0) for q in query)
    extra = sum(
        1
        for f in food
        if f not in _NEUTRAL_WORDS and not f.isdigit() and not any(word_score(q, f) for q in query)
    )
    score = matched / len(query) - 0.15 * extra
    if "nyers" in food and "nyers" not in query:
        score -= 0.3
    return score


def match_builtin_food(db: Session, name: str) -> Food | None:
    query = _words(name)
    if not query:
        return None
    best, best_score = None, _MIN_SCORE
    # Ordered by id, so on a tie the first (most common) variant wins
    for food in db.scalars(select(Food).where(Food.source == "builtin").order_by(Food.id)):
        score = _score(query, _words(food.name))
        if score > best_score:
            best, best_score = food, score
    return best
