# Flowmind Frontend

Flowmind is a visual AI workflow prototype built with Next.js App Router, TypeScript, shadcn/ui, Redux Toolkit and React Flow.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Main screens

- `/` — workspace overview
- `/workflows` — workflow list, search and status filters
- `/workflows/new` — visual workflow editor
- `/project-tasks` — prompt-driven project planning, implementation and validation with AI agents
- `/runs` and `/runs/[id]` — execution history and step details
- `/metrics` — metric library and parameter preview
- `/reports` — CSV export
- `/onboarding` and `/login` — onboarding and authentication UI previews
- `/settings` and `/settings/team` — workspace and team settings
- `/integrations` — integration catalog preview

Workflows and run history are read from and saved to the FastAPI backend. Configure `NEXT_PUBLIC_API_URL` to the backend API root (for example `http://localhost:8000/api/v1`) before starting Next.js.

The visual editor supports graph composition and persists node positions and connections. Runs are executed by the backend and the detail page polls for node status and output updates. Independent input/agent/output nodes in a graph layer execute concurrently; dependent nodes run after their inputs finish.

On `/workflows`, describe the goal and acceptance criteria to generate a saved draft with parallel specialist agents and a coordinator. The draft opens in the visual editor so you can revise instructions, connections and model selections before using **Test et**. Cloud prompt submission requires explicit consent. Workflow execution currently runs input, AI-agent and output nodes; other node types fail explicitly until their integrations are implemented.

New workflows start from a runnable multi-agent example: research, product strategy, and risk agents analyze the same task in parallel, then a coordinator agent synthesizes their results. Edit the input node's sample value, choose a configured provider, save, and use **Test et**. The editor shows whether Ollama or Groq is configured and explains the backend setup needed when neither is ready.

The model catalog lists supported choices and whether provider credentials are configured. The workflow runner supports input, AI-agent, Tavily web-search, metric, condition and output nodes. Independent DAG nodes execute in parallel; condition edges use the `Evet`/`Hayır` output handles to route execution and skip the inactive branch. Agent prompt templates support `{{json}}`, `{{input}}`, `{{input.field}}`, and `{{node:node-id.field}}`. Tavily queries require both a configured `TAVILY_API_KEY` and explicit consent in the search node. Runs using providers other than local Ollama require per-run external API consent. Web scraping and Computer Use remain visible in the editor but are not executable yet.

The project-task screen is additive; it does not replace the visual workflow editor. It accepts a project directory and a detailed goal, shows the multi-agent plan/progress and reports changed files, validations, rollback failures and the final handoff. The backend enforces `FLOWMIND_PROJECT_ROOT`; only choose projects you trust because their tests may execute project code. Ollama runs locally; Groq requires `GROQ_API_KEY` on the backend. The token display is an approximate character-based estimate, not provider billing data.

Project prompts are routed as software changes, game development, article writing, Tavily web research, OpenAI image generation, or OpenAI text-to-speech. Article requests create a reviewed Markdown file under `generated-content/`; web research creates a source-linked report under `generated-research/`. Without `TAVILY_API_KEY`, research falls back to the selected language model's existing knowledge and is explicitly marked as not live-verified, without fabricated sources. Software/game task complexity controls model sizing and whether one, two, or up to three implementation agents run in parallel. Image/audio requests require `OPENAI_API_KEY` and the explicit external-API consent checkbox before execution. Generated PNGs and MP3s are saved under `generated-assets/` and `generated-audio/` in the selected project. Media generation may incur charges. Audio input is limited to 4,000 characters. Video generation is not implemented. Game builds and interactive play are not simulated; only existing safe test commands are run, otherwise validation is marked skipped.

## Quality checks

```bash
npm run lint
npm run build
```
