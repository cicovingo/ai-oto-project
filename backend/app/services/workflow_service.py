import json
import logging
import re
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException

from app.schemas.agent import AgentRunRequest
from app.schemas.workflow import Workflow
from app.services.agent_service import run_agent
from app.services.database import connect
from app.services.model_service import get_model_catalog

logger = logging.getLogger(__name__)


def get_workflows(workspace_id: str) -> list[Workflow]:
    with connect() as connection:
        rows = connection.execute(
            "SELECT document FROM workflows WHERE workspace_id = ? ORDER BY rowid DESC",
            (workspace_id,),
        ).fetchall()
    return [Workflow.model_validate_json(row["document"]) for row in rows]


def get_workflow(workspace_id: str, workflow_id: str) -> Workflow | None:
    with connect() as connection:
        row = connection.execute(
            "SELECT document FROM workflows WHERE workspace_id = ? AND id = ?",
            (workspace_id, workflow_id),
        ).fetchone()
    return Workflow.model_validate_json(row["document"]) if row else None


def create_workflow(workspace_id: str, workflow: Workflow) -> Workflow:
    with connect() as connection:
        connection.execute(
            "INSERT INTO workflows (workspace_id, id, document) VALUES (?, ?, ?)",
            (workspace_id, workflow.id, workflow.model_dump_json(by_alias=True)),
        )
    return workflow


