from fastapi import APIRouter

from app.schemas.agent import AgentRunRequest, AgentRunResponse
from app.services.agent_service import run_agent

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/run", response_model=AgentRunResponse)
def run_agent_endpoint(request: AgentRunRequest) -> AgentRunResponse:
    response = run_agent(request)
    return AgentRunResponse(
        provider=request.provider,
        model=request.model,
        response=response,
    )
