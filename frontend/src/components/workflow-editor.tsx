"use client";

import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Braces,
  Check,
  CircleHelp,
  Globe,
  GitBranch,
  Gauge,
  Play,
  Plus,
  Save,
  Share2,
  Sparkles,
  Trash2,
  MonitorPlay,
  Workflow as WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace-shell";
import { fallbackModelCatalog } from "@/lib/models";
import {
  useGetModelCatalogQuery,
  useGetProjectTaskConfigQuery,
} from "@/lib/store/api";
import {
  useCreateWorkflowMutation,
  useGetWorkflowQuery,
  useStartWorkflowRunMutation,
  useUpdateWorkflowMutation,
} from "@/lib/store/api";
import type {
  NodeKind,
  Workflow,
  WorkflowEdge,
  WorkflowNode,
} from "@/lib/store/workflows-slice";

type ConfigField = {
  key: string;
  label: string;
  placeholder?: string;
  control?: "text" | "textarea" | "number" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
};

type ConfigSection = { title: string; fields: ConfigField[] };

const modelSettings: ConfigField[] = [
  { key: "provider", label: "Model sağlayıcısı", control: "select", required: true },
  { key: "model", label: "Model", control: "select", required: true },
  { key: "temperature", label: "Temperature", control: "number", min: 0, max: 2, step: 0.1, required: true },
  { key: "maxTokens", label: "Maksimum çıktı tokenı", control: "number", min: 1, max: 32768, step: 1, required: true },
  { key: "topP", label: "Top P", control: "number", min: 0, max: 1, step: 0.05, required: true },
];

const agentInstructions: ConfigField = {
  key: "instructions",
  label: "Sistem talimatları",
  placeholder: "Ajanın görevini, sınırlarını ve beklenen çıktıyı tanımlayın...",
  control: "textarea",
  required: true,
};

const nodeDetails: Record<NodeKind, { label: string; description: string; icon: typeof Bot }> = {
  input: { label: "Girdi", description: "Akışa veri sağlar", icon: Braces },
  agent: { label: "AI ajanı", description: "Model ile talimatlara göre çalışır", icon: Bot },
  web_search: { label: "Web arama ajanı", description: "Web'de arama yapıp kaynakları özetler", icon: Globe },
  web_scraper: { label: "Web scraping ajanı", description: "Web sayfalarından yapılandırılmış veri toplar", icon: Braces },
  computer_use: { label: "Computer Use ajanı", description: "Onaylı tarayıcı adımlarını planlar", icon: MonitorPlay },
  metric: { label: "Metrik", description: "Model çıktısını değerlendirir", icon: Gauge },
  condition: { label: "Koşul", description: "Bir koşula göre akışı yönlendirir", icon: GitBranch },
  output: { label: "Çıktı", description: "Akış sonucunu sunar", icon: Sparkles },
};

