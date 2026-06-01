import difflib
from dataclasses import dataclass
from typing import Literal


@dataclass
class DiffToken:
    text: str
    type: Literal["added", "removed", "unchanged"]


@dataclass
class DiffResult:
    section_id: str
    original: str
    tailored: str
    tokens: list[DiffToken]
    keyword_match_score: float


class DiffEngine:
    def compute(
        self,
        section_id: str,
        original: str,
        tailored: str,
        jd_keywords: set[str] | None = None,
    ) -> DiffResult:
        original_words = original.split()
        tailored_words = tailored.split()

        matcher = difflib.SequenceMatcher(None, original_words, tailored_words)
        tokens: list[DiffToken] = []

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                for word in original_words[i1:i2]:
                    tokens.append(DiffToken(text=word, type="unchanged"))
            elif tag == "replace":
                for word in original_words[i1:i2]:
                    tokens.append(DiffToken(text=word, type="removed"))
                for word in tailored_words[j1:j2]:
                    tokens.append(DiffToken(text=word, type="added"))
            elif tag == "delete":
                for word in original_words[i1:i2]:
                    tokens.append(DiffToken(text=word, type="removed"))
            elif tag == "insert":
                for word in tailored_words[j1:j2]:
                    tokens.append(DiffToken(text=word, type="added"))

        return DiffResult(
            section_id=section_id,
            original=original,
            tailored=tailored,
            tokens=tokens,
            keyword_match_score=self._keyword_score(tailored, jd_keywords),
        )

    def _keyword_score(self, text: str, keywords: set[str] | None) -> float:
        if not keywords:
            return 1.0
        text_lower = text.lower()
        matched = sum(1 for kw in keywords if kw.lower() in text_lower)
        return round(matched / len(keywords), 2)

    def compute_bulk(
        self,
        pairs: list[tuple[str, str, str]],
        jd_keywords: set[str] | None = None,
    ) -> list[DiffResult]:
        return [
            self.compute(section_id, original, tailored, jd_keywords)
            for section_id, original, tailored in pairs
        ]
