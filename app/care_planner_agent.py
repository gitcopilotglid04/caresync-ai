import logging
import time
from app.prompts import get_care_planner_system_prompt, get_care_planner_user_message
from app.ollama_client import call_ollama, extract_json_from_response, OLLAMA_MODEL
from app.models import CarePlan

# Set up logging — this is your audit trail
# Every agent run will be logged with timing and results
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


def run_care_planner_agent(discharge_summary: str) -> CarePlan:
    """
    carePlannerAgent — Care Planner

    Takes a raw discharge summary (free text) and returns
    a validated, structured CarePlan object.

    Raises:
        ValueError: if the model returns invalid or incomplete JSON
        ConnectionError: if Ollama is not running
        RuntimeError: for any other unexpected failure
    """

    logger.info("carePlannerAgent starting | Input length: %d characters", len(discharge_summary))
    start_time = time.time()

    # Step 1: Build the prompts
    system_prompt = get_care_planner_system_prompt()
    user_message = get_care_planner_user_message(discharge_summary)

    logger.info("carePlannerAgent | Calling Ollama with model: %s", OLLAMA_MODEL)

    # Step 2: Call the AI model
    raw_response = call_ollama(system_prompt, user_message)

    logger.info("carePlannerAgent | Raw response received | Length: %d characters", len(raw_response))

    # Step 3: Extract the JSON from the response
    json_data = extract_json_from_response(raw_response)

    logger.info("carePlannerAgent | JSON extracted successfully")

    # Step 4: Validate against our Pydantic model
    # This will raise a ValidationError if any field is wrong type,
    # out of range, or missing
    try:
        care_plan = CarePlan(**json_data)
    except Exception as e:
        logger.error("carePlannerAgent | Pydantic validation failed: %s", str(e))
        logger.error("carePlannerAgent | Raw JSON was: %s", str(json_data))
        raise ValueError(f"carePlannerAgent output failed validation: {str(e)}")

    elapsed = round(time.time() - start_time, 2)
    logger.info(
        "carePlannerAgent completed | Patient: %s | Complexity: %d/10 | Time: %ss",
        care_plan.patient_name,
        care_plan.complexity_score,
        elapsed
    )

    return care_plan