def generate_workflow(
    workspace_id: str,
    goal: str,
    provider_id: str,
    model_id: str,
    allow_external_api: bool,
) -> Workflow:
    provider = next(
        (item for item in get_model_catalog() if item.id == provider_id),
        None,
    )
    if provider is None or model_id not in {model.id for model in provider.models}:
        raise HTTPException(status_code=422, detail="Unsupported workflow model")
    if not provider.is_configured:
        raise HTTPException(
            status_code=503,
            detail=provider.access_note,
        )
    if provider_id != "ollama" and not allow_external_api:
        raise HTTPException(
            status_code=422,
            detail=(
                "Promptun bulut model sağlayıcısına gönderilmesini ve olası kullanımı "
                "onaylayın."
            ),
        )

    prompt = json.dumps(
        {
            "user_goal": goal.strip(),
            "requirements": [
                "Design a practical workflow that fulfills the full user goal.",
                "Use 2 or 3 independent specialist agents and one synthesis agent.",
                "Return each specialist's purpose and complete bounded system instructions.",
                "Preserve explicit acceptance criteria and identify assumptions or unknowns.",
                "Use concise instructions to limit token usage during future runs.",
                "Do not claim unavailable tools, live research, media generation, or tests.",
            ],
            "response_shape": {
                "name": "short workflow title",
                "description": "one sentence",
                "agents": [
                    {
                        "label": "specialist name",
                        "description": "short responsibility",
                        "instructions": "system instructions for this specialist",
                    }
                ],
            },
        },
        ensure_ascii=False,
    )
    try:
        response = run_agent(
            AgentRunRequest(
                provider=provider_id,
                model=model_id,
                prompt=prompt,
                instructions=(
                    "You are a workflow architect. Return only valid JSON with the "
                    "requested shape. Create 2 or 3 complementary specialist agents "
                    "and tailor their instructions to the user's goal. Keep every "
                    "agent instruction specific, actionable, and bounded."
                ),
                temperature=0.2,
                max_tokens=1200,
                top_p=0.9,
            )
        )
        match = re.search(r"\{.*\}", response, flags=re.DOTALL)
        if match is None:
            raise ValueError("No JSON object in workflow plan.")
        plan = json.loads(match.group(0))
    except HTTPException:
        raise
    except (ValueError, json.JSONDecodeError) as exc:
        logger.warning(
            "Workflow generation returned invalid plan (provider=%s, model=%s)",
            provider_id,
            model_id,
        )
        raise HTTPException(
            status_code=502,
            detail="AI ajan geçerli iş akışı planı üretemedi; promptu sadeleştirip tekrar deneyin.",
        ) from exc

    raw_agents = plan.get("agents") if isinstance(plan, dict) else None
    if not isinstance(raw_agents, list) or not 2 <= len(raw_agents) <= 3:
        raise HTTPException(
            status_code=502,
            detail="AI ajanı 2 veya 3 uzman içeren geçerli bir akış planı üretmedi.",
        )
    agents: list[dict[str, str]] = []
    for item in raw_agents:
        if not isinstance(item, dict):
            raise HTTPException(status_code=502, detail="Workflow agent definition is invalid")
        label = item.get("label")
        description = item.get("description")
        instructions = item.get("instructions")
        if not all(isinstance(value, str) and value.strip() for value in (label, description, instructions)):
            raise HTTPException(status_code=502, detail="Workflow agent definition is incomplete")
        agents.append(
            {
                "label": label.strip()[:80],
                "description": description.strip()[:240],
                "instructions": instructions.strip()[:4000],
            }
        )

    workflow_id = f"workflow-{uuid.uuid4()}"
    name = plan.get("name")
    description = plan.get("description")
    workflow_name = name.strip()[:120] if isinstance(name, str) and name.strip() else "Prompt ile oluşturulan iş akışı"
    workflow_description = (
        description.strip()[:500]
        if isinstance(description, str) and description.strip()
        else "İhtiyaca göre planlanmış çoklu uzman ajan akışı."
    )
    nodes: list[dict[str, object]] = [
        {
            "id": f"{workflow_id}-input",
            "type": "workflow",
            "position": {"x": 40, "y": 260},
            "data": {
                "label": "İş tanımı",
                "description": "Kullanıcı isteği ve kabul ölçütleri",
                "kind": "input",
                "config": {"field": "task", "value": goal.strip()},
            },
        }
    ]
    edges: list[dict[str, object]] = []
    specialist_ids: list[str] = []
    for index, agent in enumerate(agents, start=1):
        agent_id = f"{workflow_id}-specialist-{index}"
        specialist_ids.append(agent_id)
        nodes.append(
            {
                "id": agent_id,
                "type": "workflow",
                "position": {"x": 360, "y": 80 + (index - 1) * 190},
                "data": {
                    "label": agent["label"],
                    "description": agent["description"],
                    "kind": "agent",
                    "config": {
                        "provider": provider_id,
                        "model": model_id,
                        "temperature": "0.2",
                        "maxTokens": "1200",
                        "topP": "0.9",
                        "instructions": agent["instructions"],
                    },
                },
            }
        )
        edges.append(
            {
                "id": f"{workflow_id}-edge-input-{index}",
                "source": f"{workflow_id}-input",
                "target": agent_id,
                "animated": True,
            }
        )

    synthesis_id = f"{workflow_id}-synthesis"
    nodes.extend(
        [
            {
                "id": synthesis_id,
                "type": "workflow",
                "position": {"x": 760, "y": 260},
                "data": {
                    "label": "Koordinatör / kalite incelemesi",
                    "description": "Uzman sonuçlarını birleştirir ve ölçütlerle karşılaştırır",
                    "kind": "agent",
                    "config": {
                        "provider": provider_id,
                        "model": model_id,
                        "temperature": "0.1",
                        "maxTokens": "1600",
                        "topP": "0.9",
                        "instructions": (
                            "Uzman ajanların sonuçlarını ve özgün kullanıcı isteğini "
                            "birleştir. İstenen kabul ölçütlerini tek tek karşıla; çelişkileri, "
                            "varsayımları ve doğrulanmamış noktaları açıkça işaretle. "
                            "Olmayan araç, kaynak veya test sonucu uydurma. Kullanıcıya "
                            "uygulanabilir, düzenlenebilir bir nihai çıktı ver."
                        ),
                    },
                },
            },
            {
                "id": f"{workflow_id}-output",
                "type": "workflow",
                "position": {"x": 1100, "y": 260},
                "data": {
                    "label": "Nihai teslim",
                    "description": "Koordinatörün gözden geçirilmiş sonucu",
                    "kind": "output",
                    "config": {"field": "result"},
                },
            },
        ]
    )
    edges.extend(
        {
            "id": f"{workflow_id}-edge-synthesis-{index}",
            "source": agent_id,
            "target": synthesis_id,
            "animated": True,
        }
        for index, agent_id in enumerate(specialist_ids, start=1)
    )
    edges.append(
        {
            "id": f"{workflow_id}-edge-output",
            "source": synthesis_id,
            "target": f"{workflow_id}-output",
            "animated": True,
        }
    )
    workflow = Workflow(
        id=workflow_id,
        name=workflow_name,
        description=workflow_description,
        status="Draft",
        runs=0,
        updated_at=datetime.now(UTC).isoformat(),
        icon="branch",
        version=1,
        nodes=nodes,
        edges=edges,
    )
    return create_workflow(workspace_id, workflow)


def update_workflow(workspace_id: str, workflow: Workflow) -> Workflow | None:
    with connect() as connection:
        cursor = connection.execute(
            """
            UPDATE workflows SET document = ?
            WHERE workspace_id = ? AND id = ?
            """,
            (
                workflow.model_dump_json(by_alias=True),
                workspace_id,
                workflow.id,
            ),
        )
    return workflow if cursor.rowcount else None


def delete_workflow(workspace_id: str, workflow_id: str) -> bool:
    with connect() as connection:
        cursor = connection.execute(
            "DELETE FROM workflows WHERE workspace_id = ? AND id = ?",
            (workspace_id, workflow_id),
        )
    return cursor.rowcount > 0
