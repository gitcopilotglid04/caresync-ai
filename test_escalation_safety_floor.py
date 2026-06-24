# test_escalation_safety_floor.py
# Proves the deterministic safety floor for escalationAgent (Agent 4):
# a High or Critical patient can NEVER escape human review, no matter what
# the model returned. These tests call apply_safety_floor() directly, so they
# are fully deterministic and require NO running model / Ollama.
#
# Usage: python test_escalation_safety_floor.py   (or: pytest test_escalation_safety_floor.py)

from app.agents import apply_safety_floor, FORCE_HUMAN_REVIEW_LEVELS
from app.models import (
    CheckpointPriority,
    EscalationDecision,
    EscalationItem,
    RiskAssessment,
)

ALL_RISK_LEVELS = ["Low", "Medium", "High", "Critical"]


def _make_risk(level: str) -> RiskAssessment:
    return RiskAssessment(
        risk_level=level,
        risk_factors=["synthetic test factor"],
        readmission_probability_percent=50.0,
        checkpoint_priorities=[
            CheckpointPriority(day=1, priority_rank=1, rationale="t"),
            CheckpointPriority(day=7, priority_rank=2, rationale="t"),
            CheckpointPriority(day=14, priority_rank=3, rationale="t"),
            CheckpointPriority(day=30, priority_rank=4, rationale="t"),
        ],
    )


def _make_decision(human_review_required: bool) -> EscalationDecision:
    return EscalationDecision(
        human_review_required=human_review_required,
        overall_urgency="routine",
        escalation_items=[
            EscalationItem(
                concern="synthetic concern",
                owner="AI",
                urgency="routine",
                rationale="test",
            )
        ],
        summary="synthetic test decision",
        model_overridden=False,
    )


def test_critical_patient_can_never_escape_review():
    """The headline guarantee: Critical + model says 'no human needed' -> forced True."""
    decision = _make_decision(human_review_required=False)
    result = apply_safety_floor(decision, _make_risk("Critical"))
    assert result.human_review_required is True
    assert result.model_overridden is True


def test_high_patient_can_never_escape_review():
    decision = _make_decision(human_review_required=False)
    result = apply_safety_floor(decision, _make_risk("High"))
    assert result.human_review_required is True
    assert result.model_overridden is True


def test_no_spurious_override_when_model_already_requires_review():
    """Critical patient the model already flagged -> stays True, not marked overridden."""
    decision = _make_decision(human_review_required=True)
    result = apply_safety_floor(decision, _make_risk("Critical"))
    assert result.human_review_required is True
    assert result.model_overridden is False


def test_floor_does_not_overreach_for_low_and_medium():
    """Low/Medium patients keep the model's decision; the floor must not over-trigger."""
    for level in ["Low", "Medium"]:
        decision = _make_decision(human_review_required=False)
        result = apply_safety_floor(decision, _make_risk(level))
        assert result.human_review_required is False
        assert result.model_overridden is False


def test_exhaustive_high_critical_always_reviewed():
    """For every risk level x every model decision, High/Critical always end up reviewed."""
    for level in ALL_RISK_LEVELS:
        for model_said in [True, False]:
            decision = _make_decision(human_review_required=model_said)
            result = apply_safety_floor(decision, _make_risk(level))
            if level in FORCE_HUMAN_REVIEW_LEVELS:
                assert result.human_review_required is True, (
                    f"{level} patient escaped review (model_said={model_said})"
                )
            else:
                assert result.human_review_required is model_said


if __name__ == "__main__":
    tests = [
        test_critical_patient_can_never_escape_review,
        test_high_patient_can_never_escape_review,
        test_no_spurious_override_when_model_already_requires_review,
        test_floor_does_not_overreach_for_low_and_medium,
        test_exhaustive_high_critical_always_reviewed,
    ]
    passed = 0
    for t in tests:
        t()
        print(f"PASS  {t.__name__}")
        passed += 1
    print("=" * 60)
    print(f"All {passed} safety-floor tests passed.")
    print("Guarantee verified: a High/Critical patient can never escape human review.")
