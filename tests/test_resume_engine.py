import os
import pytest
from core.resume_engine import ResumeEngine

TEMPLATE = os.path.join(os.path.dirname(__file__), "../templates/resume.html")

@pytest.fixture
def engine():
    return ResumeEngine(TEMPLATE)

def test_inject_empty_returns_html_with_name(engine):
    html = engine.inject({})
    assert "<html" in html
    assert "Ammar Khalid" in html

def test_inject_replaces_summary(engine):
    html = engine.inject({"summary": "Custom AI engineer summary for this test."})
    assert "Custom AI engineer summary for this test." in html

def test_inject_replaces_fhk_bullet(engine):
    html = engine.inject({"bullets": {"fhk_0": "Custom FHK bullet injected here."}})
    assert "Custom FHK bullet injected here." in html

def test_inject_preserves_original_bullet_when_not_overridden(engine):
    html = engine.inject({"bullets": {"fhk_0": "Override only first bullet."}})
    assert "Edge AI Architecture" in html  # fhk_1 not overridden

def test_inject_preserves_certifications(engine):
    html = engine.inject({})
    assert "AWS Certified Developer" in html

def test_inject_minimalist_template(engine):
    html = engine.inject({}, template_id="minimalist")
    assert "<html" in html
    assert "Ammar Khalid" in html

def test_inject_tech_template(engine):
    html = engine.inject({}, template_id="tech")
    assert "<html" in html
    assert "Ammar Khalid" in html

def test_inject_overrides_tagline(engine):
    html = engine.inject({"tagline": "Custom Injected Tagline"})
    assert "Custom Injected Tagline" in html

def test_inject_filters_excluded_projects(engine):
    # Exclude a project and verify it is not in the generated HTML
    html = engine.inject({"excluded_projects": ["dairy_sentinel"]})
    assert "Smart Dairy Sentinel" not in html
    assert "Interview Copilot" in html  # other project is still there