const configSections: Record<NodeKind, ConfigSection[]> = {
  input: [
    {
      title: "Girdi",
      fields: [
        { key: "field", label: "Girdi alanı", placeholder: "message", required: true },
        { key: "value", label: "Örnek değer", placeholder: "Test girdisini yaz...", required: true },
      ],
    },
  ],
  agent: [
    { title: "Model yapılandırması", fields: modelSettings },
    {
      title: "Girdi",
      fields: [
        {
          key: "prompt",
          label: "Prompt şablonu",
          placeholder: "Gelen veriyi kullan: {{json}}",
          control: "textarea",
        },
      ],
    },
    { title: "Ajan talimatları", fields: [agentInstructions] },
  ],
  web_search: [
    { title: "Model yapılandırması", fields: modelSettings },
    {
      title: "Web arama",
      fields: [
        { key: "query", label: "Arama sorgusu", placeholder: "Akış girdisini veya sabit sorguyu kullan", required: true },
        {
          key: "searchProvider",
          label: "Arama sağlayıcısı",
          control: "select",
          options: [
            { value: "tavily", label: "Tavily" },
            { value: "serpapi", label: "SerpAPI" },
            { value: "bing", label: "Bing Web Search" },
          ],
        },
        { key: "resultCount", label: "Sonuç sayısı", control: "number", min: 1, max: 20, step: 1, required: true },
        { key: "allowExternalApi", label: "Tavily'e arama sorgusu göndermeye izin ver", control: "checkbox", required: true },
        {
          key: "recency",
          label: "Zaman aralığı",
          control: "select",
          options: [
            { value: "any", label: "Fark etmez" },
            { value: "day", label: "Son 24 saat" },
            { value: "week", label: "Son hafta" },
            { value: "month", label: "Son ay" },
          ],
        },
        { ...agentInstructions, required: false },
      ],
    },
  ],
  web_scraper: [
    { title: "Model yapılandırması", fields: modelSettings },
    {
      title: "Web scraping",
      fields: [
        { key: "url", label: "Başlangıç URL'si", placeholder: "https://example.com", required: true },
        { key: "selectors", label: "CSS seçiciler", placeholder: "h1, article p" },
        { key: "maxPages", label: "Maksimum sayfa", control: "number", min: 1, max: 100, step: 1, required: true },
        { key: "followLinks", label: "Aynı alan adındaki bağlantıları izle", control: "checkbox" },
        { ...agentInstructions, required: false },
      ],
    },
  ],
  computer_use: [
    { title: "Model yapılandırması", fields: modelSettings },
    {
      title: "Computer Use",
      fields: [
        { key: "task", label: "Görev", placeholder: "Tarayıcıda yapılacak işi tanımlayın...", control: "textarea", required: true },
        { key: "startUrl", label: "Başlangıç URL'si", placeholder: "https://example.com" },
        { key: "allowedDomains", label: "İzin verilen alan adları", placeholder: "example.com, app.example.com", required: true },
        { key: "maxSteps", label: "Maksimum adım", control: "number", min: 1, max: 30, step: 1, required: true },
        { key: "requireApproval", label: "İşlemlerden önce kullanıcı onayı iste", control: "checkbox" },
      ],
    },
  ],
  metric: [
    {
      title: "Metrik ayarları",
      fields: [
        {
          key: "metric",
          label: "Metrik",
          control: "select",
          required: true,
          options: [
            { value: "text_length", label: "Metin uzunluğu" },
            { value: "word_count", label: "Kelime sayısı" },
            { value: "numeric_score", label: "Sayısal değer" },
            { value: "contains", label: "Metin içeriyor" },
            { value: "json_valid", label: "Geçerli JSON" },
          ],
        },
        { key: "threshold", label: "Minimum eşik", placeholder: "100", control: "number", min: 0, max: 1000000, step: 1, required: true },
        { key: "value", label: "Aranacak metin (contains metriği için)", placeholder: "beklenen ifade" },
      ],
    },
  ],
  condition: [
    {
      title: "Koşul ayarları",
      fields: [
        { key: "field", label: "Gelen verideki alan", placeholder: "passed", required: true },
        {
          key: "operator",
          label: "Karşılaştırma",
          control: "select",
          options: [
            { value: "exists", label: "Değer mevcut" },
            { value: "equals", label: "Eşittir" },
            { value: "not_equals", label: "Eşit değildir" },
            { value: "contains", label: "İçerir" },
            { value: "gt", label: "Büyüktür" },
            { value: "gte", label: "Büyük veya eşittir" },
            { value: "lt", label: "Küçüktür" },
            { value: "lte", label: "Küçük veya eşittir" },
          ],
        },
        { key: "value", label: "Karşılaştırma değeri", placeholder: "true" },
      ],
    },
  ],
  output: [
    { title: "Çıktı", fields: [{ key: "field", label: "Çıktı alanı", placeholder: "response", required: true }] },
  ],
};

function defaultConfig(kind: NodeKind): Record<string, string> {
  const config: Record<string, string> = {};
  for (const section of configSections[kind]) {
    for (const field of section.fields) {
      if (field.control === "checkbox") config[field.key] = "false";
    }
  }
  if (["agent", "web_search", "web_scraper", "computer_use"].includes(kind)) {
    Object.assign(config, {
      provider: "ollama",
      model: "llama3.2",
      temperature: "0.3",
      maxTokens: "1024",
      topP: "1",
    });
  }
  if (kind === "agent") config.instructions = "";
  if (kind === "agent") config.prompt = "{{json}}";
  if (kind === "web_search") Object.assign(config, { query: "{{json}}", searchProvider: "tavily", resultCount: "5", recency: "any", allowExternalApi: "false" });
  if (kind === "web_scraper") Object.assign(config, { url: "", selectors: "", maxPages: "5", followLinks: "false" });
  if (kind === "computer_use") Object.assign(config, { task: "", startUrl: "", allowedDomains: "", maxSteps: "10", requireApproval: "true" });
  if (kind === "input") Object.assign(config, { field: "message", value: "" });
  if (kind === "metric") Object.assign(config, { metric: "text_length", threshold: "100" });
  if (kind === "condition") Object.assign(config, { field: "passed", operator: "equals", value: "true" });
  if (kind === "output") config.field = "response";
  return config;
}

function fieldsFor(kind: NodeKind): ConfigField[] {
  return configSections[kind].flatMap((section) => section.fields);
}

function WorkflowNodeCard({ data, selected }: NodeProps<WorkflowNode>) {
  const { icon: Icon } = nodeDetails[data.kind];
  return (
    <div
      className={`min-w-[210px] rounded-xl border bg-card shadow-sm ${
        selected ? "border-primary ring-2 ring-primary/15" : "border-border"
      }`}
    >
      {data.kind !== "input" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!size-2.5 !border-2 !border-background !bg-primary"
        />
      )}
      <div className="flex items-center gap-3 px-3.5 py-3">
        <span className="grid size-9 place-items-center rounded-lg bg-primary/8 text-primary">
          <Icon className="size-[17px]" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{data.label}</p>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {nodeDetails[data.kind].label}
          </p>
        </div>
      </div>
      <p className="border-t border-border/70 px-3.5 py-2 text-[10px] text-muted-foreground">
        {data.description}
      </p>
      {data.kind === "condition" ? (
        <>
          <span className="absolute right-[-32px] top-[35px] text-[9px] text-muted-foreground">Evet</span>
          <Handle
            id="true"
            type="source"
            position={Position.Right}
            style={{ top: 35 }}
            className="!size-2.5 !border-2 !border-background !bg-emerald-500"
          />
          <span className="absolute right-[-32px] top-[63px] text-[9px] text-muted-foreground">Hayır</span>
          <Handle
            id="false"
            type="source"
            position={Position.Right}
            style={{ top: 63 }}
            className="!size-2.5 !border-2 !border-background !bg-amber-500"
          />
        </>
      ) : data.kind !== "output" ? (
        <Handle
          type="source"
          position={Position.Right}
          className="!size-2.5 !border-2 !border-background !bg-primary"
        />
      ) : null}
    </div>
  );
}

