from fastapi import APIRouter, HTTPException

from app.schemas.run import WorkflowRun
from app.services.run_service import get_run, get_runs

router = APIRouter(
    prefix="/workspaces/{workspace_id}/runs",
)


@router.get("", response_model=list[WorkflowRun])
def list_runs(workspace_id: str) -> list[WorkflowRun]:
    return get_runs(workspace_id)


@router.get("/{run_id}", response_model=WorkflowRun)
def read_run(workspace_id: str, run_id: str) -> WorkflowRun:
    run = get_run(workspace_id, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return run
