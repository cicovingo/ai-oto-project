from fastapi import APIRouter

from app.api.v1.endpoints import agents, health, models, project_tasks, runs, workflows

api_router = APIRouter()
api_router.include_router(agents.router)
api_router.include_router(health.router, tags=["health"])
api_router.include_router(models.router, tags=["models"])
api_router.include_router(project_tasks.router, tags=["project-tasks"])
api_router.include_router(workflows.router, tags=["workflows"])
api_router.include_router(runs.router, tags=["runs"])
