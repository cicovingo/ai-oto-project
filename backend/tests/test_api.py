import threading
import time

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolate_database(tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("FLOWMIND_DB_PATH", str(tmp_path / "flowmind.sqlite3"))


def test_health_endpoint() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_model_catalog_endpoint() -> None:
    response = client.get("/api/v1/models")

    assert response.status_code == 200
    providers = response.json()
    assert {provider["id"] for provider in providers} == {
        "ollama",
        "groq",
        "deepseek",
        "gemini",
    }
    ollama = next(provider for provider in providers if provider["id"] == "ollama")
    groq = next(provider for provider in providers if provider["id"] == "groq")
    deepseek = next(provider for provider in providers if provider["id"] == "deepseek")
    gemini = next(provider for provider in providers if provider["id"] == "gemini")
    assert ollama["isFree"] is True
    assert ollama["requiresApiKey"] is False
    assert groq["isFree"] is True
    assert groq["requiresApiKey"] is True
    assert groq["models"][0]["id"] == "openai/gpt-oss-20b"
    assert deepseek["isFree"] is False
    assert deepseek["requiresApiKey"] is True
    assert [model["id"] for model in deepseek["models"]] == [
        "deepseek-flash",
        "deepseek-v4-pro",
    ]
    assert gemini["isFree"] is False
    assert gemini["requiresApiKey"] is True
    assert [model["id"] for model in gemini["models"]] == [
        "gemini-3.1-flash-lite",
        "gemini-3-flash-preview",
        "gemini-3.1-pro-preview",
    ]


def test_model_catalog_lists_installed_ollama_models(monkeypatch) -> None:
    from app.services import model_service
    from app.schemas.model import ModelOption

    monkeypatch.setattr(
        model_service,
        "_get_ollama_models",
        lambda: [
            ModelOption(
                id="qwen2.5-coder:14b",
                name="qwen2.5-coder:14b",
                capabilities=["text", "tool_use"],
            )
        ],
    )

    response = client.get("/api/v1/models")

    assert response.status_code == 200
    ollama = next(provider for provider in response.json() if provider["id"] == "ollama")
    assert ollama["isConfigured"] is True
    assert [model["id"] for model in ollama["models"]] == ["qwen2.5-coder:14b"]


def test_agent_run_rejects_unknown_model() -> None:
    response = client.post(
        "/api/v1/agents/run",
        json={
            "provider": "ollama",
            "model": "not-available",
            "prompt": "Merhaba",
        },
    )

    assert response.status_code == 422
    assert response.json() == {"detail": "Unsupported model"}


def test_agent_run_requires_deepseek_api_key(monkeypatch) -> None:
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)

    response = client.post(
        "/api/v1/agents/run",
        json={
            "provider": "deepseek",
            "model": "deepseek-flash",
            "prompt": "hello",
        },
    )

    assert response.status_code == 503
    assert "DEEPSEEK_API_KEY" in response.json()["detail"]


def test_agent_run_requires_gemini_api_key(monkeypatch) -> None:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

    response = client.post(
        "/api/v1/agents/run",
        json={
            "provider": "gemini",
            "model": "gemini-3.1-flash-lite",
            "prompt": "hello",
        },
    )

    assert response.status_code == 503
    assert "GEMINI_API_KEY" in response.json()["detail"]


def test_gemini_model_is_constructed_with_selected_model_and_budget(monkeypatch) -> None:
    from app.services.agent_service import _make_model

    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    model = _make_model(
        "gemini",
        "gemini-3.1-pro-preview",
        temperature=0.1,
        max_tokens=1024,
        top_p=0.9,
    )

    assert model.id == "gemini-3.1-pro-preview"
    assert model.max_output_tokens == 1024
    assert model.api_key == "test-gemini-key"


def test_agent_run_accepts_generation_parameters(monkeypatch) -> None:
    from app.api.v1.endpoints import agents

    captured_request = None

    def fake_run_agent(request) -> str:
        nonlocal captured_request
        captured_request = request
        return "response"

    monkeypatch.setattr(agents, "run_agent", fake_run_agent)
    response = client.post(
        "/api/v1/agents/run",
        json={
            "provider": "groq",
            "model": "openai/gpt-oss-20b",
            "prompt": "hello",
            "temperature": 0.7,
            "maxTokens": 256,
            "topP": 0.8,
        },
    )

    assert response.status_code == 200
    assert response.json()["response"] == "response"
    assert captured_request.temperature == 0.7
    assert captured_request.max_tokens == 256
    assert captured_request.top_p == 0.8


