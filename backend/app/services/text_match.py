"""Small helpers for matching names typed by people (or a language model) to known names."""

import re
import unicodedata
from difflib import SequenceMatcher


def words(text: str) -> list[str]:
    """Lowercase words without accents: "Fehér rizs (főtt)" -> ["feher", "rizs", "fott"]."""
    ascii_text = unicodedata.normalize("NFKD", text.lower()).encode("ascii", "ignore").decode()
    return re.findall(r"[a-z0-9]+", ascii_text)


def word_score(query_word: str, known_word: str) -> float:
    """1.0 for the same word, 0.9 when the query is the start of the word, 0.8 for a likely typo."""
    if query_word == known_word:
        return 1.0
    if len(query_word) >= 4 and known_word.startswith(query_word):
        return 0.9
    if SequenceMatcher(None, query_word, known_word).ratio() >= 0.8:
        return 0.8
    return 0.0
