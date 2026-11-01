import os

from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from app.schemas.project_task import (
    ProjectTask,
    ProjectTaskConfig,
    ProjectTaskRequest,
)
from app.services.project_task_service import (
    allowed_project_root,
    create_project_task,
    execute_project_task,
    get_project_task,
    get_project_tasks,
)

router = APIRouter(prefix="/workspaces/{workspace_id}/project-tasks")


@router.get("/config", response_model=ProjectTaskConfig)
def read_project_task_config(workspace_id: str) -> ProjectTaskConfig:
    del workspace_id
    try:
        root = allowed_project_root()
    except OSError as exc:
        raise HTTPException(
            status_code=503,
            detail="FLOWMIND_PROJECT_ROOT geçerli ve erişilebilir bir klasör olmalıdır.",
        ) from exc
    return ProjectTaskConfig(
        allowed_project_root=str(root),
        web_search_configured=bool(os.getenv("TAVILY_API_KEY")),
        image_generation_configured=bool(os.getenv("OPENAI_API_KEY")),
    )


@router.get("", response_model=list[ProjectTask])
def list_project_tasks(workspace_id: str) -> list[ProjectTask]:
    return get_project_tasks(workspace_id)


@router.post("", response_model=ProjectTask, status_code=status.HTTP_202_ACCEPTED)
def post_project_task(
    workspace_id: str,
    request: ProjectTaskRequest,
    background_tasks: BackgroundTasks,
) -> ProjectTask:
    task = create_project_task(workspace_id, request)
    if task.status == "queued":
        background_tasks.add_task(execute_project_task, workspace_id, task.id)
    return task


@router.get("/{task_id}", response_model=ProjectTask)
def read_project_task(workspace_id: str, task_id: str) -> ProjectTask:
    task = get_project_task(workspace_id, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Project task not found")
    return task