def test_workflow_list_endpoint() -> None:
    response = client.get("/api/v1/workspaces/demo/workflows")

    assert response.status_code == 200
    assert response.json() == []


def test_workflow_detail_returns_404_for_unknown_workflow() -> None:
    response = client.get("/api/v1/workspaces/demo/workflows/missing")

    assert response.status_code == 404
    assert response.json() == {"detail": "Workflow not found"}


def test_run_list_endpoint() -> None:
    response = client.get("/api/v1/workspaces/demo/runs")

    assert response.status_code == 200
    assert response.json() == []


def _workflow_document() -> dict:
    return {
        "id": "workflow-test",
        "name": "Multi-agent test",
        "description": "Two independent agents",
        "status": "Draft",
        "runs": 0,
        "updatedAt": "Now",
        "icon": "bot",
        "version": 1,
        "nodes": [
            {
                "id": "input",
                "type": "workflow",
                "position": {"x": 0, "y": 0},
                "data": {
                    "label": "Input",
                    "description": "",
                    "kind": "input",
                    "config": {"field": "message", "value": "hello"},
                },
            },
            *[
                {
                    "id": f"agent-{index}",
                    "type": "workflow",
                    "position": {"x": 100, "y": index * 100},
                    "data": {
                        "label": f"Agent {index}",
                        "description": "",
                        "kind": "agent",
                        "config": {
                            "provider": "ollama",
                            "model": "llama3.2",
                            "instructions": "Respond briefly",
                        },
                    },
                }
                for index in (1, 2)
            ],
            {
                "id": "output",
                "type": "workflow",
                "position": {"x": 300, "y": 0},
                "data": {
                    "label": "Output",
                    "description": "",
                    "kind": "output",
                    "config": {"field": "response"},
                },
            },
        ],
        "edges": [
            {"id": "edge-input-1", "source": "input", "target": "agent-1"},
            {"id": "edge-input-2", "source": "input", "target": "agent-2"},
            {"id": "edge-output-1", "source": "agent-1", "target": "output"},
            {"id": "edge-output-2", "source": "agent-2", "target": "output"},
        ],
    }


