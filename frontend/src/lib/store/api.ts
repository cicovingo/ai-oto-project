import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ModelProvider } from "@/lib/models";
import type { Workflow, WorkflowRun } from "@/lib/store/workflows-slice";

type WorkflowRunRequest = {
  inputs: Record<string, unknown>;
  allowExternalApi?: boolean;
};
export type ProjectTask = {
  id: string;
  projectName: string;
  projectPath: string;
  goal: string;
  provider: string;
  model: string;
  tokenBudget: number;
  estimatedTokens: number;
  status: "queued" | "running" | "completed" | "failed" | "needs_configuration";
  stage: string;
  taskType:
    | "software"
    | "game_development"
    | "article_writing"
    | "web_search"
    | "image_generation"
    | "audio_generation"
    | "video_generation";
  complexity: "simple" | "moderate" | "complex";
  routingSummary?: string | null;
  requiredIntegrations: string[];
  planSummary?: string | null;
  plan: { id: string; role: string; objective: string; files: string[] }[];
  steps: {
    id: string;
    name: string;
    status: "queued" | "running" | "completed" | "failed" | "skipped";
    detail: string;
  }[];
  fileChanges: { path: string; action: "created" | "updated"; description: string }[];
  validations: { name: string; status: "passed" | "failed" | "skipped"; detail: string }[];
  result?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};
type ProjectTaskRequest = {
  projectPath: string;
  goal: string;
  provider: string;
  model: string;
  tokenBudget: number;
  allowExternalApi: boolean;
};
type WorkflowGenerationRequest = {
  goal: string;
  provider: string;
  model: string;
  allowExternalApi: boolean;
};
type RunQueryArg = { workspaceId: string; runId: string };
type RunActionArg = RunQueryArg & { workflowId: string };

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api/v1";

export const flowmindApi = createApi({
  reducerPath: "flowmindApi",
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: ["Workflow", "Run", "ProjectTask"],
  endpoints: (builder) => ({
    getModelCatalog: builder.query<ModelProvider[], void>({
      query: () => "/models",
    }),
    getWorkflows: builder.query<Workflow[], string>({
      query: (workspaceId) => `/workspaces/${workspaceId}/workflows`,
      providesTags: ["Workflow"],
    }),
    getWorkflow: builder.query<Workflow, { workspaceId: string; workflowId: string }>({
      query: ({ workspaceId, workflowId }) =>
        `/workspaces/${workspaceId}/workflows/${workflowId}`,
      providesTags: (_result, _error, { workflowId }) => [
        { type: "Workflow", id: workflowId },
      ],
    }),
    generateWorkflow: builder.mutation<
      Workflow,
      { workspaceId: string; request: WorkflowGenerationRequest }
    >({
      query: ({ workspaceId, request }) => ({
        url: `/workspaces/${workspaceId}/workflows/generate`,
        method: "POST",
        body: request,
      }),
      invalidatesTags: ["Workflow"],
    }),
    getRuns: builder.query<WorkflowRun[], string>({
      query: (workspaceId) => `/workspaces/${workspaceId}/runs`,
      providesTags: ["Run"],
    }),
    getProjectTaskConfig: builder.query<
      {
        allowedProjectRoot: string;
        webSearchConfigured: boolean;
        imageGenerationConfigured: boolean;
      },
      void
    >({
      query: () => "/workspaces/demo/project-tasks/config",
    }),
    getProjectTasks: builder.query<ProjectTask[], string>({
      query: (workspaceId) => `/workspaces/${workspaceId}/project-tasks`,
      providesTags: ["ProjectTask"],
    }),
    getProjectTask: builder.query<ProjectTask, { workspaceId: string; taskId: string }>({
      query: ({ workspaceId, taskId }) =>
        `/workspaces/${workspaceId}/project-tasks/${taskId}`,
      providesTags: (_result, _error, { taskId }) => [
        { type: "ProjectTask", id: taskId },
      ],
    }),
    createProjectTask: builder.mutation<
      ProjectTask,
      { workspaceId: string; request: ProjectTaskRequest }
    >({
      query: ({ workspaceId, request }) => ({
        url: `/workspaces/${workspaceId}/project-tasks`,
        method: "POST",
        body: request,
      }),
      invalidatesTags: ["ProjectTask"],
    }),
    getRun: builder.query<WorkflowRun, RunQueryArg>({
      query: ({ workspaceId, runId }) => `/workspaces/${workspaceId}/runs/${runId}`,
      providesTags: (_result, _error, { runId }) => [{ type: "Run", id: runId }],
    }),
    createWorkflow: builder.mutation<Workflow, { workspaceId: string; workflow: Workflow }>({
      query: ({ workspaceId, workflow }) => ({
        url: `/workspaces/${workspaceId}/workflows`,
        method: "POST",
        body: workflow,
      }),
      invalidatesTags: ["Workflow"],
    }),
    updateWorkflow: builder.mutation<Workflow, { workspaceId: string; workflow: Workflow }>({
      query: ({ workspaceId, workflow }) => ({
        url: `/workspaces/${workspaceId}/workflows/${workflow.id}`,
        method: "PUT",
        body: workflow,
      }),
      invalidatesTags: (_result, _error, { workflow }) => [
        "Workflow",
        { type: "Workflow", id: workflow.id },
      ],
    }),
    deleteWorkflow: builder.mutation<void, { workspaceId: string; workflowId: string }>({
      query: ({ workspaceId, workflowId }) => ({
        url: `/workspaces/${workspaceId}/workflows/${workflowId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Workflow"],
    }),
    startWorkflowRun: builder.mutation<
      WorkflowRun,
      { workspaceId: string; workflowId: string; request: WorkflowRunRequest }
    >({
      query: ({ workspaceId, workflowId, request }) => ({
        url: `/workspaces/${workspaceId}/workflows/${workflowId}/runs`,
        method: "POST",
        body: request,
      }),
      invalidatesTags: ["Run", "Workflow"],
    }),
    cancelWorkflowRun: builder.mutation<WorkflowRun, RunActionArg>({
      query: ({ workspaceId, workflowId, runId }) => ({
        url: `/workspaces/${workspaceId}/workflows/${workflowId}/runs/${runId}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { runId }) => [
        "Run",
        { type: "Run", id: runId },
      ],
    }),
  }),
});

export const {
  useCancelWorkflowRunMutation,
  useCreateProjectTaskMutation,
  useCreateWorkflowMutation,
  useDeleteWorkflowMutation,
  useGetModelCatalogQuery,
  useGenerateWorkflowMutation,
  useGetProjectTaskConfigQuery,
  useGetProjectTaskQuery,
  useGetProjectTasksQuery,
  useGetRunQuery,
  useGetWorkflowQuery,
  useGetWorkflowsQuery,
  useGetRunsQuery,
  useStartWorkflowRunMutation,
  useUpdateWorkflowMutation,
} = flowmindApi;
