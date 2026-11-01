"use client";

import { Bot, GitBranch, Gauge, LoaderCircle, Plus, Search, Trash2, Workflow as WorkflowIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace-shell";
import {
  useDeleteWorkflowMutation,
  useGenerateWorkflowMutation,
  useGetModelCatalogQuery,
  useGetWorkflowsQuery,
} from "@/lib/store/api";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  setWorkflowFilter,
  setWorkflowSearch,
  type Workflow,
} from "@/lib/store/workflows-slice";

function WorkflowIconBox({ type }: { type: Workflow["icon"] }) {
  const Icon = type === "bot" ? Bot : type === "branch" ? GitBranch : Gauge;
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
      <Icon className="size-5" />
    </span>
  );
}

export function WorkflowsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchId = useId();
  const goalId = useId();
  const [goal, setGoal] = useState("");
  const [providerId, setProviderId] = useState("");
  const [modelId, setModelId] = useState("");
  const [allowExternalApi, setAllowExternalApi] = useState(false);
  const { search, filter } = useAppSelector((state) => state.workflows);
  const workflowsQuery = useGetWorkflowsQuery("demo");
  const catalogQuery = useGetModelCatalogQuery();
  const [deleteWorkflow] = useDeleteWorkflowMutation();
  const [generateWorkflow, generateState] = useGenerateWorkflowMutation();
  const [actionError, setActionError] = useState("");
  const providers = catalogQuery.data ?? [];
  const selectedProvider =
    providers.find((provider) => provider.id === providerId) ??
    providers.find((provider) => provider.isConfigured) ??
    providers[0];
  const selectedModel =
    selectedProvider?.models.find((model) => model.id === modelId) ??
    selectedProvider?.models[0];
  const providerReady = Boolean(selectedProvider?.isConfigured && selectedModel);
  const items = workflowsQuery.data ?? [];
  const normalizedSearch = search.trim().toLocaleLowerCase("tr");
  const workflows = items.filter((workflow) => {
    const matchesText =
      !normalizedSearch ||
      `${workflow.name} ${workflow.description}`
        .toLocaleLowerCase("tr")
        .includes(normalizedSearch);
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && workflow.status === "Active") ||
      (filter === "drafts" && workflow.status === "Draft");
    return matchesText && matchesFilter;
  });

  async function createFromPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");
    if (!selectedProvider || !selectedModel || !providerReady) {
      setActionError("Önce yapılandırılmış bir model sağlayıcısı seçin.");
      return;
    }
    if (selectedProvider.id !== "ollama" && !allowExternalApi) {
      setActionError("Bulut sağlayıcısına gönderim için açık onay gerekiyor.");
      return;
    }
    try {
      const workflow = await generateWorkflow({
        workspaceId: "demo",
        request: {
          goal: goal.trim(),
          provider: selectedProvider.id,
          model: selectedModel.id,
          allowExternalApi,
        },
      }).unwrap();
      router.push(`/workflows/${workflow.id}`);
    } catch (error) {
      const detail =
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof error.data === "object" &&
        error.data !== null &&
        "detail" in error.data
          ? String(error.data.detail)
          : "Akış oluşturulamadı. Backend bağlantısını ve sağlayıcı ayarlarını kontrol edin.";
      setActionError(detail);
    }
  }

  return (
    <WorkspaceShell>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Çalışma alanı / İş akışları</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">İş akışları</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            AI ajanlarını ve otomasyonlarını oluştur, yapılandır ve yönet.
          </p>
        </div>
        <Link
          href="/workflows/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Yeni iş akışı
        </Link>
      </div>

      <Card className="mt-6 border-primary/20 bg-primary/[0.025] shadow-none">
        <CardContent className="p-5">
          <form onSubmit={createFromPrompt} className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Prompt’tan düzenlenebilir akış oluştur</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Gereksinimleri, hedef kullanıcıyı ve kabul ölçütlerini yaz. AI 2–3 uzman ajanlı
                bir taslak akış üretir; akış kaydedilip editörde açılır. İnceledikten sonra
                düğümleri düzenleyip kendin çalıştırırsın.
              </p>
            </div>
            <label htmlFor={goalId} className="sr-only">İş akışı gereksinimleri</label>
            <textarea
              id={goalId}
              className="min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Örn. X türünde, hedef kitlesi ..., şu gereksinimleri karşılayan bir oyun için araştırma, tasarım, uygulama ve kalite kontrol ajanları içeren bir akış oluştur..."
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              minLength={20}
              maxLength={5000}
              required
            />
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="text-xs font-medium">
                Model sağlayıcısı
                <select
                  className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={selectedProvider?.id ?? ""}
                  onChange={(event) => {
                    setProviderId(event.target.value);
                    setModelId("");
                  }}
                  disabled={catalogQuery.isLoading || providers.length === 0}
                >
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}{provider.isConfigured ? "" : " (yapılandırılmamış)"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium">
                Model
                <select
                  className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={selectedModel?.id ?? ""}
                  onChange={(event) => setModelId(event.target.value)}
                  disabled={!selectedProvider?.models.length}
                >
                  {(selectedProvider?.models ?? []).map((model) => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </label>
              <Button
                type="submit"
                className="mt-auto gap-2"
                disabled={
                  generateState.isLoading ||
                  !providerReady ||
                  (selectedProvider?.id !== "ollama" && !allowExternalApi)
                }
              >
                {generateState.isLoading
                  ? <LoaderCircle className="size-4 animate-spin" />
                  : <GitBranch className="size-4" />}
                Taslak oluştur
              </Button>
            </div>
            {selectedProvider?.id !== "ollama" && (
              <label className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                  checked={allowExternalApi}
                  onChange={(event) => setAllowExternalApi(event.target.checked)}
                />
                Promptun seçili bulut sağlayıcısına gönderilmesini ve olası kullanımı onaylıyorum.
              </label>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {[
            ["all", "Tümü"],
            ["active", "Aktif"],
            ["drafts", "Taslaklar"],
          ].map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "secondary" : "ghost"}
              onClick={() =>
                dispatch(setWorkflowFilter(value as "all" | "active" | "drafts"))
              }
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <label htmlFor={searchId} className="sr-only">
            İş akışlarında ara
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={searchId}
            value={search}
            onChange={(event) => dispatch(setWorkflowSearch(event.target.value))}
            placeholder="İş akışlarında ara..."
            className="pl-9"
          />
        </div>
      </div>

      {actionError && (
        <p role="alert" className="mt-4 text-sm text-red-700">{actionError}</p>
      )}
      {workflowsQuery.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">İş akışları yükleniyor...</p>
      ) : workflowsQuery.isError ? (
        <p role="alert" className="mt-8 text-sm text-red-700">
          İş akışları backend’den alınamadı. Backend bağlantısını kontrol edip sayfayı yenile.
        </p>
      ) : workflows.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {workflows.map((workflow) => (
            <Card
              key={workflow.id}
              className="group border-border/80 shadow-none transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <WorkflowIconBox type={workflow.icon} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/workflows/${workflow.id}`}
                        className="block truncate text-sm font-semibold hover:text-primary focus-visible:outline-none focus-visible:underline"
                      >
                        {workflow.name}
                      </Link>
                      <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
                        {workflow.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={
                          workflow.status === "Active"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : workflow.status === "Draft"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "text-muted-foreground"
                        }
                      >
                        {workflow.status === "Active"
                          ? "Aktif"
                          : workflow.status === "Draft"
                            ? "Taslak"
                            : "Duraklatıldı"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${workflow.name} iş akışını sil`}
                        onClick={() => {
                          if (window.confirm(`"${workflow.name}" iş akışını silmek istiyor musun?`)) {
                            setActionError("");
                            void deleteWorkflow({
                              workspaceId: "demo",
                              workflowId: workflow.id,
                            })
                              .unwrap()
                              .catch(() => {
                                setActionError("İş akışı silinemedi. Backend bağlantısını kontrol et.");
                              });
                          }
                        }}
                      >
                        <Trash2 className="size-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <WorkflowIcon className="size-3.5" />
                      {workflow.nodes.length} düğüm
                    </span>
                    <span>{workflow.runs.toLocaleString("tr-TR")} çalıştırma</span>
                    <span>v{workflow.version}</span>
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-5 border-dashed shadow-none">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Search className="size-6 text-muted-foreground/60" />
            <p className="mt-4 text-sm font-semibold">İş akışı bulunamadı</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Arama kelimesini veya seçili filtreyi değiştirebilirsin.
            </p>
          </CardContent>
        </Card>
      )}
    </WorkspaceShell>
  );
}
