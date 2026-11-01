"use client";

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bot,
  Boxes,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  FileText,
  GitBranch,
  Gauge,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Workflow as WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useGetRunsQuery, useGetWorkflowsQuery } from "@/lib/store/api";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { formatRunDate } from "@/lib/run-date";
import {
  setWorkflowFilter,
  setWorkflowSearch,
  type RunStatus,
  type Workflow,
  type WorkflowFilter,
} from "@/lib/store/workflows-slice";

const navigation = [
  { label: "Genel Bakış", href: "/", icon: LayoutDashboard },
  { label: "İş Akışları", href: "/workflows", icon: WorkflowIcon },
  { label: "Çalıştırmalar", href: "/runs", icon: Activity },
  { label: "Metrik Kütüphanesi", href: "/metrics", icon: Gauge },
  { label: "Raporlar", href: "/reports", icon: FileText },
];

function isWorkflowFilter(value: string | null): value is WorkflowFilter {
  return value === "all" || value === "active" || value === "drafts";
}

function statusLabel(status: Workflow["status"]) {
  if (status === "Active") return "Aktif";
  if (status === "Draft") return "Taslak";
  return "Duraklatıldı";
}

function runStatusLabel(status: RunStatus) {
  const labels: Record<RunStatus, string> = {
    queued: "Sırada",
    running: "Çalışıyor",
    completed: "Tamamlandı",
    failed: "Başarısız",
    cancelled: "İptal edildi",
  };
  return labels[status];
}

function WorkflowGlyph({ type }: { type: Workflow["icon"] }) {
  const Icon = type === "bot" ? Bot : type === "branch" ? GitBranch : Gauge;
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
      <Icon className="size-[18px]" />
    </span>
  );
}

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden min-h-screen w-[248px] shrink-0 flex-col border-r border-border/70 bg-white px-4 py-5 lg:flex">
      <Link href="/" className="flex items-center gap-3 px-2" aria-label="Flowmind ana sayfa">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Command className="size-[18px]" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">flowmind</span>
      </Link>

      <button className="mt-8 flex w-full items-center gap-3 rounded-xl border border-border/80 p-2.5 text-left transition hover:bg-muted/60">
        <Avatar className="rounded-lg" size="sm">
          <AvatarFallback className="rounded-lg bg-[#e8eaff] text-[10px] font-semibold text-[#5458b8]">
            AC
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold">Acme Studio</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">Ücretsiz plan</span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>

      <div className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Çalışma alanı
      </div>
      <nav className="mt-2 space-y-1" aria-label="Ana menü">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${
              active
                ? "bg-primary/8 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <Icon className="size-[17px]" />
            {label}
          </Link>
        )})}
      </nav>

      <div className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Yönetim
      </div>
      <nav className="mt-2 space-y-1" aria-label="Yönetim menüsü">
        <Link
          href="/integrations"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
        >
          <Boxes className="size-[17px]" />
          Entegrasyonlar
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
        >
          <Settings2 className="size-[17px]" />
          Ayarlar
        </Link>
      </nav>

      <div className="mt-auto">
        <Card className="border-primary/10 bg-[#f7f7ff] shadow-none">
          <CardContent className="p-3.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
              <Sparkles className="size-4" />
            </div>
            <p className="mt-3 text-xs font-semibold">Daha fazlasını keşfet</p>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              Ekibinle birlikte daha büyük iş akışları oluştur.
            </p>
            <Link
              href="/settings/team"
              className="mt-3 flex h-8 w-full items-center justify-center rounded-lg border border-border bg-white px-2.5 text-xs font-medium hover:bg-muted"
            >
              Ekibi yönet
            </Link>
          </CardContent>
        </Card>
        <Link
          href="/onboarding"
          className="mt-4 flex items-center gap-2 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <CircleHelp className="size-4" />
          Yardım merkezi
          <ArrowUpRight className="ml-auto size-3.5" />
        </Link>
      </div>
    </aside>
  );
}