const nodeTypes: NodeTypes = { workflow: WorkflowNodeCard };

function starterNodes(): WorkflowNode[] {
  const task =
    "Yapay zeka destekli kişisel finans uygulaması fikrini değerlendir. Hedef kullanıcıları, temel ihtiyaçları, riskleri ve 90 günlük MVP yol haritasını incele.";
  const makeAgent = (
    id: string,
    label: string,
    description: string,
    instructions: string,
    position: { x: number; y: number },
  ): WorkflowNode => ({
    id,
    type: "workflow",
    position,
    data: {
      label,
      description,
      kind: "agent",
      config: {
        ...defaultConfig("agent"),
        instructions,
      },
    },
  });

  return [
    {
      id: "new-input",
      type: "workflow",
      position: { x: 50, y: 210 },
      data: {
        label: "Görev girdisi",
        description: "Uzman ajanlara iletilecek görev",
        kind: "input",
        config: { field: "task", value: task },
      },
    },
    makeAgent(
      "new-research-agent",
      "Araştırma ajanı",
      "Kullanıcı ihtiyacını ve varsayımları inceler",
      "Ürün araştırmacısı olarak gelen görevi analiz et. Hedef kullanıcıları, çözülmesi gereken sorunları ve doğrulanması gereken varsayımları belirle. Bilinmeyenleri gerçek gibi sunma; kısa ve yapılandırılmış yanıt ver.",
      { x: 350, y: 40 },
    ),
    makeAgent(
      "new-product-agent",
      "Ürün stratejisi ajanı",
      "MVP kapsamını ve öncelikleri çıkarır",
      "Kıdemli ürün yöneticisi olarak gelen görevi analiz et. Kullanıcı değeri, temel özellikler, önceliklendirilmiş MVP kapsamı ve ölçülebilir başarı kriterleri öner. Önerileri uygulanabilir ve kısa tut.",
      { x: 350, y: 210 },
    ),
    makeAgent(
      "new-risk-agent",
      "Risk ve güvenlik ajanı",
      "Riskleri ve azaltma adımlarını değerlendirir",
      "Risk analisti olarak gelen görevi değerlendir. Gizlilik, güvenlik, mevzuat, operasyon ve ürün risklerini; her biri için somut azaltma adımlarıyla listele. Emin olmadığın noktaları varsayım olarak işaretle.",
      { x: 350, y: 380 },
    ),
    makeAgent(
      "new-synthesis-agent",
      "Koordinatör ajan",
      "Uzman yanıtlarını birleştirip nihai planı üretir",
      "Koordinatör olarak sana verilen uzman ajan yanıtlarını birleştir. Çelişkileri ve ortak noktaları belirt; kaynak yanıtlarda olmayan bilgi uydurma. Sonucu şu başlıklarla ver: Yönetici özeti, hedef kullanıcı, MVP kapsamı, riskler ve azaltma adımları, 90 günlük yol haritası, doğrulanması gereken varsayımlar.",
      { x: 700, y: 210 },
    ),
    {
      id: "new-output",
      type: "workflow",
      position: { x: 1020, y: 210 },
      data: {
        label: "Nihai plan",
        description: "Koordinatörün birleştirdiği sonucu döndürür",
        kind: "output",
        config: { field: "finalPlan" },
      },
    },
  ];
}

function wouldCreateCycle(source: string, target: string, edges: WorkflowEdge[]) {
  const pending = [target];
  const visited = new Set<string>();

  while (pending.length) {
    const current = pending.pop();
    if (!current) continue;
    if (current === source) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const edge of edges) {
      if (edge.source === current) pending.push(edge.target);
    }
  }

  return source === target;
}

export function WorkflowEditor() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const workflowQuery = useGetWorkflowQuery(
    { workspaceId: "demo", workflowId: id },
    { skip: id === "new" },
  );
  const storedWorkflow = id === "new" ? null : workflowQuery.data ?? null;

  if (id !== "new" && workflowQuery.isLoading) {
    return (
      <WorkspaceShell>
        <p className="text-sm text-muted-foreground">İş akışı backend’den yükleniyor...</p>
      </WorkspaceShell>
    );
  }
  if (id !== "new" && (workflowQuery.isError || !storedWorkflow)) {
    return (
      <WorkspaceShell>
        <div role="alert" className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">İş akışı backend’den alınamadı.</p>
          <Link href="/workflows" className="mt-3 inline-block text-sm text-primary">
            İş akışlarına dön
          </Link>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkflowEditorCanvas
      key={`${id}:${storedWorkflow?.version ?? "new"}`}
      id={id}
      storedWorkflow={storedWorkflow}
    />
  );
}

