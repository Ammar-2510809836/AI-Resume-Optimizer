from core.master_resume import MasterResume, ExperienceEntry, ProjectEntry

def test_load_returns_master_resume():
    resume = MasterResume.load()
    assert isinstance(resume, MasterResume)

def test_resume_has_ai_focused_tagline():
    resume = MasterResume.load()
    assert "AI" in resume.tagline or "LLM" in resume.tagline

def test_resume_has_required_fields():
    resume = MasterResume.load()
    assert resume.name == "Ammar Khalid"
    assert len(resume.skills) >= 4
    assert len(resume.experience) >= 2
    assert len(resume.projects) >= 3

def test_experience_entries_have_slugs():
    resume = MasterResume.load()
    for exp in resume.experience:
        assert exp.role_slug, f"{exp.title} missing role_slug"
        assert len(exp.bullets) > 0

def test_projects_have_slugs():
    resume = MasterResume.load()
    for proj in resume.projects:
        assert proj.project_slug, f"{proj.title} missing project_slug"

def test_to_llm_text_contains_bullet_ids():
    resume = MasterResume.load()
    text = resume.to_llm_text()
    assert "[fhk_0]" in text
    assert "[techbit_0]" in text
    assert "[dairy_sentinel_0]" in text
    assert "[interview_copilot_0]" in text

def test_to_llm_text_has_all_sections():
    resume = MasterResume.load()
    text = resume.to_llm_text()
    for section in ["TAGLINE:", "SUMMARY:", "SKILLS:", "EXPERIENCE:", "PROJECTS:"]:
        assert section in text, f"Missing section: {section}"
