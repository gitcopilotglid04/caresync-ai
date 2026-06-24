import logging
import time

from app.models import CarePlan, RiskAssessment
from app.llm import call_claude, extract_json_from_response, CLAUDE_MODEL
from app.prompts import (
    get_risk_assessor_system_prompt,
    get_risk_assessor_user_message,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def run_risk_assessor_agent(care_plan: CarePlan) -> RiskAssessment:
    """
    riskAssessorAgent — Risk Assessor (Agent 2)

    Reads the structured care plan from Agent 1 and returns a validated RiskAssessment.

    Raises:
        ValueError: if the model returns invalid or incomplete JSON
        ConnectionError: if the API key is missing or Claude is unreachable
        RuntimeError: for any other unexpected failure
    """

    logger.info(
        "riskAssessorAgent starting | Patient: %s | Complexity: %d/10",
        care_plan.patient_name,
        care_plan.complexity_score,
    )
    start_time = time.time()

    system_prompt = get_risk_assessor_system_prompt()
    user_message = get_risk_assessor_user_message(care_plan)

    logger.info("riskAssessorAgent | Calling Claude with model: %s", CLAUDE_MODEL)

    raw_response = call_claude(system_prompt, user_message)

    logger.info(
        "riskAssessorAgent | Raw response received | Length: %d characters",
        len(raw_response),
    )

    json_data = extract_json_from_response(raw_response)

    logger.info("riskAssessorAgent | JSON extracted successfully")

    try:
        assessment = RiskAssessment(**json_data)
    except Exception as e:
        logger.error("riskAssessorAgent | Pydantic validation failed: %s", str(e))
        logger.error("riskAssessorAgent | Raw JSON was: %s", str(json_data))
        raise ValueError(f"riskAssessorAgent output failed validation: {str(e)}")

    elapsed = round(time.time() - start_time, 2)
    logger.info(
        "riskAssessorAgent completed | Risk: %s | P(readmit): %.1f%% | Time: %ss",
        assessment.risk_level,
        assessment.readmission_probability_percent,
        elapsed,
    )

    return assessment