function WorkflowEditorCanvas({
  id,
  storedWorkflow,
}: {
  id: string;
  storedWorkflow: Workflow | null;
}) {
  const router = useRouter();
  const modelCatalogQuery = useGetModelCatalogQuery();
  const projectTaskConfigQuery = useGetProjectTaskConfigQuery();
  const [createWorkflow, createState] = useCreateWorkflowMutation();
  const [updateWorkflow, updateState] = useUpdateWorkflowMutation();
  const [startWorkflowRun, runState] = useStartWorkflowRunMutation();
  const isPersisting = createState.isLoading || updateState.isLoading;
  const modelCatalog = modelCatalogQuery.data ?? fallbackModelCatalog;
  const [name, setName] = useState(
    storedWorkflow?.name ?? "Çoklu ajan ürün değerlendirmesi",
  );
  const [description, setDescription] = useState(
    storedWorkflow?.description ??
      "Araştırma, ürün stratejisi ve risk ajanları paralel çalışır; koordinatör ortak bir plan üretir.",
  );
  const [nodes, setNodes] = useState<WorkflowNode[]>(
    storedWorkflow?.nodes ?? (id === "new" ? starterNodes() : []),
  );
  const [edges, setEdges] = useState<WorkflowEdge[]>(
    storedWorkflow?.edges ??
      (id === "new"
        ? [
            { id: "new-edge-1", source: "new-input", target: "new-research-agent", animated: true },
            { id: "new-edge-2", source: "new-input", target: "new-product-agent", animated: true },
            { id: "new-edge-3", source: "new-input", target: "new-risk-agent", animated: true },
            { id: "new-edge-4", source: "new-research-agent", target: "new-synthesis-agent", animated: true },
            { id: "new-edge-5", source: "new-product-agent", target: "new-synthesis-agent", animated: true },
            { id: "new-edge-6", source: "new-risk-agent", target: "new-synthesis-agent", animated: true },
            { id: "new-edge-7", source: "new-synthesis-agent", target: "new-output", animated: true },
          ]
        : []),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [hasChanges, setHasChanges] = useState(!storedWorkflow || id === "new");
  const [allowExternalApi, setAllowExternalApi] = useState(false);

  const workflowNodes = useMemo(() => {
    if (id !== "new") return nodes;
    const availableProvider = modelCatalog.find(
      (provider) => provider.isConfigured && provider.models.length > 0,
    );
    if (!availableProvider) return nodes;
    return nodes.map((node) => {
      if (
        node.data.kind !== "agent" ||
        node.data.config.provider !== "ollama" ||
        node.data.config.model !== "llama3.2" ||
        availableProvider.models.some((model) => model.id === "llama3.2")
      ) {
        return node;
      }
      return {
        ...node,
        data: {
          ...node.data,
          config: {
            ...node.data.config,
            provider: availableProvider.id,
            model: availableProvider.models[0].id,
          },
        },
      };
    });
  }, [id, modelCatalog, nodes]);

  const selectedNode = workflowNodes.find((node) => node.id === selectedId) ?? null;
  const hasRunnableProvider = modelCatalog.some(
    (provider) => provider.isConfigured && provider.models.length > 0,
  );
  const usesRemoteModel = workflowNodes.some(
    (node) =>
      ["agent", "web_search"].includes(node.data.kind) &&
      node.data.config.provider !== "ollama",
  );

  const onNodesChange = useCallback((changes: NodeChange<WorkflowNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
    if (changes.some((change) => change.type === "position" || change.type === "remove")) {
      setHasChanges(true);
    }
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange<WorkflowEdge>[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
    setHasChanges(true);
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((current) => addEdge({ ...connection, animated: true }, current));
    setHasChanges(true);
  }, []);

  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("İş akışı adı boş bırakılamaz.");
    if (!workflowNodes.some((node) => node.data.kind === "input")) {
      errors.push("Akışta en az bir girdi düğümü bulunmalı.");
    }
    if (!workflowNodes.some((node) => node.data.kind === "output")) {
      errors.push("Akışta en az bir çıktı düğümü bulunmalı.");
    }
    if (workflowNodes.length > 1 && edges.length === 0) {
      errors.push("Düğümler arasında en az bir bağlantı oluştur.");
    }
    if (edges.some((edge) => wouldCreateCycle(edge.source, edge.target, edges.filter((item) => item.id !== edge.id)))) {
      errors.push("İş akışında döngü bulundu. Düğümleri döngüsüz bir sıraya bağla.");
    }
    const inputIds = workflowNodes
      .filter((node) => node.data.kind === "input")
      .map((node) => node.id);
    const reachable = new Set(inputIds);
    const pending = [...inputIds];
    while (pending.length) {
      const current = pending.pop();
      if (!current) continue;
      for (const edge of edges) {
        if (edge.source === current && !reachable.has(edge.target)) {
          reachable.add(edge.target);
          pending.push(edge.target);
        }
      }
    }
    for (const node of workflowNodes) {
      if (node.data.kind !== "input" && !reachable.has(node.id)) {
        errors.push(`${node.data.label}: girdi düğümünden erişilemiyor.`);
      }
      if (
        (node.data.kind === "input" && edges.some((edge) => edge.target === node.id)) ||
        (node.data.kind === "output" && edges.some((edge) => edge.source === node.id))
      ) {
        errors.push(`${node.data.label}: bağlantı yönü bu düğüm türü için geçersiz.`);
      }
    }
    for (const node of workflowNodes) {
      if (
        node.data.kind === "web_search" &&
        node.data.config.allowExternalApi !== "true"
      ) {
        errors.push(
          `${node.data.label}: Tavily araması için düğüm ayarlarında harici sorgu onayı ver.`,
        );
      }
      for (const field of fieldsFor(node.data.kind)) {
        const value = node.data.config[field.key] ?? "";
        if (field.required && !value.trim()) {
          errors.push(`${node.data.label}: "${field.label}" alanı zorunlu.`);
        }
        if (field.key === "model" && value.trim()) {
          const provider = modelCatalog.find(
            (item) => item.id === node.data.config.provider,
          );
          const model = provider?.models.find((item) => item.id === value);
          if (
            !model ||
            (node.data.kind === "computer_use" &&
              !model.capabilities.includes("vision"))
          ) {
            errors.push(
              `${node.data.label}: seçilen model bu ajan türüyle uyumlu değil.`,
            );
          }
        }
        if (field.control === "number" && value.trim()) {
          const number = Number(value);
          if (
            !Number.isFinite(number) ||
            (field.min !== undefined && number < field.min) ||
            (field.max !== undefined && number > field.max)
          ) {
            errors.push(
              `${node.data.label}: "${field.label}" ${field.min} ile ${field.max} arasında olmalı.`,
            );
          }
        }
      }
      if (
        node.data.kind === "web_scraper" &&
        node.data.config.url.trim() &&
        !node.data.config.url.trim().toLowerCase().startsWith("https://")
      ) {
        errors.push(`${node.data.label}: başlangıç URL'si HTTPS olmalı.`);
      }
      if (node.data.kind === "computer_use") {
        const domains = (node.data.config.allowedDomains ?? "")
          .split(",")
          .map((domain) => domain.trim());
        if (
          domains.some(
            (domain) =>
              !domain ||
              !domain.includes(".") ||
              !/^[a-z0-9.-]+$/i.test(domain) ||
              domain.includes(".."),
          )
        ) {
          errors.push(
            `${node.data.label}: yalnızca geçerli ve açık alan adları girilmeli.`,
          );
        }
        if (node.data.config.requireApproval !== "true") {
          errors.push(`${node.data.label}: kullanıcı onayı açık olmalı.`);
        }
      }
    }
    return errors;
  }, [edges, modelCatalog, name, workflowNodes]);

  function makeWorkflow(): Workflow {
    const savedNodes = workflowNodes.map((node) => {
      const savedNode = { ...node };
      delete savedNode.selected;
      delete savedNode.dragging;
      delete savedNode.resizing;
      delete savedNode.measured;
      delete savedNode.width;
      delete savedNode.height;
      return savedNode;
    });
    const savedEdges = edges.map((edge) => {
      const savedEdge = { ...edge };
      delete savedEdge.selected;
      return savedEdge;
    });
    return {
      id: id === "new" ? `workflow-${crypto.randomUUID()}` : id,
      name: name.trim() || "Yeni iş akışı",
      description: description.trim() || "Yeni AI iş akışı",
      status: storedWorkflow?.status ?? "Draft",
      runs: storedWorkflow?.runs ?? 0,
      updatedAt: "Şimdi",
      icon: "branch",
      version: (storedWorkflow?.version ?? 0) + 1,
      nodes: savedNodes,
      edges: savedEdges,
    };
  }

  async function persistWorkflow(workflow: Workflow) {
    if (id === "new") {
      await createWorkflow({ workspaceId: "demo", workflow }).unwrap();
    } else {
      await updateWorkflow({ workspaceId: "demo", workflow }).unwrap();
    }
    setHasChanges(false);
    if (id === "new") router.replace(`/workflows/${workflow.id}`);
  }

  function showPersistenceError(error: unknown) {
    console.error("Workflow backend işlemi başarısız oldu.", error);
    const detail =
      typeof error === "object" &&
      error !== null &&
      "data" in error &&
      typeof error.data === "object" &&
      error.data !== null &&
      "detail" in error.data &&
      typeof error.data.detail === "string"
        ? error.data.detail
        : "Backend bağlantısını ve API hata yanıtını kontrol et.";
    setFeedback(`İşlem tamamlanamadı: ${detail}`);
  }

  async function save() {
    if (validation.length) {
      setValidationErrors(validation);
      setFeedback("");
      return;
    }
    try {
      await persistWorkflow(makeWorkflow());
      setValidationErrors([]);
      setFeedback("İş akışı backend’e kaydedildi.");
    } catch (error) {
      showPersistenceError(error);
    }
  }

  async function publish() {
    if (!validate()) return;
    try {
      await persistWorkflow({ ...makeWorkflow(), status: "Active" });
      setValidationErrors([]);
      setFeedback("İş akışı yayınlandı.");
    } catch (error) {
      showPersistenceError(error);
    }
  }

  async function pauseWorkflow() {
    try {
      await persistWorkflow({ ...makeWorkflow(), status: "Paused" });
      setFeedback("İş akışı duraklatıldı.");
    } catch (error) {
      showPersistenceError(error);
    }
  }

  async function shareWorkflow() {
    if (validation.length) {
      setValidationErrors(validation);
      setFeedback("Paylaşmadan önce akışı doğrula.");
      return;
    }
    const workflow = makeWorkflow();
    try {
      await persistWorkflow(workflow);
    } catch (error) {
      showPersistenceError(error);
      return;
    }
    try {
      const url = `${window.location.origin}/workflows/${workflow.id}`;
      await navigator.clipboard.writeText(url);
      setFeedback("İş akışı kaydedildi ve bağlantı panoya kopyalandı.");
    } catch (error) {
      console.error("Workflow link could not be copied.", error);
      setFeedback("İş akışı kaydedildi, ancak bağlantı panoya kopyalanamadı. Tarayıcı izinlerini kontrol et.");
    }
  }

  function validate() {
    setValidationErrors(validation);
    setFeedback(
      validation.length
        ? "Doğrulama tamamlandı. Düzeltmen gereken alanlar var."
        : "İş akışı doğrulandı; zorunlu alanlar tamam.",
    );
    return validation.length === 0;
  }

  async function runWorkflow() {
    if (!validate()) return;
    if (usesRemoteModel && !allowExternalApi) {
      setValidationErrors([
        "Seçilen akış ajanı yerel Ollama dışındaki sağlayıcıya veri gönderecek. Çalıştırmadan önce harici API onayını işaretle.",
      ]);
      setFeedback("Harici sağlayıcı onayı gerekli.");
      return;
    }
    const supportedNodes = [
      "input",
      "agent",
      "web_search",
      "metric",
      "condition",
      "output",
    ];
    const unsupportedNodes = nodes.filter(
      (node) => !supportedNodes.includes(node.data.kind),
    );
    if (unsupportedNodes.length) {
      const names = unsupportedNodes.map((node) => node.data.label).join(", ");
      setValidationErrors([
        `Bu düğüm türleri henüz çalıştırılamıyor: ${names}. Web scraping ve Computer Use entegrasyonları henüz hazır değil.`,
      ]);
      setFeedback("Desteklenmeyen düğümler için akış başlatılmadı.");
      return;
    }

    const workflow = makeWorkflow();
    try {
      await persistWorkflow(workflow);
      const run = await startWorkflowRun({
        workspaceId: "demo",
        workflowId: workflow.id,
        request: { inputs: {}, allowExternalApi },
      }).unwrap();
      router.push(`/runs/${run.id}`);
    } catch (error) {
      showPersistenceError(error);
    }
  }

  function addNode(kind: NodeKind) {
    const details = nodeDetails[kind];
    const id = `node-${crypto.randomUUID()}`;
    const count = nodes.filter((node) => node.data.kind === kind).length + 1;
    const node: WorkflowNode = {
      id,
      type: "workflow",
      position: { x: 130 + (nodes.length % 3) * 90, y: 100 + nodes.length * 45 },
      data: {
        label: count > 1 ? `${details.label} ${count}` : details.label,
        description: details.description,
        kind,
        config: defaultConfig(kind),
      },
    };
    setNodes((current) => [...current, node]);
    setSelectedId(id);
    setHasChanges(true);
  }

  function updateSelectedNode(key: string, value: string) {
    if (!selectedId) return;
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedId
          ? {
              ...node,
              data: {
                ...node.data,
                label:
                  key === "label" ? value : node.data.label,
                config:
                  key === "label"
                    ? node.data.config
                    : {
                        ...node.data.config,
                        [key]: value,
                        ...(key === "provider" ? { model: "" } : {}),
                      },
              },
            }
          : node,
      ),
    );
    setHasChanges(true);
  }

  function deleteSelectedNode() {
    if (!selectedId) return;
    setNodes((current) => current.filter((node) => node.id !== selectedId));
    setEdges((current) =>
      current.filter((edge) => edge.source !== selectedId && edge.target !== selectedId),
    );
    setSelectedId(null);
    setHasChanges(true);
  }

  return (
    <WorkspaceShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/workflows"
              aria-label="İş akışlarına dön"
              className="grid size-9 place-items-center rounded-lg border border-input bg-background transition hover:bg-muted"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Input
                  aria-label="İş akışı adı"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setHasChanges(true);
                  }}
                  className="h-9 max-w-[320px] border-transparent bg-transparent px-2 text-lg font-semibold shadow-none hover:border-border focus-visible:border-ring"
                />
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {storedWorkflow?.status === "Active" ? "Aktif" : "Taslak"}
                </Badge>
              </div>
              <p className="pl-2 text-xs text-muted-foreground">
                {hasChanges ? "Kaydedilmemiş değişiklikler" : "Tüm değişiklikler kaydedildi"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={shareWorkflow} className="gap-2">
              <Share2 className="size-4" />
              Paylaş
            </Button>
            {storedWorkflow?.status === "Active" ? (
              <Button variant="outline" onClick={pauseWorkflow}>
                Duraklat
              </Button>
            ) : (
              <Button variant="outline" onClick={publish}>
                Yayınla
              </Button>
            )}
            <Button variant="outline" onClick={validate} className="gap-2">
              <Check className="size-4" />
              Doğrula
            </Button>
            <Button variant="outline" onClick={save} className="gap-2" disabled={isPersisting}>
              <Save className="size-4" />
              Kaydet
            </Button>
            <Button onClick={runWorkflow} className="gap-2" disabled={isPersisting || runState.isLoading}>
              <Play className="size-4" />
              Test et
            </Button>
          </div>
        </div>

        <Input
          aria-label="İş akışı açıklaması"
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            setHasChanges(true);
          }}
          placeholder="Bu iş akışı ne yapıyor?"
          className="max-w-2xl bg-card"
        />

        <section className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs leading-5">
          <p className="font-semibold text-foreground">
            Akış motoru: ajanlar paralel çalışabilir; Tavily arama, metrik değerlendirme ve koşullu dallanma desteklenir.
          </p>
          <p className="mt-1 text-muted-foreground">
            Test görevini Girdi düğümündeki “Örnek değer” alanından değiştirebilirsin. Model sağlayıcı durumu:
            {" "}
            {modelCatalogQuery.isLoading
              ? "kontrol ediliyor..."
              : modelCatalogQuery.isError
                ? "backend model kataloğuna ulaşılamadı."
                : modelCatalog
                    .map(
                      (provider) =>
                        `${provider.name} ${
                          provider.isConfigured
                            ? provider.models.length
                              ? "hazır"
                              : "model yüklü değil"
                            : "yapılandırılmamış"
                        }`,
                    )
                    .join(" · ")}
          </p>
          <p className="mt-1 text-muted-foreground">
            Tavily web araması:{" "}
            {projectTaskConfigQuery.isLoading
              ? "yapılandırma kontrol ediliyor..."
              : projectTaskConfigQuery.data?.webSearchConfigured
                ? "API anahtarı algılandı (kullanım kotası olabilir)"
                : "TAVILY_API_KEY backend ortamında algılanmadı"}
          </p>
          {!modelCatalogQuery.isError && !hasRunnableProvider && (
            <p className="mt-1 text-muted-foreground">
              Yerel kullanım için Ollama’yı başlatıp <code>ollama pull llama3.2</code> çalıştır; Groq için backend ortamında
              {" "}
              <code>GROQ_API_KEY</code>
              {" "}
              tanımla. Ollama’daki yüklü modeller listeden otomatik seçilir. Anahtarları frontend’e ekleme.
            </p>
          )}
        </section>

        {usesRemoteModel && (
          <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs leading-5 text-amber-950">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-primary"
              checked={allowExternalApi}
              onChange={(event) => setAllowExternalApi(event.target.checked)}
            />
            <span>
              Seçilen ajan verilerini Ollama dışındaki sağlayıcıya göndermeyi ve
              olası kota/ücret kullanımını onaylıyorum. Tamamen yerel çalıştırma
              için her ajan düğümünde Ollama seç.
            </span>
          </label>
        )}

        {(feedback || validationErrors.length > 0) && (
          <div
            role={validationErrors.length ? "alert" : "status"}
            className={`rounded-lg border px-4 py-3 text-xs ${
              validationErrors.length
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <p className="flex items-center gap-2 font-medium">
              {validationErrors.length ? (
                <AlertCircle className="size-4" />
              ) : (
                <Check className="size-4" />
              )}
              {feedback}
            </p>
            {validationErrors.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1">
                {validationErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="grid min-h-[620px] overflow-hidden rounded-xl border border-border bg-card xl:grid-cols-[230px_minmax(0,1fr)_290px]">
          <aside className="border-b border-border p-4 xl:border-b-0 xl:border-r">
            <h2 className="text-sm font-semibold">Düğüm kütüphanesi</h2>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              Düğüm ekle, sonra çalışma alanında konumlandır.
            </p>
            <div className="mt-4 space-y-2">
              {(Object.keys(nodeDetails) as NodeKind[]).map((kind) => {
                const { label, description, icon: Icon } = nodeDetails[kind];
                return (
                  <button
                    key={kind}
                    onClick={() => addNode(kind)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border/80 p-2.5 text-left transition hover:border-primary/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium">{label}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                        {description}
                      </span>
                    </span>
                    <Plus className="size-3.5 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-lg bg-muted/50 p-3 text-[11px] leading-5 text-muted-foreground">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <CircleHelp className="size-3.5" />
                İpucu
              </p>
              <p className="mt-1">Düğümleri bağlamak için bir çıkış noktasından diğer düğümün girişine sürükle.</p>
            </div>
          </aside>

          <div className="relative min-h-[440px] bg-[#fafbfe] xl:min-h-[620px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              isValidConnection={(connection) => {
                if (!connection.source || !connection.target) return false;
                const source = nodes.find((node) => node.id === connection.source);
                const target = nodes.find((node) => node.id === connection.target);
                return Boolean(
                  source &&
                    target &&
                    source.data.kind !== "output" &&
                    target.data.kind !== "input" &&
                    !wouldCreateCycle(connection.source, connection.target, edges),
                );
              }}
              onNodeClick={(_, node) => setSelectedId(node.id)}
              onPaneClick={() => setSelectedId(null)}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              deleteKeyCode={["Backspace", "Delete"]}
              aria-label="İş akışı düzenleme alanı"
            >
              <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#dfe3ed" />
              <Controls />
              <MiniMap
                pannable
                zoomable
                className="!hidden !border !border-border !bg-card sm:!block"
                nodeColor="#8581d5"
              />
            </ReactFlow>
            <div className="pointer-events-none absolute bottom-4 left-4 rounded-md border bg-card/90 px-2.5 py-1.5 text-[10px] text-muted-foreground shadow-sm">
              {nodes.length} düğüm · {edges.length} bağlantı
            </div>
          </div>

          <aside className="border-t border-border p-4 xl:border-l xl:border-t-0">
            <h2 className="text-sm font-semibold">Düğüm ayarları</h2>
            {selectedNode ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                  {(() => {
                    const Icon = nodeDetails[selectedNode.data.kind].icon;
                    return <Icon className="size-4 text-primary" />;
                  })()}
                  <span className="text-xs font-medium">
                    {nodeDetails[selectedNode.data.kind].label}
                  </span>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium">Düğüm adı</span>
                  <Input
                    value={selectedNode.data.label}
                    onChange={(event) => updateSelectedNode("label", event.target.value)}
                  />
                </label>
                {configSections[selectedNode.data.kind].map((section) => (
                  <section key={section.title} className="space-y-3 border-t border-border pt-3">
                    <h3 className="text-xs font-semibold">{section.title}</h3>
                    {section.fields.map((field) => {
                      const value = selectedNode.data.config[field.key] ?? "";
                      const provider = modelCatalog.find(
                        (item) => item.id === selectedNode.data.config.provider,
                      );
                      const modelOptions =
                        field.key === "model"
                          ? (provider?.models ?? []).filter(
                              (model) =>
                                selectedNode.data.kind !== "computer_use" ||
                                model.capabilities.includes("vision"),
                            )
                          : [];
                      const sharedClass =
                        "w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

                      return (
                        <label key={field.key} className="block space-y-1.5">
                          <span className="text-xs font-medium">{field.label}</span>
                          {field.control === "select" || field.key === "model" ? (
                            <>
                              <select
                                className={`${sharedClass} h-9`}
                                value={value}
                                disabled={field.key === "model" && modelOptions.length === 0}
                                onChange={(event) =>
                                  updateSelectedNode(field.key, event.target.value)
                                }
                              >
                                <option value="">
                                  {field.key === "model"
                                    ? "Model seçin"
                                    : "Seçim yapın"}
                                </option>
                                {(field.key === "model"
                                  ? modelOptions.map((model) => ({
                                      value: model.id,
                                      label: model.name,
                                    }))
                                  : field.key === "provider"
                                    ? modelCatalog.map((item) => ({
                                        value: item.id,
                                        label: `${item.name}${item.isConfigured ? "" : " (yapılandırılmamış)"}`,
                                      }))
                                    : field.options ?? []
                                ).map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {field.key === "provider" && provider && (
                                <span className="block text-[11px] leading-4 text-muted-foreground">
                                  {provider.accessNote}
                                </span>
                              )}
                            </>
                          ) : field.control === "textarea" ? (
                            <textarea
                              className={`${sharedClass} min-h-24 py-2`}
                              value={value}
                              placeholder={field.placeholder}
                              onChange={(event) =>
                                updateSelectedNode(field.key, event.target.value)
                              }
                            />
                          ) : field.control === "checkbox" ? (
                            <span className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                              <input
                                type="checkbox"
                                checked={value === "true"}
                                onChange={(event) =>
                                  updateSelectedNode(
                                    field.key,
                                    String(event.target.checked),
                                  )
                                }
                                className="size-4 accent-primary"
                              />
                              <span className="text-xs text-muted-foreground">
                                Etkin
                              </span>
                            </span>
                          ) : (
                            <Input
                              type={field.control === "number" ? "number" : "text"}
                              min={field.min}
                              max={field.max}
                              step={field.step}
                              value={value}
                              placeholder={field.placeholder}
                              onChange={(event) =>
                                updateSelectedNode(field.key, event.target.value)
                              }
                            />
                          )}
                          {field.key === "model" && provider && !provider.isConfigured && (
                            <span className="block text-[10px] leading-4 text-amber-700">
                              {provider.accessNote}{" "}
                              {provider.name} bağlantısı hazır değil; model bu durumda
                              yalnızca akış ayarı olarak kaydedilir.
                            </span>
                          )}
                        </label>
                      );
                    })}
                    {section.title === "Model yapılandırması" && modelCatalogQuery.isError && (
                      <p role="status" className="text-[10px] leading-4 text-amber-700">
                        Backend model kataloğuna erişilemedi. Yerleşik demo kataloğu
                        gösteriliyor.
                      </p>
                    )}
                  </section>
                ))}
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2 w-full gap-2"
                  onClick={deleteSelectedNode}
                >
                  <Trash2 className="size-3.5" />
                  Düğümü sil
                </Button>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed p-5 text-center">
                <WorkflowIcon className="mx-auto size-5 text-muted-foreground/60" />
                <p className="mt-3 text-xs font-medium">Bir düğüm seç</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Parametrelerini düzenlemek için çalışma alanındaki düğüme tıkla.
                </p>
              </div>
            )}
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs font-semibold">Doğrulama</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                {validation.length === 0
                  ? "Zorunlu alanlar tamamlandı."
                  : `${validation.length} kontrol gereksinimi var.`}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={validate}
              >
                Akışı doğrula
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </WorkspaceShell>
  );
}
