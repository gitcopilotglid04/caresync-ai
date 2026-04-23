from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.care_planner_agent import run_care_planner_agent

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