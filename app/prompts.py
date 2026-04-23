from app.models import CarePlan
import json


def get_care_planner_system_prompt() -> str:
    """
    System prompt for carePlannerAgent — Care Planner.
    Defines the agent's role, rules, and exact output format.
    """

    # Build the expected JSON structure from our Pydantic model
    # so the prompt always stays in sync with our data model
    example_output = {
        "patient_name": "string",
        "diagnosis": "string",
        "medications": ["medication name with dosage"],
        "follow_up_appointments": ["appointment description"],
        "checkpoints": [
            {
                "day": 1,
                "action": "specific action required",
                "responsible_party": "patient | nurse | doctor | pharmacist"
            }
        ],
        "complexity_score": 7,
        "complexity_reason": "one sentence explanation"
    }

    return f"""You are a senior hospital care coordinator with 20 years of experience.

Your job is to read a patient's discharge summary and create a structured 30-day care plan.

RULES — follow every rule exactly:
1. Return ONLY valid JSON. No explanation, no preamble, no markdown code fences.
2. Your response must start with {{ and end with }}. Nothing before or after.
3. Use null for any field where information is not mentioned in the note.
4. Medications must include dosage and frequency if stated in the summary.
5. Checkpoints must include all four days: 1, 7, 14, and 30.
6. complexity_score must be an integer between 1 and 10.
7. responsible_party must be EXACTLY ONE of these four words only:
   patient, nurse, doctor, pharmacist.
   Never combine them. Never write 'patient | nurse'. Pick the single most appropriate one.
8. Do not infer or assume information that is not explicitly in the discharge summary.

COMPLEXITY SCORING GUIDE:
- 1-3: Simple recovery, single condition, few or no medications, strong support at home
- 4-6: Moderate complexity, 2-3 conditions, multiple medications, some follow-up needed
- 7-9: High complexity, multiple conditions, 4+ medications, specialist follow-ups, risk factors
- 10: Extremely complex, critical conditions, many medications, immediate follow-up mandatory

Return this exact JSON structure:
{json.dumps(example_output, indent=2)}"""


def get_care_planner_user_message(discharge_summary: str) -> str:
    """
    User message — the actual discharge summary to process.
    """
    return f"""Please create a 30-day care plan for the following discharge summary:

{discharge_summary}

Remember: Return ONLY valid JSON. Start with {{ and end with }}."""