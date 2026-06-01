from core.diff_engine import DiffEngine, DiffToken, DiffResult

def test_identical_texts_all_unchanged():
    engine = DiffEngine()
    result = engine.compute("summary", "hello world", "hello world")
    assert all(t.type == "unchanged" for t in result.tokens)

def test_detects_added_words():
    engine = DiffEngine()
    result = engine.compute("summary", "I build software", "I build AI software")
    assert any(t.type == "added" for t in result.tokens)

def test_detects_removed_words():
    engine = DiffEngine()
    result = engine.compute("summary", "I build software apps", "I build software")
    assert any(t.type == "removed" for t in result.tokens)

def test_keyword_score_with_matching_keywords():
    engine = DiffEngine()
    result = engine.compute(
        "summary", "old text", "Python FastAPI and LLM experience",
        jd_keywords={"python", "fastapi", "llm"}
    )
    assert result.keyword_match_score > 0.5

def test_keyword_score_zero_no_matches():
    engine = DiffEngine()
    result = engine.compute(
        "summary", "old text", "Python FastAPI developer",
        jd_keywords={"kubernetes", "golang", "rust"}
    )
    assert result.keyword_match_score == 0.0

def test_keyword_score_one_when_no_keywords_provided():
    engine = DiffEngine()
    result = engine.compute("summary", "old", "new")
    assert result.keyword_match_score == 1.0

def test_compute_bulk_returns_correct_count():
    engine = DiffEngine()
    pairs = [
        ("summary", "old summary", "new summary"),
        ("skills_ai", "Python", "Python RAG LLM"),
    ]
    results = engine.compute_bulk(pairs, jd_keywords={"python", "rag"})
    assert len(results) == 2
    assert all(isinstance(r, DiffResult) for r in results)

def test_result_section_id_preserved():
    engine = DiffEngine()
    result = engine.compute("fhk_0", "original bullet", "tailored bullet")
    assert result.section_id == "fhk_0"
    assert result.original == "original bullet"
    assert result.tailored == "tailored bullet"
