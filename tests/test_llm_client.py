import json
from unittest.mock import MagicMock, patch
from core.llm_client import LLMClient, TailoredSections
from core.master_resume import MasterResume

GOOD_JSON = json.dumps({
    "extracted_keywords": ["Python", "RAG", "FastAPI"],
    "summary": "Tailored summary for this role.",
    "skills": {"AI & LLM Engineering": ["RAG", "LLM Orchestration"]},
    "bullets": {"fhk_0": "Rephrased FH Kufstein bullet.", "techbit_0": "Rephrased TechBit bullet."},
})

@patch("core.llm_client.Groq")
def test_tailor_returns_tailored_sections(mock_groq_cls):
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=GOOD_JSON))]
    )
    client = LLMClient(api_key="test-key")
    result = client.tailor("We need a Python LLM developer.", MasterResume.load())
    assert isinstance(result, TailoredSections)
    assert result.summary == "Tailored summary for this role."
    assert "AI & LLM Engineering" in result.skills
    assert "fhk_0" in result.bullets
    assert result.extracted_keywords == ["Python", "RAG", "FastAPI"]

@patch("core.llm_client.Groq")
def test_tailor_retries_on_bad_json(mock_groq_cls):
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client
    mock_client.chat.completions.create.side_effect = [
        MagicMock(choices=[MagicMock(message=MagicMock(content="not json at all"))]),
        MagicMock(choices=[MagicMock(message=MagicMock(content=GOOD_JSON))]),
    ]
    client = LLMClient(api_key="test-key")
    result = client.tailor("job description", MasterResume.load())
    assert result.summary == "Tailored summary for this role."
    assert mock_client.chat.completions.create.call_count == 2

@patch("core.llm_client.Groq")
def test_tailor_raises_after_two_bad_responses(mock_groq_cls):
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content="not json"))]
    )
    client = LLMClient(api_key="test-key")
    import pytest
    with pytest.raises(ValueError, match="invalid JSON"):
        client.tailor("job", MasterResume.load())

@patch("core.llm_client.Groq")
def test_strips_markdown_fences(mock_groq_cls):
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client
    fenced = f"```json\n{GOOD_JSON}\n```"
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=fenced))]
    )
    client = LLMClient(api_key="test-key")
    result = client.tailor("job", MasterResume.load())
    assert result.summary == "Tailored summary for this role."

@patch("core.llm_client.Groq")
def test_parse_resume(mock_groq_cls):
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client
    parser_output = {
        "name": "Jane Doe",
        "tagline": "Software Engineer",
        "contact": {
            "email": "jane@example.com",
            "phone": "123-456-7890",
            "location": "NY",
            "linkedin": "",
            "github": ""
        },
        "summary": "Experienced engineer.",
        "skills": {"Languages": ["Python"]},
        "experience": [],
        "projects": [],
        "education": [],
        "certifications": [],
        "languages": []
    }
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=json.dumps(parser_output)))]
    )
    client = LLMClient(api_key="test-key")
    result = client.parse_resume("Jane Doe CV text")
    assert result["name"] == "Jane Doe"
    assert result["tagline"] == "Software Engineer"
    assert result["contact"]["email"] == "jane@example.com"

