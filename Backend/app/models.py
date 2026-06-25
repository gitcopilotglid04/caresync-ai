from typing import Literal

from pydantic import BaseModel, Field, model_validator

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


class CheckpointPriority(BaseModel):
    day: int = Field(description="Checkpoint day: 1, 7, 14, or 30")
    priority_rank: int = Field(
        ge=1,
        le=4,
        description="1 = highest priority, 4 = lowest among the four checkpoints",
    )
    rationale: str = Field(
        description="Why this checkpoint has this relative priority for this patient"
    )


class RiskAssessment(BaseModel):
    risk_level: Literal["Low", "Medium", "High", "Critical"] = Field(
        description="Overall post-discharge readmission risk tier"
    )
    risk_factors: list[str] = Field(
        description="Identified factors that increase risk (e.g. living alone, polypharmacy)"
    )
    readmission_probability_percent: float = Field(
        ge=0,
        le=100,
        description="Estimated 30-day readmission probability as a percentage",
    )
    checkpoint_priorities: list[CheckpointPriority] = Field(
        description="All four standard checkpoints (days 1, 7, 14, 30) ranked by priority"
    )

    @model_validator(mode="after")
    def checkpoint_days_are_complete(self) -> "RiskAssessment":
        days = {c.day for c in self.checkpoint_priorities}
        if days != {1, 7, 14, 30}:
            raise ValueError(
                "checkpoint_priorities must include exactly one entry each for days 1, 7, 14, and 30"
            )
        ranks = [c.priority_rank for c in self.checkpoint_priorities]
        if sorted(ranks) != [1, 2, 3, 4]:
            raise ValueError("priority_rank must be a permutation of 1, 2, 3, 4")
        return self


class EscalationItem(BaseModel):
    concern: str = Field(
        description="A single concern raised by this patient's care plan or risk profile"
    )
    owner: Literal["AI", "human_coordinator"] = Field(
        description="Who should handle this concern: AI = automatable, human_coordinator = needs a person"
    )
    urgency: Literal["routine", "soon", "urgent", "immediate"] = Field(
        description="How quickly this concern must be acted on"
    )
    rationale: str = Field(
        description="One sentence explaining the owner and urgency choice for this concern"
    )


class EscalationDecision(BaseModel):
    human_review_required: bool = Field(
        description="Whether a human coordinator must review this patient before the plan proceeds"
    )
    overall_urgency: Literal["routine", "soon", "urgent", "immediate"] = Field(
        description="The single highest urgency across all escalation items"
    )
    escalation_items: list[EscalationItem] = Field(
        description="One entry per distinct concern, each routed to AI or a human coordinator"
    )
    summary: str = Field(
        description="One- or two-sentence plain-language summary of the escalation decision"
    )
    model_overridden: bool = Field(
        default=False,
        description=(
            "True when the deterministic safety floor overrode the model's decision "
            "(set by code, not the model). Always start at False in model output."
        ),
    )

    @model_validator(mode="after")
    def overall_urgency_matches_items(self) -> "EscalationDecision":
        if not self.escalation_items:
            return self
        order = ["routine", "soon", "urgent", "immediate"]
        highest = max(self.escalation_items, key=lambda i: order.index(i.urgency))
        if order.index(self.overall_urgency) < order.index(highest.urgency):
            raise ValueError(
                "overall_urgency must be at least as high as the most urgent escalation_item"
            )
        return self


class PatientMessage(BaseModel):
    day: int = Field(description="Message day: 1, 7, 14, or 30")
    channel: Literal["SMS", "WhatsApp", "Email", "Phone call"] = Field(
        description="Delivery channel best suited to this message"
    )
    subject: str = Field(description="Short, plain-language subject line")
    body: str = Field(
        description="Patient-friendly message text, no clinical jargon, ~8th-grade reading level"
    )
    warning_signs: list[str] = Field(
        description="'Seek help if...' cues appropriate to the diagnosis; empty list if none"
    )
    call_to_action: str = Field(
        description="The single most important action for the patient on this day"
    )


class CommunicationPlan(BaseModel):
    patient_name: str = Field(description="Full name of the patient")
    messages: list[PatientMessage] = Field(
        description="Exactly four patient messages, one each for days 1, 7, 14, and 30"
    )

    @model_validator(mode="after")
    def message_days_are_complete(self) -> "CommunicationPlan":
        days = {m.day for m in self.messages}
        if days != {1, 7, 14, 30}:
            raise ValueError(
                "messages must include exactly one entry each for days 1, 7, 14, and 30"
            )
        return self