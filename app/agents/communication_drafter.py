import logging
import time

from app.models import CarePlan, RiskAssessment, CommunicationPlan
from app.llm import call_claude, extract_json_from_response, CLAUDE_MODEL
from app.prompts import (
    get_communication_drafter_system_prompt,
    get_communication_drafter_user_message,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def run_communication_drafter_agent(
    care_plan: CarePlan, risk_assessment: RiskAssessment
) -> CommunicationPlan:
    """
    communicationDrafterAgent — Communication Drafter (Agent 3)

    Reads the structured care plan (Agent 1) and risk assessment (Agent 2) and
    returns a validated CommunicationPlan: patient-facing draft messages for
    days 1, 7, 14, and 30. Draft text only — nothing is sent anywhere.

    Raises:
        ValueError: if the model returns invalid or incomplete JSON
        ConnectionError: if the API key is missing or Claude is unreachable
        RuntimeError: for any other unexpected failure
    """

    logger.info(
        "communicationDrafterAgent starting | Patient: %s | Risk: %s",
        care_plan.patient_name,
        risk_assessment.risk_level,
    )
    start_time = time.time()

    system_prompt = get_communication_drafter_system_prompt()
    user_message = get_communication_drafter_user_message(care_plan, risk_assessment)

    logger.info("communicationDrafterAgent | Calling Claude with model: %s", CLAUDE_MODEL)

    raw_response = call_claude(system_prompt, user_message)

    logger.info(
        "communicationDrafterAgent | Raw response received | Length: %d characters",
        len(raw_response),
    )

    json_data = extract_json_from_response(raw_response)

    logger.info("communicationDrafterAgent | JSON extracted successfully")

    try:
        communication_plan = CommunicationPlan(**json_data)
    except Exception as e:
        logger.error("communicationDrafterAgent | Pydantic validation failed: %s", str(e))
        logger.error("communicationDrafterAgent | Raw JSON was: %s", str(json_data))
        raise ValueError(f"communicationDrafterAgent output failed validation: {str(e)}")

    elapsed = round(time.time() - start_time, 2)
    logger.info(
        "communicationDrafterAgent completed | Patient: %s | Messages: %d | Time: %ss",
        communication_plan.patient_name,
        len(communication_plan.messages),
        elapsed,
    )

    return communication_plan