export function Dashboard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchId = useId();
  const { search, filter } = useAppSelector((state) => state.workflows);
  const workflowsQuery = useGetWorkflowsQuery("demo");
  const runsQuery = useGetRunsQuery("demo");
  const items = workflowsQuery.data ?? [];
  const runs = runsQuery.data ?? [];
  const completedRuns = runs.filter((run) => run.status === "completed");
  const finishedRuns = runs.filter((run) =>
    ["completed", "failed", "cancelled"].includes(run.status),
  );
  const durations = completedRuns
    .map((run) => Number.parseFloat(run.duration.replace(",", ".")))
    .filter(Number.isFinite);
  const averageDuration = durations.length
    ? `${(
        durations.reduce((total, duration) => total + duration, 0) /
        durations.length
      ).toFixed(2)} sn`
    : "—";
  const successRate = finishedRuns.length
    ? `${Math.round((completedRuns.length / finishedRuns.length) * 100)}%`
    : "—";
  const metrics = [
    {
      label: "Toplam çalıştırma",
      value: runs.length.toLocaleString("tr-TR"),
      detail: "Backend kayıtları",
      icon: Activity,
    },
    {
      label: "Başarı oranı",
      value: successRate,
      detail: "Sonlanan çalıştırmalar",
      icon: Gauge,
    },
    {
      label: "Ort. yanıt süresi",
      value: averageDuration,
      detail: "Başarılı çalıştırmalar",
      icon: Clock3,
    },
    {
      label: "Aktif iş akışı",
      value: items
        .filter((item) => item.status === "Active")
        .length.toLocaleString("tr-TR"),
      detail: "Yayınlanmış akış",
      icon: WorkflowIcon,
    },
  ];
  const activities = runs.slice(0, 3).map((run) => ({
    title: run.workflowName,
    detail: runStatusLabel(run.status),
    time: formatRunDate(run.startedAt),
    tone:
      run.status === "completed"
        ? "success"
        : run.status === "queued" || run.status === "running"
          ? "blue"
          : "neutral",
  }));
  const normalizedSearch = search.trim().toLocaleLowerCase("tr");
  const visibleWorkflows = items.filter((workflow) => {
    const matchesSearch =
      !normalizedSearch ||
      `${workflow.name} ${workflow.description}`
        .toLocaleLowerCase("tr")
        .includes(normalizedSearch);
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && workflow.status === "Active") ||
      (filter === "drafts" && workflow.status === "Draft");

    return matchesSearch && matchesFilter;
  });

  function createWorkflow() {
    dispatch(setWorkflowFilter("all"));
    dispatch(setWorkflowSearch(""));
    router.push("/workflows/new");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Command className="size-4" />
            </span>
            <span className="text-sm font-semibold">flowmind</span>
          </div>
          <div className="relative hidden w-full max-w-[340px] sm:block">
            <label htmlFor={searchId} className="sr-only">
              İş akışlarında ara
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={searchId}
              value={search}
              onChange={(event) => dispatch(setWorkflowSearch(event.target.value))}
              placeholder="İş akışlarında ara..."
              className="h-9 border-transparent bg-muted/65 pl-9 pr-14 shadow-none focus-visible:border-ring"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘ K
            </kbd>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:gap-3">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground" aria-label="Bildirimler">
              <Bell className="size-[18px]" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-background bg-primary" />
            </Button>
            <Separator orientation="vertical" className="hidden h-7 sm:block" />
            <button className="flex items-center gap-2 rounded-lg p-1.5 pr-2 transition hover:bg-muted/70">
              <Avatar>
                <AvatarFallback className="bg-[#e9e9ff] text-xs font-semibold text-[#5753a4]">
                  EY
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-medium">Ece Yılmaz</span>
                <span className="block text-[10px] text-muted-foreground">Yönetici</span>
              </span>
              <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
            </button>
          </div>
        </header>

        <nav
          className="flex gap-1 overflow-x-auto border-b border-border/70 bg-background px-4 py-2 lg:hidden"
          aria-label="Mobil ana menü"
        >
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                  active ? "bg-primary/8 font-medium text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </Link>
            );
          })}
          <Link
            href="/settings"
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground"
          >
            <Settings2 className="size-3.5" />
            Ayarlar
          </Link>
        </nav>

        <main className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 lg:px-10 lg:pt-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Çalışma alanı</span>
                <span>/</span>
                <span className="text-foreground">Genel Bakış</span>
              </div>
              <h1 className="text-[26px] font-semibold tracking-tight sm:text-[30px]">
                Günaydın, Ece <span aria-hidden="true">✦</span>
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                AI iş akışlarının bugünkü performansına göz at.
              </p>
            </div>
            <Button onClick={createWorkflow} className="h-10 gap-2 px-4 shadow-sm">
              <Plus className="size-4" />
              Yeni iş akışı
            </Button>
          </div>

          <section aria-label="Performans özeti" className="mt-8 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label} className="border-border/80 shadow-none">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                        <p className="mt-3 text-[27px] font-semibold leading-none tracking-tight">
                          {metric.value}
                        </p>
                      </div>
                      <span className="grid size-9 place-items-center rounded-lg bg-muted/80 text-muted-foreground">
                        <Icon className="size-[17px]" />
                      </span>
                    </div>
                    <div className="mt-5">
                      <span className="text-[11px] text-muted-foreground">
                        {metric.detail}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <div className="mt-6 grid items-start gap-6 2xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.9fr)]">
            <Card className="min-w-0 border-border/80 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 px-5 pb-4 pt-5">
                <div>
                  <CardTitle className="text-[15px]">İş akışların</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ajanlarını ve otomasyonlarını yönet.
                  </p>
                </div>
                <Link
                  href="/workflows"
                  className="hidden h-8 items-center gap-1.5 rounded-lg border border-input px-3 text-xs font-medium transition hover:bg-muted sm:flex"
                >
                  Tümünü gör
                  <ArrowRight className="size-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <Tabs
                  value={filter}
                  onValueChange={(value) => {
                    if (isWorkflowFilter(value)) dispatch(setWorkflowFilter(value));
                  }}
                >
                  <TabsList className="h-9 w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0 sm:w-auto">
                    <TabsTrigger
                      value="all"
                      className="flex-none rounded-none px-3 data-active:shadow-none"
                    >
                      Tümü
                    </TabsTrigger>
                    <TabsTrigger
                      value="active"
                      className="flex-none rounded-none px-3 data-active:shadow-none"
                    >
                      Aktif
                    </TabsTrigger>
                    <TabsTrigger
                      value="drafts"
                      className="flex-none rounded-none px-3 data-active:shadow-none"
                    >
                      Taslaklar
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="mt-2">
                  {workflowsQuery.isLoading ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      İş akışları yükleniyor...
                    </p>
                  ) : workflowsQuery.isError ? (
                    <p role="alert" className="py-12 text-center text-sm text-red-700">
                      İş akışları backend’den alınamadı.
                    </p>
                  ) : visibleWorkflows.length > 0 ? (
                    visibleWorkflows.map((workflow) => (
                      <div
                        key={workflow.id}
                        className="flex items-center gap-3 border-b border-border/70 py-4 last:border-b-0"
                      >
                        <WorkflowGlyph type={workflow.icon} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/workflows/${workflow.id}`}
                              className="truncate text-[13px] font-medium hover:text-primary"
                            >
                              {workflow.name}
                            </Link>
                            <Badge
                              variant="outline"
                              className={`h-[21px] px-2 text-[10px] font-medium ${
                                workflow.status === "Active"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : workflow.status === "Draft"
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-border bg-muted/50 text-muted-foreground"
                              }`}
                            >
                              <span className="mr-1 size-1.5 rounded-full bg-current" />
                              {statusLabel(workflow.status)}
                            </Badge>
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {workflow.description}
                          </p>
                        </div>
                        <div className="hidden w-20 text-right sm:block">
                          <p className="text-xs font-medium">{workflow.runs.toLocaleString("tr-TR")}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">çalıştırma</p>
                        </div>
                        <span className="hidden w-20 text-right text-[11px] text-muted-foreground md:block">
                          {workflow.updatedAt}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          aria-label={`${workflow.name} seçenekleri`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <Search className="mx-auto size-5 text-muted-foreground/60" />
                      <p className="mt-3 text-sm font-medium">İş akışı bulunamadı</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Aramanı veya seçili filtreyi değiştirmeyi dene.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/80 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-3 pt-5">
                  <CardTitle className="text-[15px]">Son aktiviteler</CardTitle>
                  <Button variant="ghost" size="icon-sm" aria-label="Diğer aktiviteler">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  {runsQuery.isError ? (
                    <p role="alert" className="py-8 text-center text-xs text-red-700">
                      Aktiviteler backend’den alınamadı.
                    </p>
                  ) : activities.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      Henüz bir çalıştırma yok.
                    </p>
                  ) : activities.map((activity, index) => (
                    <div key={activity.title} className="flex gap-3 py-3">
                      <div className="relative flex w-5 shrink-0 justify-center">
                        <span
                          className={`relative z-[1] mt-1.5 size-2 rounded-full ${
                            activity.tone === "success"
                              ? "bg-emerald-500"
                              : activity.tone === "blue"
                                ? "bg-primary"
                                : "bg-muted-foreground/40"
                          }`}
                        />
                        {index < activities.length - 1 && (
                          <span className="absolute bottom-[-18px] top-4 w-px bg-border" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{activity.title}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{activity.detail}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                  <Link
                    href="/runs"
                    className="mt-2 flex h-8 w-full items-center justify-center rounded-lg border border-input text-xs font-medium hover:bg-muted"
                  >
                    Tüm aktiviteler
                  </Link>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-border/80 bg-[#f4f4ff] shadow-none">
                <CardContent className="relative p-5">
                  <div className="absolute -right-7 -top-8 size-32 rounded-full bg-[#ddddff]/60 blur-2xl" />
                  <div className="relative">
                    <Badge className="h-6 border border-[#d9d8ff] bg-white/80 text-[10px] text-[#5551a5] hover:bg-white/80">
                      <Sparkles className="size-3" />
                      Yeni özellik
                    </Badge>
                    <h2 className="mt-4 text-sm font-semibold">Metriklerini keşfet</h2>
                    <p className="mt-1.5 max-w-[260px] text-xs leading-5 text-muted-foreground">
                      Ajan kalitesini ölçmek için hazır değerlendirme metriklerini kullan.
                    </p>
                    <Link
                      href="/metrics"
                      className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-white px-3 text-xs font-medium hover:bg-muted"
                    >
                      Metrik kütüphanesi
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Link
                href="/reports"
                className="flex items-center gap-2 px-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <FileText className="size-3.5" />
                Platform kullanım rehberi
                <ArrowUpRight className="ml-auto size-3.5" />
              </Link>
            </div>
          </div>
          <p className="mt-7 text-center text-[10px] text-muted-foreground/70">
            Özet verileri backend workflow ve çalıştırma kayıtlarından hesaplanır.
          </p>
        </main>
      </div>
    </div>
  );
}
