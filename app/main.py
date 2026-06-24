from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.agents import (
    run_care_planner_agent,
    run_communication_drafter_agent,
    run_escalation_agent,
    run_risk_assessor_agent,
)
from app.models import CarePlan, RiskAssessment

app = FastAPI(
    title="Care Coordination Agent",
    description="Post-Discharge Care Coordination — POC Backend",
    version="1.0.0"
)


# Request model — what the API accepts
class DischargeSummaryRequest(BaseModel):
    discharge_summary: str


# Response wrapper — includes the care plan + metadata
class CarePlannerAgentResponse(BaseModel):
    status: str
    agent: str
    data: dict


class RiskAssessorAgentResponse(BaseModel):
    status: str
    agent: str
    data: dict


class CommunicationDrafterAgentResponse(BaseModel):
    status: str
    agent: str
    data: dict


class EscalationAgentResponse(BaseModel):
    status: str
    agent: str
    data: dict


@app.get("/")
def root():
    return {
        "message": "Care Coordination Agent API is running",
        "docs": "Visit /docs to test the API"
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/carePlannerAgent", response_model=CarePlannerAgentResponse)
def run_care_planner(request: DischargeSummaryRequest):
    """
    carePlannerAgent — Care Planner

    Submit a patient discharge summary.
    Returns a structured 30-day care plan with
    medications, checkpoints, and a complexity score.
    """

    if not request.discharge_summary.strip():
        raise HTTPException(
            status_code=400,
            detail="discharge_summary cannot be empty"
        )

    try:
        care_plan = run_care_planner_agent(request.discharge_summary)
        return CarePlannerAgentResponse(
            status="success",
            agent="carePlannerAgent",
            data=care_plan.model_dump()
        )

    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"carePlannerAgent failed unexpectedly: {str(e)}"
        )


class RiskAssessorRequest(BaseModel):
    """Structured care plan from Agent 1 (carePlannerAgent)."""

    care_plan: CarePlan


@app.post("/api/riskAssessorAgent", response_model=RiskAssessorAgentResponse)
def run_risk_assessor(request: RiskAssessorRequest):
    """
    riskAssessorAgent — Risk Assessor (Agent 2)

    Submit the structured care plan from Agent 1.
    Returns risk level, risk factors, estimated readmission probability,
    and checkpoint priorities.
    """

    try:
        assessment = run_risk_assessor_agent(request.care_plan)
        return RiskAssessorAgentResponse(
            status="success",
            agent="riskAssessorAgent",
            data=assessment.model_dump(),
        )

    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"riskAssessorAgent failed unexpectedly: {str(e)}",
        )


class CommunicationDrafterRequest(BaseModel):
    """Structured outputs from Agent 1 (CarePlan) and Agent 2 (RiskAssessment)."""

    care_plan: CarePlan
    risk_assessment: RiskAssessment


@app.post(
    "/api/communicationDrafterAgent",
    response_model=CommunicationDrafterAgentResponse,
)
def run_communication_drafter(request: CommunicationDrafterRequest):
    """
    communicationDrafterAgent — Communication Drafter (Agent 3)

    Submit the structured care plan (Agent 1) and risk assessment (Agent 2).
    Returns four patient-facing draft messages for days 1, 7, 14, and 30.
    Draft text only — no message is sent anywhere.
    """

    try:
        communication_plan = run_communication_drafter_agent(
            request.care_plan, request.risk_assessment
        )
        return CommunicationDrafterAgentResponse(
            status="success",
            agent="communicationDrafterAgent",
            data=communication_plan.model_dump(),
        )

    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"communicationDrafterAgent failed unexpectedly: {str(e)}",
        )


class EscalationRequest(BaseModel):
    """Structured care plan (Agent 1) + risk assessment (Agent 2)."""

    care_plan: CarePlan
    risk_assessment: RiskAssessment


@app.post("/api/escalationAgent", response_model=EscalationAgentResponse)
def run_escalation(request: EscalationRequest):
    """
    escalationAgent — Escalation Agent (Agent 4)

    Submit the structured care plan from Agent 1 and the risk assessment from Agent 2.
    Returns which concerns a human coordinator must own versus which the AI can
    safely automate, an overall urgency, and a human_review_required decision.

    A deterministic safety floor guarantees that High/Critical patients always
    require human review (model_overridden flags when the model was corrected).
    """

    try:
        decision = run_escalation_agent(request.care_plan, request.risk_assessment)
        return EscalationAgentResponse(
            status="success",
            agent="escalationAgent",
            data=decision.model_dump(),
        )

    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"escalationAgent failed unexpectedly: {str(e)}",
        )