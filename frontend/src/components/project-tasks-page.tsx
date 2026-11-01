"use client";

import {
  AlertCircle,
  Bot,
  Check,
  Circle,
  Clock3,
  FileCode2,
  LoaderCircle,
  Play,
  RotateCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace-shell";
import {
  useCreateProjectTaskMutation,
  useGetModelCatalogQuery,
  useGetProjectTaskConfigQuery,
  useGetProjectTaskQuery,
  useGetProjectTasksQuery,
  type ProjectTask,
} from "@/lib/store/api";

const workspaceId = "demo";

const statusLabels: Record<ProjectTask["status"], string> = {
  queued: "Sırada",
  running: "Çalışıyor",
  completed: "Tamamlandı",
  failed: "Başarısız",
  needs_configuration: "Uzman ajan gerekiyor",
};

const taskTypeLabels: Record<ProjectTask["taskType"], string> = {
  software: "Yazılım geliştirme",
  game_development: "Oyun geliştirme",
  article_writing: "Makale / içerik yazımı",
  web_search: "Canlı web araştırması",
  image_generation: "Görsel üretimi",
  audio_generation: "Ses üretimi",
  video_generation: "Video üretimi (entegrasyon gerekli)",
};

const complexityLabels: Record<ProjectTask["complexity"], string> = {
  simple: "Basit",
  moderate: "Orta",
  complex: "Karmaşık",
};

const stepStatusLabels: Record<ProjectTask["steps"][number]["status"], string> = {
  queued: "Bekliyor",
  running: "Çalışıyor",
  completed: "Tamamlandı",
  failed: "Başarısız",
  skipped: "Atlandı",
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusIcon({ status }: { status: ProjectTask["steps"][number]["status"] }) {
  if (status === "completed") return <Check className="size-4 text-emerald-600" />;
  if (status === "failed") return <X className="size-4 text-red-600" />;
  if (status === "running") {
    return <LoaderCircle className="size-4 animate-spin text-primary" />;
  }
  if (status === "skipped") return <Circle className="size-4 text-muted-foreground" />;
  return <Clock3 className="size-4 text-muted-foreground" />;
}

function ProjectTaskDetails({ task }: { task: ProjectTask }) {
  const isActive = task.status === "queued" || task.status === "running";

  return (
    <Card className="mt-7 border-border/80 shadow-none">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{task.projectPath}</p>
            <h2 className="mt-1 truncate text-lg font-semibold">{task.projectName}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {task.goal}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              task.status === "completed"
                ? "shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700"
                : task.status === "failed" || task.status === "needs_configuration"
                  ? "shrink-0 border-red-200 bg-red-50 text-red-700"
                  : "shrink-0 border-primary/20 bg-primary/5 text-primary"
            }
          >
            {isActive && <LoaderCircle className="mr-1.5 size-3 animate-spin" />}
            {statusLabels[task.status]}
          </Badge>
        </div>

        <p className="mt-4 flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-primary" />
          {task.stage}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">{taskTypeLabels[task.taskType]}</Badge>
          <Badge variant="outline">{complexityLabels[task.complexity]} iş</Badge>
        </div>
        {task.routingSummary && (
          <p className="mt-3 rounded-lg bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
            {task.routingSummary}
          </p>
        )}

        <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {task.steps.map((step) => (
            <li
              key={step.id}
              className="flex min-w-0 items-start gap-2 rounded-lg border border-border/70 p-3"
            >
              <StatusIcon status={step.status} />
              <div className="min-w-0">
                <p className="text-xs font-medium">{step.name}</p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                  {step.detail || stepStatusLabels[step.status]}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {task.planSummary && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold">İş planı</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.planSummary}</p>
            <ul className="mt-3 space-y-2">
              {task.plan.map((item) => (
                <li key={item.id} className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs font-semibold">{item.role}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {item.objective}
                  </p>
                  <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">
                    {item.files.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {task.fileChanges.length > 0 && (
          <section className="mt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FileCode2 className="size-4" />
              Dosya değişiklikleri
            </h3>
            <ul className="mt-2 space-y-2">
              {task.fileChanges.map((change) => (
                <li key={change.path} className="rounded-lg border border-border/70 p-3">
                  <p className="break-all font-mono text-xs">{change.path}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {change.action === "created" ? "Yeni dosya" : "Güncellendi"} —{" "}
                    {change.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {task.validations.length > 0 && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold">Doğrulamalar</h3>
            <ul className="mt-2 space-y-2">
              {task.validations.map((validation) => (
                <li
                  key={validation.name}
                  className="flex items-start gap-2 rounded-lg border border-border/70 p-3"
                >
                  {validation.status === "passed" ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : validation.status === "failed" ? (
                    <X className="mt-0.5 size-4 shrink-0 text-red-600" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{validation.name}</p>
                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words font-sans text-[11px] leading-5 text-muted-foreground">
                      {validation.detail}
                    </pre>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {task.result && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <Check className="size-4" />
              Teslim özeti
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-950">
              {task.result}
            </p>
          </div>
        )}

        {task.error && (
          <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-900">
              <AlertCircle className="size-4" />
              Görev tamamlanamadı
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-800">
              {task.error}
            </p>
            {task.requiredIntegrations.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-semibold text-red-900">
                  Gereken entegrasyon ve yapılandırma
                </p>
                <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-red-800">
                  {task.requiredIntegrations.map((integration) => (
                    <li key={integration}>{integration}</li>
                  ))}
                </ul>
              </div>
            ) : task.status === "failed" && task.fileChanges.length === 0 ? (
              <p className="mt-2 text-xs text-red-700">
                Reddedilen veya doğrulamadan geçmeyen değişiklikler geri alındı.
              </p>
            ) : null}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          <span>
            {task.provider} / {task.model}
          </span>
          <span>
            {task.taskType === "image_generation"
              ? "1 görsel API çağrısı · ücret sağlayıcı hesabına bağlı"
              : task.taskType === "audio_generation"
                ? "1 TTS API çağrısı · ücret sağlayıcı hesabına bağlı"
                : `Yaklaşık ${task.estimatedTokens.toLocaleString("tr-TR")} token · bütçe ${task.tokenBudget.toLocaleString("tr-TR")}`}
          </span>
          <span>{formatTime(task.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectTasksPage() {
  const configQuery = useGetProjectTaskConfigQuery();
  const catalogQuery = useGetModelCatalogQuery();
  const tasksQuery = useGetProjectTasksQuery(workspaceId);
  const [createTask, createState] = useCreateProjectTaskMutation();
  const [taskId, setTaskId] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [goal, setGoal] = useState("");
  const [providerId, setProviderId] = useState("");
  const [modelId, setModelId] = useState("");
  const [tokenBudget, setTokenBudget] = useState(8192);
  const [allowExternalApi, setAllowExternalApi] = useState(false);
  const [formError, setFormError] = useState("");

  const providers = catalogQuery.data ?? [];
  const defaultProvider =
    providers.find((provider) => provider.isConfigured) ?? providers[0];
  const selectedProvider =
    providers.find((provider) => provider.id === providerId) ?? defaultProvider;
  const selectedModel =
    selectedProvider?.models.find((model) => model.id === modelId) ??
    selectedProvider?.models[0];
  const taskQuery = useGetProjectTaskQuery(
    { workspaceId, taskId },
    {
      skip: !taskId,
    },
  );
  const refetchTask = taskQuery.refetch;
  const activeTask = taskQuery.data;
  const isImageRequest =
    /\b(generate|create|draw|render)\s+(?:an?\s+)?(?:image|picture|illustration|logo|poster|visual)\b|(?:görsel|resim|illüstrasyon|logo|poster)\s*(?:üret|çiz|oluştur|hazırla)/i.test(
      goal,
    );
  const isAudioRequest =
    /\b(?:generate|create|make|produce|record)\b.{0,100}\b(?:audio|speech|voiceover|narration|spoken voice)\b|\b(?:audio|speech|voiceover|narration)\b.{0,100}\b(?:generate|create|make|produce|record)\b|(?:ses dosyası|seslendirme|konuşma kaydı|sesli anlatım|ses)\s*(?:üret|oluştur|hazırla|seslendir)|(?:üret|oluştur|hazırla|seslendir).{0,100}(?:ses dosyası|seslendirme|konuşma kaydı|sesli anlatım)/i.test(
      goal,
    );
  const isVideoRequest =
    /\b(?:generate|create|make|produce|edit)\b.{0,80}\bvideo\b(?!\s*game)|\bvideo\b.{0,80}\b(?:generate|create|make|produce|edit)\b|video.{0,80}(?:üret|oluştur|hazırla|düzenle)|(?:üret|oluştur|hazırla|düzenle).{0,80}video/i.test(
      goal,
    );
  const isMediaRequest = isImageRequest || isAudioRequest;
  useEffect(() => {
    if (
      !taskId ||
      activeTask?.status === "completed" ||
      activeTask?.status === "failed"
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      void refetchTask();
    }, 1500);
    return () => window.clearInterval(timer);
  }, [activeTask?.status, refetchTask, taskId]);
  const recentTasks = tasksQuery.data ?? [];
  const isProviderReady = Boolean(
    selectedProvider?.isConfigured && selectedModel,
  );

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (
      !isMediaRequest &&
      (!selectedProvider || !selectedModel || !isProviderReady)
    ) {
      setFormError("Çalışır durumda bir model sağlayıcısı seçip yapılandırın.");
      return;
    }
    try {
      const task = await createTask({
        workspaceId,
        request: {
          projectPath: projectPath.trim() || configQuery.data?.allowedProjectRoot || "",
          goal: goal.trim(),
          provider: selectedProvider?.id ?? "ollama",
          model: selectedModel?.id ?? "image-request",
          tokenBudget,
          allowExternalApi,
        },
      }).unwrap();
      setTaskId(task.id);
    } catch (error) {
      const detail =
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof error.data === "object" &&
        error.data !== null &&
        "detail" in error.data
          ? String(error.data.detail)
          : "Görev başlatılamadı. Backend bağlantısını ve proje yolunu kontrol edin.";
      setFormError(detail);
    }
  }

  return (
    <WorkspaceShell>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            Çalışma alanı / AI proje görevi
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Prompt&apos;tan çalışan AI ekibi
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Hedefini ve proje klasörünü yaz. Sistem işi planlar, bağımsız ajanlara böler,
            değişiklikleri uygular, uygun kontrolleri çalıştırır ve teslim öncesi inceler.
            Makaleler Markdown, web araştırmaları rapor, görseller PNG ve seslendirmeler MP3 olarak kaydedilir.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-white px-3 py-2 text-xs text-muted-foreground">
          <Bot className="size-4 text-primary" />
          İş zorluğuna göre 1–3 uzman ajan
        </div>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <Card className="border-border/80 shadow-none">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={submitTask} className="space-y-5">
              <div>
                <label htmlFor="project-path" className="text-sm font-medium">
                  Proje klasörü
                </label>
                <Input
                  id="project-path"
                  className="mt-2 font-mono text-xs"
                  value={projectPath}
                  onChange={(event) => setProjectPath(event.target.value)}
                  placeholder={configQuery.data?.allowedProjectRoot ?? "C:\\Projects\\my-app"}
                  required={!configQuery.data?.allowedProjectRoot}
                />
                <p className="mt-2 break-all text-xs leading-5 text-muted-foreground">
                  İzin verilen kök:{" "}
                  {configQuery.isLoading
                    ? "yükleniyor..."
                    : configQuery.data?.allowedProjectRoot ?? "yapılandırma alınamadı"}
                </p>
                {configQuery.isError && (
                  <p role="alert" className="mt-1 text-xs text-red-700">
                    Proje sınırı backend&apos;den okunamadı. Backend ayarlarını kontrol edin.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="project-goal" className="text-sm font-medium">
                  Ne yapılmasını istiyorsun?
                </label>
                <textarea
                  id="project-goal"
                  className="mt-2 min-h-40 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="İstenen sonucu, mevcut davranışı, önemli kısıtları ve kabul ölçütlerini kapsamlı biçimde açıkla..."
                  minLength={20}
                  maxLength={5000}
                  required
                />
                <p className="mt-1 text-right text-[11px] text-muted-foreground">
                  {goal.length.toLocaleString("tr-TR")} / 5.000
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="provider" className="text-sm font-medium">
                    Model sağlayıcısı
                  </label>
                  <select
                    id="provider"
                    className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    value={selectedProvider?.id ?? ""}
                    onChange={(event) => {
                      setProviderId(event.target.value);
                      setModelId("");
                    }}
                    disabled={catalogQuery.isLoading || providers.length === 0}
                  >
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                        {provider.isConfigured ? "" : " (yapılandırılmamış)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="model" className="text-sm font-medium">
                    Model
                  </label>
                  <select
                    id="model"
                    className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    value={selectedModel?.id ?? ""}
                    onChange={(event) => setModelId(event.target.value)}
                    disabled={!selectedProvider?.models.length}
                  >
                    {(selectedProvider?.models ?? []).map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedProvider && (
                <p className="text-xs leading-5 text-muted-foreground">
                  {isImageRequest
                    ? "Görsel üretiminde seçilen metin modeli kullanılmaz; OpenAI Images kullanılır."
                    : isAudioRequest
                      ? "Ses üretiminde seçilen metin modeli kullanılmaz; OpenAI TTS ile MP3 oluşturulur."
                      : isVideoRequest
                        ? "Video üretimi için sağlayıcı henüz desteklenmiyor. İstek yanlışlıkla yazılım görevi olarak çalıştırılmaz."
                    : selectedProvider.accessNote}
                </p>
              )}
              {configQuery.data && (
                <p className="text-xs text-muted-foreground">
                  Web araştırması: Tavily{" "}
                  {configQuery.data.webSearchConfigured
                    ? "hazır (canlı kaynak)"
                    : "anahtarsız ajan yedeklemesi (canlı kaynak yok)"} ·
                  OpenAI API anahtarı{" "}
                  {configQuery.data.imageGenerationConfigured
                    ? "hazır"
                    : "API anahtarı bekleniyor"}
                </p>
              )}

              <div>
                <label htmlFor="token-budget" className="text-sm font-medium">
                  Toplam yaklaşık token bütçesi
                </label>
                <select
                  id="token-budget"
                  className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm sm:max-w-xs"
                  value={tokenBudget}
                  onChange={(event) => setTokenBudget(Number(event.target.value))}
                >
                  {[4096, 8192, 12288, 16384].map((budget) => (
                    <option key={budget} value={budget}>
                      {budget.toLocaleString("tr-TR")} token
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Planlama, ajan çıktıları ve inceleme için üst sınır. Gösterilen tüketim yaklaşık
                  karakter hesabıdır; sağlayıcı faturası değildir.
                </p>
              </div>

              {((goal.trim().length >= 20 && !isVideoRequest) || isMediaRequest) && (
                <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs leading-5 text-amber-950">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-primary"
                    checked={allowExternalApi}
                    onChange={(event) => setAllowExternalApi(event.target.checked)}
                  />
                  <span>
                    <span className="font-semibold">
                      Harici sağlayıcıya gönderimi ve olası ücreti onaylıyorum.
                    </span>{" "}
                    Seçili bulut modelinde görev metni ve ilgili proje kaynakları;
                    web araştırmasında sorgu Tavily&apos;e; görsel üretiminde prompt
                    veya ses üretiminde metin OpenAI&apos;e gönderilebilir. Sağlayıcı kotası veya ücreti doğabilir.
                    Anahtarları sohbete değil backend&apos;in `.env` dosyasına ekleyin.
                  </span>
                </label>
              )}

              {formError && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  {formError}
                </p>
              )}
              {catalogQuery.isError && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  Model kataloğu backend&apos;den alınamadı.
                </p>
              )}
              <Button
                type="submit"
                className="w-full gap-2 sm:w-auto"
                disabled={
                  createState.isLoading ||
                  (!isProviderReady && !isMediaRequest) ||
                  configQuery.isError
                }
              >
                {createState.isLoading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                AI ekibini çalıştır
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit border-primary/10 bg-[#f7f7ff] shadow-none">
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4 text-primary" />
              Güvenli çalışma sınırları
            </h2>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
              <li>Yalnızca izin verilen proje kökü içindeki klasör seçilebilir.</li>
              <li>Basit görevlerde hafif model/tek ajan; karmaşık görevlerde seçili sağlayıcıdaki uygun model ve en fazla üç paralel ajan seçilir.</li>
              <li>Canlı web araması Tavily üzerinden yapılır; Tavily anahtarı yoksa seçili dil modeli kaynakları canlı doğrulamadan araştırma taslağı üretir. Görsel ve ses üretimi OpenAI API anahtarı ile çalışır. Harici servislere veri göndermek için açık onay gerekir.</li>
              <li>Ajanlara dosya silme, shell komutu veya bağımlılık yükleme yetkisi verilmez.</li>
              <li>Değişiklikler sınırlı metin yamalarıdır; başarısız test veya incelemede geri alınır.</li>
              <li>Oyunların görsel/etkileşimli olarak oynanması otomatik yapılmaz; uygun test/build komutu yoksa doğrulama atlanır.</li>
              <li>Gizli anahtar ve credential dosyaları envanterden dışlanır; anahtar atamaları maskelenir.</li>
              <li>Otomatik testler proje kodunu çalıştırabilir. Yalnızca güvendiğin projelerde kullan.</li>
              <li>Görevler şimdilik sunucu yeniden başlatıldığında otomatik devam etmez.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {taskQuery.isError && taskId && (
        <p role="alert" className="mt-6 text-sm text-red-700">
          Görev durumu backend&apos;den alınamadı. Bağlantıyı kontrol edip yenile.
        </p>
      )}
      {activeTask && <ProjectTaskDetails task={activeTask} />}

      {recentTasks.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Son proje görevleri</h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => void tasksQuery.refetch()}
              disabled={tasksQuery.isFetching}
            >
              <RotateCw className={`size-3.5 ${tasksQuery.isFetching ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {recentTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => setTaskId(task.id)}
                className={`rounded-xl border bg-white p-4 text-left transition hover:border-primary/40 hover:shadow-sm ${
                  task.id === taskId ? "border-primary/50 ring-1 ring-primary/15" : "border-border/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="truncate text-sm font-semibold">{task.projectName}</span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {statusLabels[task.status]}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {task.goal}
                </p>
                <p className="mt-3 text-[10px] text-muted-foreground">
                  {task.stage} · {formatTime(task.createdAt)}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </WorkspaceShell>
  );
}
