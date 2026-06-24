import logging
import time

from app.models import CarePlan, EscalationDecision, RiskAssessment
from app.llm import call_claude, extract_json_from_response, CLAUDE_MODEL
from app.prompts import (
    get_escalation_system_prompt,
    get_escalation_user_message,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# Risk levels that ALWAYS require a human in the loop, no matter what the model says.
FORCE_HUMAN_REVIEW_LEVELS = frozenset({"High", "Critical"})


def apply_safety_floor(
    decision: EscalationDecision, risk_assessment: RiskAssessment
) -> EscalationDecision:
    """
    Deterministic code safety floor.

    A High or Critical patient can NEVER escape human review, regardless of what
    the model decided. This is pure code — it does not call the model — so the
    guarantee is testable and unconditional.

    When the floor changes the model's decision, model_overridden is set to True
    so the override is visible in the audit trail.
    """

    if risk_assessment.risk_level not in FORCE_HUMAN_REVIEW_LEVELS:
        return decision

    if decision.human_review_required:
        # Model already agreed a human is needed; nothing to override.
        return decision

    logger.warning(
        "escalationAgent | SAFETY FLOOR engaged | risk_level=%s forced "
        "human_review_required True (model said False)",
        risk_assessment.risk_level,
    )

    # Pydantic models are immutable-by-convention here; build a corrected copy.
    return decision.model_copy(
        update={"human_review_required": True, "model_overridden": True}
    )


def run_escalation_agent(
    care_plan: CarePlan, risk_assessment: RiskAssessment
) -> EscalationDecision:
    """
    escalationAgent — Escalation Agent (Agent 4)

    Reads the structured care plan (Agent 1) and risk assessment (Agent 2) and
    returns a validated EscalationDecision: which concerns a human coordinator
    must own versus which the AI can safely automate.

    A deterministic safety floor guarantees that High/Critical patients always
    require human review.

    Raises:
        ValueError: if the model returns invalid or incomplete JSON
        ConnectionError: if the API key is missing or Claude is unreachable
        RuntimeError: for any other unexpected failure
    """

    logger.info(
        "escalationAgent starting | Patient: %s | Risk: %s",
        care_plan.patient_name,
        risk_assessment.risk_level,
    )
    start_time = time.time()

    system_prompt = get_escalation_system_prompt()
    user_message = get_escalation_user_message(care_plan, risk_assessment)

    logger.info("escalationAgent | Calling Claude with model: %s", CLAUDE_MODEL)

    raw_response = call_claude(system_prompt, user_message)

    logger.info(
        "escalationAgent | Raw response received | Length: %d characters",
        len(raw_response),
    )

    json_data = extract_json_from_response(raw_response)

    logger.info("escalationAgent | JSON extracted successfully")

    try:
        decision = EscalationDecision(**json_data)
    except Exception as e:
        logger.error("escalationAgent | Pydantic validation failed: %s", str(e))
        logger.error("escalationAgent | Raw JSON was: %s", str(json_data))
        raise ValueError(f"escalationAgent output failed validation: {str(e)}")

    # Deterministic safety floor — applied AFTER the model, never bypassed.
    decision = apply_safety_floor(decision, risk_assessment)

    elapsed = round(time.time() - start_time, 2)
    logger.info(
        "escalationAgent completed | Human review: %s | Urgency: %s | "
        "Overridden: %s | Time: %ss",
        decision.human_review_required,
        decision.overall_urgency,
        decision.model_overridden,
        elapsed,
    )

    return decision
