from pydantic import BaseModel, Field

class Checkpoint(BaseModel):
    day: int = Field(description="Day number: 1, 7, 14, or 30")
    action: str = Field(description="What needs to happen on this day")
    responsible_party: str = Field(
        description="Who is responsible: patient, nurse, doctor, or pharmacist"
    )


class CarePlan(BaseModel):
    patient_name: str = Field(description="Full name of the patient")
    diagnosis: str = Field(description="Primary diagnosis from the discharge summary")
    medications: list[str] = Field(
        description="List of medications with dosages if mentioned"
    )
    follow_up_appointments: list[str] = Field(
        description="List of required follow-up appointments"
    )
    checkpoints: list[Checkpoint] = Field(
        description="30-day care checkpoints at Day 1, 7, 14, and 30"
    )
    complexity_score: int = Field(
        ge=1, le=10,
        description="How complex is this patient's care: 1 = simple, 10 = very complex"
    )
    complexity_reason: str = Field(
        description="One sentence explaining the complexity score"
    )