import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Edge, Node } from "@xyflow/react";

export type WorkflowStatus = "Active" | "Draft" | "Paused";
export type WorkflowFilter = "all" | "active" | "drafts";
export type NodeKind =
  | "input"
  | "agent"
  | "web_search"
  | "web_scraper"
  | "computer_use"
  | "metric"
  | "condition"
  | "output";
export type WorkflowNodeData = {
  label: string;
  description: string;
  kind: NodeKind;
  config: Record<string, string>;
};
export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export type Workflow = {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  runs: number;
  updatedAt: string;
  icon: "bot" | "branch" | "gauge";
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type RunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type WorkflowRun = {
  id: string;
  workflowId: string;
  workflowName: string;
  status: RunStatus;
  startedAt: string;
  duration: string;
  score: number | null;
  trigger: "Manual" | "Scheduled";
  steps: {
    id: string;
    name: string;
    status: "queued" | "running" | "completed" | "failed" | "skipped";
    duration: string;
    detail: string;
  }[];
  outputs?: Record<string, unknown> | null;
};

type WorkflowsState = {
  items: Workflow[];
  runs: WorkflowRun[];
  search: string;
  filter: WorkflowFilter;
};

const initialWorkflows: Workflow[] = [
  {
    id: "workflow-support",
    name: "Müşteri destek asistanı",
    description: "Gelen talepleri sınıflandırır ve yanıt önerir",
    status: "Active",
    runs: 842,
    updatedAt: "12 dk önce",
    icon: "bot",
    version: 3,
    nodes: [
      {
        id: "support-input",
        type: "workflow",
        position: { x: 70, y: 130 },
        data: {
          label: "Talep girdisi",
          description: "Kullanıcı mesajını al",
          kind: "input",
          config: { field: "message", value: "Sipariş durumumu öğrenmek istiyorum." },
        },
      },
      {
        id: "support-agent",
        type: "workflow",
        position: { x: 340, y: 130 },
        data: {
          label: "Destek ajanı",
          description: "Talebi sınıflandır ve yanıtla",
          kind: "agent",
          config: {
            provider: "openai",
            model: "gpt-4.1-mini",
            temperature: "0.3",
            maxTokens: "512",
            topP: "1",
            instructions: "Nazik ve kısa yanıt ver.",
          },
        },
      },
      {
        id: "support-output",
        type: "workflow",
        position: { x: 610, y: 130 },
        data: {
          label: "Yanıt çıktısı",
          description: "Önerilen yanıtı döndür",
          kind: "output",
          config: { field: "response" },
        },
      },
    ],
    edges: [
      { id: "support-edge-1", source: "support-input", target: "support-agent", animated: true },
      { id: "support-edge-2", source: "support-agent", target: "support-output", animated: true },
    ],
  },
  {
    id: "workflow-lead",
    name: "Potansiyel müşteri analizi",
    description: "Lead kalitesini puanlar ve ekibe yönlendirir",
    status: "Active",
    runs: 316,
    updatedAt: "1 saat önce",
    icon: "branch",
    version: 2,
    nodes: [],
    edges: [],
  },
  {
    id: "workflow-evaluator",
    name: "Yanıt kalite değerlendiricisi",
    description: "Model yanıtlarını seçili metriklerle ölçer",
    status: "Draft",
    runs: 96,
    updatedAt: "Dün",
    icon: "gauge",
    version: 1,
    nodes: [],
    edges: [],
  },
  {
    id: "workflow-knowledge",
    name: "Bilgi bankası kontrolü",
    description: "Kaynak uygunluğunu ve yanıt doğruluğunu denetler",
    status: "Paused",
    runs: 30,
    updatedAt: "3 gün önce",
    icon: "bot",
    version: 1,
    nodes: [],
    edges: [],
  },
];

const initialRuns: WorkflowRun[] = [
  {
    id: "run-1008",
    workflowId: "workflow-support",
    workflowName: "Müşteri destek asistanı",
    status: "completed",
    startedAt: "Bugün, 10:42",
    duration: "1,24 sn",
    score: 0.96,
    trigger: "Manual",
    steps: [
      { id: "step-1", name: "Talep girdisi", status: "completed", duration: "0,08 sn", detail: "Girdi başarıyla alındı." },
      { id: "step-2", name: "Destek ajanı", status: "completed", duration: "1,02 sn", detail: "Yanıt üretildi ve temel kontrollerden geçti." },
      { id: "step-3", name: "Yanıt çıktısı", status: "completed", duration: "0,14 sn", detail: "Çıktı hazırlandı." },
    ],
  },
  {
    id: "run-1007",
    workflowId: "workflow-lead",
    workflowName: "Potansiyel müşteri analizi",
    status: "completed",
    startedAt: "Bugün, 09:18",
    duration: "2,87 sn",
    score: 0.91,
    trigger: "Scheduled",
    steps: [
      { id: "step-1", name: "Lead girdisi", status: "completed", duration: "0,12 sn", detail: "Kayıt doğrulandı." },
      { id: "step-2", name: "Lead puanlama", status: "completed", duration: "2,41 sn", detail: "Puan hesaplandı." },
      { id: "step-3", name: "Yönlendirme", status: "completed", duration: "0,34 sn", detail: "Kayıt satış kuyruğuna eklendi." },
    ],
  },
  {
    id: "run-1006",
    workflowId: "workflow-support",
    workflowName: "Müşteri destek asistanı",
    status: "failed",
    startedAt: "Bugün, 08:51",
    duration: "0,42 sn",
    score: null,
    trigger: "Manual",
    steps: [
      { id: "step-1", name: "Talep girdisi", status: "completed", duration: "0,06 sn", detail: "Girdi başarıyla alındı." },
      { id: "step-2", name: "Destek ajanı", status: "failed", duration: "0,36 sn", detail: "Demo çalıştırma hatası: gerekli bağlam girdisi eksik." },
      { id: "step-3", name: "Yanıt çıktısı", status: "skipped", duration: "—", detail: "Önceki adım başarısız olduğu için atlandı." },
    ],
  },
];

const initialState: WorkflowsState = {
  items: [],
  runs: [],
  search: "",
  filter: "all",
};

const workflowsSlice = createSlice({
  name: "workflows",
  initialState,
  reducers: {
    hydrateWorkflows(
      state,
      action: PayloadAction<{ items: Workflow[]; runs: WorkflowRun[] }>,
    ) {
      state.items = action.payload.items;
      state.runs = action.payload.runs;
    },
    setWorkflowSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setWorkflowFilter(state, action: PayloadAction<WorkflowFilter>) {
      state.filter = action.payload;
    },
    addWorkflow(state, action: PayloadAction<Workflow>) {
      state.items.unshift(action.payload);
    },
    saveWorkflow(state, action: PayloadAction<Workflow>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index === -1) {
        state.items.unshift(action.payload);
      } else {
        state.items[index] = action.payload;
      }
    },
    deleteWorkflow(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    createRun(state, action: PayloadAction<WorkflowRun>) {
      state.runs.unshift(action.payload);
      const workflow = state.items.find((item) => item.id === action.payload.workflowId);
      if (workflow) workflow.runs += 1;
    },
    updateRunStatus(
      state,
      action: PayloadAction<{
        id: string;
        status: RunStatus;
        duration?: string;
        score?: number | null;
      }>,
    ) {
      const run = state.runs.find((item) => item.id === action.payload.id);
      if (
        run &&
        run.status !== "completed" &&
        run.status !== "failed" &&
        run.status !== "cancelled"
      ) {
        run.status = action.payload.status;
        if (action.payload.duration) run.duration = action.payload.duration;
        if (action.payload.score !== undefined) run.score = action.payload.score;
      }
    },
  },
});

export const {
  addWorkflow,
  createRun,
  deleteWorkflow,
  hydrateWorkflows,
  saveWorkflow,
  setWorkflowFilter,
  setWorkflowSearch,
  updateRunStatus,
} = workflowsSlice.actions;
export { initialRuns, initialWorkflows };
export default workflowsSlice.reducer;
