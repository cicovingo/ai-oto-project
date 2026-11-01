import sqlite3

from fastapi import APIRouter, BackgroundTasks, HTTPException, Response, status

from app.schemas.run import WorkflowRun, WorkflowRunRequest
from app.schemas.workflow import Workflow, WorkflowGenerationRequest
from app.services.run_service import (
    cancel_run,
    create_run,
    execute_run,
    get_run,
    get_runs,
)
from app.services.workflow_service import (
    create_workflow,
    delete_workflow,
    generate_workflow,
    get_workflow,
    get_workflows,
    update_workflow,
)

router = APIRouter(
    prefix="/workspaces/{workspace_id}/workflows",
)


@router.get("", response_model=list[Workflow])
def list_workflows(workspace_id: str) -> list[Workflow]:
    return get_workflows(workspace_id)


@router.post(
    "/generate",
    response_model=Workflow,
    status_code=status.HTTP_201_CREATED,
)
def post_generate_workflow(
    workspace_id: str,
    request: WorkflowGenerationRequest,
) -> Workflow:
    return generate_workflow(
        workspace_id,
        request.goal,
        request.provider,
        request.model,
        request.allow_external_api,
    )


@router.get("/{workflow_id}", response_model=Workflow)
def read_workflow(workspace_id: str, workflow_id: str) -> Workflow:
    workflow = get_workflow(workspace_id, workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.post("", response_model=Workflow, status_code=status.HTTP_201_CREATED)
def post_workflow(workspace_id: str, workflow: Workflow) -> Workflow:
    try:
        return create_workflow(workspace_id, workflow)
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Workflow already exists") from exc


@router.put("/{workflow_id}", response_model=Workflow)
def put_workflow(
    workspace_id: str,
    workflow_id: str,
    workflow: Workflow,
) -> Workflow:
    if workflow.id != workflow_id:
        raise HTTPException(status_code=422, detail="Workflow id does not match URL")
    updated = update_workflow(workspace_id, workflow)
    if updated is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return updated


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_workflow(workspace_id: str, workflow_id: str) -> Response:
    if not delete_workflow(workspace_id, workflow_id):
        raise HTTPException(status_code=404, detail="Workflow not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{workflow_id}/runs", response_model=list[WorkflowRun])
def list_workflow_runs(workspace_id: str, workflow_id: str) -> list[WorkflowRun]:
    if get_workflow(workspace_id, workflow_id) is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return [run for run in get_runs(workspace_id) if run.workflow_id == workflow_id]


@router.post(
    "/{workflow_id}/runs",
    response_model=WorkflowRun,
    status_code=status.HTTP_202_ACCEPTED,
)
def post_workflow_run(
    workspace_id: str,
    workflow_id: str,
    request: WorkflowRunRequest,
    background_tasks: BackgroundTasks,
) -> WorkflowRun:
    workflow = get_workflow(workspace_id, workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    run = create_run(
        workspace_id,
        workflow,
        request.inputs,
        allow_external_api=request.allow_external_api,
    )
    background_tasks.add_task(execute_run, workspace_id, run.id, workflow, request.inputs)
    return run


@router.get("/{workflow_id}/runs/{run_id}", response_model=WorkflowRun)
def read_workflow_run(workspace_id: str, workflow_id: str, run_id: str) -> WorkflowRun:
    run = get_run(workspace_id, run_id)
    if run is None or run.workflow_id != workflow_id:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("/{workflow_id}/runs/{run_id}/cancel", response_model=WorkflowRun)
def post_cancel_run(workspace_id: str, workflow_id: str, run_id: str) -> WorkflowRun:
    run = get_run(workspace_id, run_id)
    if run is None or run.workflow_id != workflow_id:
        raise HTTPException(status_code=404, detail="Run not found")
    return cancel_run(workspace_id, run_id)