def test_workflow_crud_and_workspace_isolation() -> None:
    document = _workflow_document()
    created = client.post("/api/v1/workspaces/demo/workflows", json=document)

    assert created.status_code == 201
    assert client.get("/api/v1/workspaces/demo/workflows/workflow-test").json() == document
    assert client.get("/api/v1/workspaces/other/workflows").json() == []

    updated_document = {**document, "name": "Updated"}
    updated = client.put(
        "/api/v1/workspaces/demo/workflows/workflow-test",
        json=updated_document,
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated"

    deleted = client.delete("/api/v1/workspaces/demo/workflows/workflow-test")
    assert deleted.status_code == 204
    assert client.get("/api/v1/workspaces/demo/workflows").json() == []


def test_workflow_run_executes_independent_agents_in_parallel(monkeypatch) -> None:
    from app.services import run_service

    lock = threading.Lock()
    active_agents = 0
    max_active_agents = 0

    def fake_run_agent(request) -> str:
        nonlocal active_agents, max_active_agents
        with lock:
            active_agents += 1
            max_active_agents = max(max_active_agents, active_agents)
        time.sleep(0.05)
        with lock:
            active_agents -= 1
        return f"handled: {request.prompt}"

    monkeypatch.setattr(run_service, "run_agent", fake_run_agent)
    created = client.post(
        "/api/v1/workspaces/demo/workflows",
        json=_workflow_document(),
    )
    assert created.status_code == 201

    response = client.post(
        "/api/v1/workspaces/demo/workflows/workflow-test/runs",
        json={"inputs": {"message": "test input"}},
    )

    assert response.status_code == 202
    run = client.get(
        f"/api/v1/workspaces/demo/runs/{response.json()['id']}"
    ).json()
    assert run["status"] == "completed"
    assert run["outputs"]["response"] == "handled: {\"input\": \"test input\"}"
    assert max_active_agents == 2
    assert {step["status"] for step in run["steps"]} == {"completed"}

    loaded_run = client.get(
        f"/api/v1/workspaces/demo/runs/{run['id']}"
    )
    assert loaded_run.status_code == 200
    assert loaded_run.json() == run


def test_workflow_run_sends_parallel_agent_results_to_coordinator(monkeypatch) -> None:
    from app.services import run_service

    document = _workflow_document()
    document["nodes"].append(
        {
            "id": "coordinator",
            "type": "workflow",
            "position": {"x": 400, "y": 0},
            "data": {
                "label": "Coordinator",
                "description": "Combines expert results",
                "kind": "agent",
                "config": {
                    "provider": "ollama",
                    "model": "llama3.2",
                    "instructions": "Synthesize the expert results",
                },
            },
        }
    )
    document["edges"] = [
        {"id": "input-agent-1", "source": "input", "target": "agent-1"},
        {"id": "input-agent-2", "source": "input", "target": "agent-2"},
        {"id": "agent-1-coordinator", "source": "agent-1", "target": "coordinator"},
        {"id": "agent-2-coordinator", "source": "agent-2", "target": "coordinator"},
        {"id": "coordinator-output", "source": "coordinator", "target": "output"},
    ]
    coordinator_prompts: list[str] = []

    def fake_run_agent(request) -> str:
        if request.instructions == "Synthesize the expert results":
            coordinator_prompts.append(request.prompt)
            return "combined result"
        return f"expert result for {request.prompt}"

    monkeypatch.setattr(run_service, "run_agent", fake_run_agent)
    created = client.post(
        "/api/v1/workspaces/demo/workflows",
        json=document,
    )
    assert created.status_code == 201

    response = client.post(
        "/api/v1/workspaces/demo/workflows/workflow-test/runs",
        json={"inputs": {"message": "analyze this"}},
    )

    assert response.status_code == 202
    run = client.get(
        f"/api/v1/workspaces/demo/runs/{response.json()['id']}"
    ).json()
    assert run["status"] == "completed"
    assert run["outputs"]["response"] == "combined result"
    assert len(coordinator_prompts) == 1
    assert "agent-1" in coordinator_prompts[0]
    assert "agent-2" in coordinator_prompts[0]
    assert {step["status"] for step in run["steps"]} == {"completed"}


def _conditional_workflow_document() -> dict:
    document = _workflow_document()
    document["nodes"] = [
        {
            "id": "input",
            "type": "workflow",
            "position": {"x": 0, "y": 0},
            "data": {
                "label": "Input",
                "description": "",
                "kind": "input",
                "config": {"field": "payload", "value": ""},
            },
        },
        {
            "id": "metric",
            "type": "workflow",
            "position": {"x": 100, "y": 0},
            "data": {
                "label": "Score threshold",
                "description": "",
                "kind": "metric",
                "config": {"metric": "numeric_score", "threshold": "0.8"},
            },
        },
        {
            "id": "condition",
            "type": "workflow",
            "position": {"x": 200, "y": 0},
            "data": {
                "label": "Pass?",
                "description": "",
                "kind": "condition",
                "config": {"field": "passed", "operator": "equals", "value": "true"},
            },
        },
        *[
            {
                "id": branch,
                "type": "workflow",
                "position": {"x": 300, "y": index * 100},
                "data": {
                    "label": branch,
                    "description": "",
                    "kind": "output",
                    "config": {"field": branch},
                },
            }
            for index, branch in enumerate(("approved", "rejected"))
        ],
    ]
    document["edges"] = [
        {"id": "input-metric", "source": "input", "target": "metric"},
        {"id": "metric-condition", "source": "metric", "target": "condition"},
        {
            "id": "condition-approved",
            "source": "condition",
            "sourceHandle": "true",
            "target": "approved",
        },
        {
            "id": "condition-rejected",
            "source": "condition",
            "sourceHandle": "false",
            "target": "rejected",
        },
    ]
    return document


@pytest.mark.parametrize(
    ("score", "expected_output", "skipped_output"),
    [(0.9, "approved", "rejected"), (0.4, "rejected", "approved")],
)
def test_workflow_metric_and_condition_route_only_the_selected_branch(
    score: float,
    expected_output: str,
    skipped_output: str,
) -> None:
    document = _conditional_workflow_document()
    assert client.post("/api/v1/workspaces/demo/workflows", json=document).status_code == 201

    created = client.post(
        "/api/v1/workspaces/demo/workflows/workflow-test/runs",
        json={"inputs": {"payload": {"score": score}}},
    )
    run = client.get(
        f"/api/v1/workspaces/demo/runs/{created.json()['id']}"
    ).json()

    assert run["status"] == "completed"
    assert expected_output in run["outputs"]
    assert skipped_output not in run["outputs"]
    steps = {step["id"]: step for step in run["steps"]}
    assert steps[expected_output]["status"] == "completed"
    assert steps[skipped_output]["status"] == "skipped"


def test_workflow_web_search_uses_tavily_results_and_input_template(monkeypatch) -> None:
    from app.services import run_service

    monkeypatch.setenv("TAVILY_API_KEY", "test-tavily-key")
    captured_request: dict[str, object] = {}

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {
                "results": [
                    {
                        "title": "Flowmind",
                        "url": "https://example.com/flowmind",
                        "content": "Workflow editor documentation.",
                    }
                ]
            }

    def fake_post(url: str, *, json: dict[str, object], timeout: int):
        captured_request.update({"url": url, "json": json, "timeout": timeout})
        return FakeResponse()

    monkeypatch.setattr(run_service.httpx, "post", fake_post)
    monkeypatch.setattr(run_service, "run_agent", lambda request: "Source-backed summary [1].")
    document = _workflow_document()
    document["nodes"] = [
        document["nodes"][0],
        {
            "id": "search",
            "type": "workflow",
            "position": {"x": 100, "y": 0},
            "data": {
                "label": "Search",
                "description": "",
                "kind": "web_search",
                "config": {
                    "provider": "ollama",
                    "model": "llama3.2",
                    "query": "{{input.query}}",
                    "searchProvider": "tavily",
                    "resultCount": "3",
                    "recency": "week",
                    "allowExternalApi": "true",
                },
            },
        },
        document["nodes"][-1],
    ]
    document["nodes"][0]["data"]["config"] = {"field": "query", "value": ""}
    document["edges"] = [
        {"id": "input-search", "source": "input", "target": "search"},
        {"id": "search-output", "source": "search", "target": "output"},
    ]
    assert client.post("/api/v1/workspaces/demo/workflows", json=document).status_code == 201

    created = client.post(
        "/api/v1/workspaces/demo/workflows/workflow-test/runs",
        json={"inputs": {"query": "Flowmind workflow editor"}},
    )
    run = client.get(
        f"/api/v1/workspaces/demo/runs/{created.json()['id']}"
    ).json()

    assert run["status"] == "completed"
    assert run["outputs"]["response"]["summary"] == "Source-backed summary [1]."
    assert run["outputs"]["response"]["sources"][0]["url"] == "https://example.com/flowmind"
    assert captured_request["url"] == "https://api.tavily.com/search"
    assert captured_request["json"]["query"] == "Flowmind workflow editor"
    assert captured_request["json"]["time_range"] == "week"


def test_workflow_web_search_requires_explicit_node_consent(monkeypatch) -> None:
    monkeypatch.setenv("TAVILY_API_KEY", "test-tavily-key")
    document = _workflow_document()
    document["nodes"] = [
        document["nodes"][0],
        {
            "id": "search",
            "type": "workflow",
            "position": {"x": 100, "y": 0},
            "data": {
                "label": "Search",
                "description": "",
                "kind": "web_search",
                "config": {
                    "provider": "ollama",
                    "model": "llama3.2",
                    "query": "{{json}}",
                    "allowExternalApi": "false",
                },
            },
        },
        document["nodes"][-1],
    ]
    document["edges"] = [
        {"id": "input-search", "source": "input", "target": "search"},
        {"id": "search-output", "source": "search", "target": "output"},
    ]
    assert client.post("/api/v1/workspaces/demo/workflows", json=document).status_code == 201

    created = client.post(
        "/api/v1/workspaces/demo/workflows/workflow-test/runs",
        json={"inputs": {}},
    )
    run = client.get(
        f"/api/v1/workspaces/demo/runs/{created.json()['id']}"
    ).json()

    assert run["status"] == "failed"
    search_step = next(step for step in run["steps"] if step["id"] == "search")
    assert "harici sorgu onayı" in search_step["detail"]


def test_workflow_run_requires_consent_for_remote_agent_provider() -> None:
    document = _workflow_document()
    document["nodes"][1]["data"]["config"]["provider"] = "groq"
    assert client.post("/api/v1/workspaces/demo/workflows", json=document).status_code == 201

    response = client.post(
        "/api/v1/workspaces/demo/workflows/workflow-test/runs",
        json={"inputs": {}},
    )

    assert response.status_code == 403
    assert "açık harici API onayı" in response.json()["detail"]


def test_workflow_run_rejects_cycles() -> None:
    document = _workflow_document()
    document["edges"].append(
        {"id": "cycle", "source": "agent-1", "target": "input"}
    )
    created = client.post("/api/v1/workspaces/demo/workflows", json=document)
    assert created.status_code == 201

    response = client.post(
        "/api/v1/workspaces/demo/workflows/workflow-test/runs",
        json={"inputs": {}},
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "Workflow graph contains a cycle"}


def test_agent_failure_is_persisted_without_a_success_shaped_result(monkeypatch) -> None:
    from app.services import run_service

    def fail_agent(request) -> str:
        assert request.prompt
        raise RuntimeError("Provider unavailable")

    monkeypatch.setattr(run_service, "run_agent", fail_agent)
    client.post(
        "/api/v1/workspaces/demo/workflows",
        json=_workflow_document(),
    )
    created = client.post(
        "/api/v1/workspaces/demo/workflows/workflow-test/runs",
        json={"inputs": {}},
    )

    run = client.get(
        f"/api/v1/workspaces/demo/runs/{created.json()['id']}"
    ).json()
    assert run["status"] == "failed"
    assert run["outputs"] is None
    assert [step["status"] for step in run["steps"]].count("failed") == 2
    assert all(
        "Provider unavailable" in step["detail"]
        for step in run["steps"]
        if step["status"] == "failed"
    )


def test_prompt_generates_editable_saved_workflow_that_can_be_run(monkeypatch) -> None:
    import json

    from app.schemas.model import ModelOption, ModelProvider
    from app.services import run_service, workflow_service

    monkeypatch.setattr(
        workflow_service,
        "get_model_catalog",
        lambda: [
            ModelProvider(
                id="groq",
                name="Groq",
                is_configured=True,
                is_free=True,
                requires_api_key=True,
                access_note="test provider",
                models=[
                    ModelOption(
                        id="openai/gpt-oss-20b",
                        name="Test model",
                        capabilities=["text"],
                    )
                ],
            )
        ],
    )

    def generate_plan(request) -> str:
        assert request.provider == "groq"
        assert "acceptance criteria" in request.prompt
        return json.dumps(
            {
                "name": "Game design and delivery",
                "description": "Research, design and review a game plan.",
                "agents": [
                    {
                        "label": "Research specialist",
                        "description": "Research requirements",
                        "instructions": "List requirements and assumptions.",
                    },
                    {
                        "label": "Game designer",
                        "description": "Design the gameplay",
                        "instructions": "Design mechanics and acceptance criteria.",
                    },
                ],
            }
        )

    monkeypatch.setattr(workflow_service, "run_agent", generate_plan)
    generated = client.post(
        "/api/v1/workspaces/demo/workflows/generate",
        json={
            "goal": "Design a cooperative puzzle game for two players with accessible controls.",
            "provider": "groq",
            "model": "openai/gpt-oss-20b",
            "allowExternalApi": True,
        },
    )

    assert generated.status_code == 201
    workflow = generated.json()
    assert workflow["status"] == "Draft"
    assert len(workflow["nodes"]) == 5
    assert len(workflow["edges"]) == 5
    assert {node["data"]["kind"] for node in workflow["nodes"]} == {
        "input",
        "agent",
        "output",
    }
    assert client.get(
        f"/api/v1/workspaces/demo/workflows/{workflow['id']}"
    ).json() == workflow

    monkeypatch.setattr(
        run_service,
        "run_agent",
        lambda request: "Reviewed game workflow result",
    )
    run_response = client.post(
        f"/api/v1/workspaces/demo/workflows/{workflow['id']}/runs",
        json={"inputs": {}, "allowExternalApi": True},
    )
    run = client.get(
        f"/api/v1/workspaces/demo/runs/{run_response.json()['id']}"
    ).json()

    assert run_response.status_code == 202
    assert run["status"] == "completed"
    assert run["outputs"]["result"] == "Reviewed game workflow result"


def test_cloud_workflow_generation_requires_external_api_consent(monkeypatch) -> None:
    from app.schemas.model import ModelOption, ModelProvider
    from app.services import workflow_service

    monkeypatch.setattr(
        workflow_service,
        "get_model_catalog",
        lambda: [
            ModelProvider(
                id="groq",
                name="Groq",
                is_configured=True,
                is_free=True,
                requires_api_key=True,
                access_note="test provider",
                models=[
                    ModelOption(
                        id="openai/gpt-oss-20b",
                        name="Test model",
                        capabilities=["text"],
                    )
                ],
            )
        ],
    )

    response = client.post(
        "/api/v1/workspaces/demo/workflows/generate",
        json={
            "goal": "Research and plan an educational app for language learners.",
            "provider": "groq",
            "model": "openai/gpt-oss-20b",
            "allowExternalApi": False,
        },
    )

    assert response.status_code == 422
    assert "onaylayın" in response.json()["detail"]
