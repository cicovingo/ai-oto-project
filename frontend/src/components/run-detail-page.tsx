"use client";

import {
  ArrowLeft,
  Check,
  CircleAlert,
  Clock3,
  LoaderCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceShell } from "@/components/workspace-shell";
import {
  useCancelWorkflowRunMutation,
  useGetRunQuery,
} from "@/lib/store/api";
import { formatRunDate } from "@/lib/run-date";
import type { RunStatus } from "@/lib/store/workflows-slice";

const labels: Record<RunStatus, string> = {
  queued: "Sırada",
  running: "Çalışıyor",
  completed: "Tamamlandı",
  failed: "Başarısız",
  cancelled: "İptal edildi",
};

function runBadge(status: RunStatus) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-700";
  if (status === "running" || status === "queued") return "border-blue-200 bg-blue-50 text-blue-700";
  return "text-muted-foreground";
}

export function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cancelError, setCancelError] = useState("");
  const runQuery = useGetRunQuery(
    { workspaceId: "demo", runId: id },
    { skipPollingIfUnfocused: true },
  );
  const [cancelRun] = useCancelWorkflowRunMutation();
  const run = runQuery.data;
  const runStatus = run?.status;
  const refetchRun = runQuery.refetch;

  useEffect(() => {
    if (!runStatus || ["completed", "failed", "cancelled"].includes(runStatus)) return;
    const timer = window.setInterval(() => {
      void refetchRun();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [refetchRun, runStatus]);

  if (runQuery.isLoading) {
    return (
      <WorkspaceShell>
        <p className="text-sm text-muted-foreground">Çalıştırma backend’den yükleniyor...</p>
      </WorkspaceShell>
    );
  }

  if (!run) {
    return (
      <WorkspaceShell>
        <div className="rounded-xl border border-dashed py-20 text-center">
          <CircleAlert className="mx-auto size-6 text-muted-foreground" />
          <h1 className="mt-4 text-lg font-semibold">Çalıştırma bulunamadı</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {runQuery.isError
              ? "Backend bağlantısı veya çalıştırma kimliği doğrulanamadı."
              : "Bu çalıştırma kayıtlı değil."}
          </p>
          <Link
            href="/runs"
            className="mt-5 inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            Çalıştırma geçmişine dön
          </Link>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <Link
        href="/runs"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Çalıştırma geçmişine dön
      </Link>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{run.id}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{run.workflowName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatRunDate(run.startedAt)} · {run.trigger} çalıştırma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={runBadge(run.status)}>{labels[run.status]}</Badge>
          {(run.status === "queued" || run.status === "running") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCancelError("");
                void cancelRun({
                  workspaceId: "demo",
                  workflowId: run.workflowId,
                  runId: run.id,
                })
                  .unwrap()
                  .catch((error: unknown) => {
                    console.error("Çalıştırma iptal edilemedi.", error);
                    setCancelError("Çalıştırma iptal edilemedi. Backend bağlantısını kontrol et.");
                  })
              }}
            >
              <X className="mr-1.5 size-3.5" />
              Çalıştırmayı iptal et
            </Button>
          )}
        </div>
      </div>
      {cancelError && <p role="alert" className="mt-3 text-sm text-red-700">{cancelError}</p>}

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 shadow-none">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Toplam süre</p>
            <p className="mt-2 flex items-center gap-2 text-xl font-semibold">
              <Clock3 className="size-4 text-muted-foreground" />
              {run.duration}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-none">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Değerlendirme skoru</p>
            <p className="mt-2 text-xl font-semibold">
              {run.score === null ? "—" : `${Math.round(run.score * 100)}%`}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-none">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Tamamlanan adımlar</p>
            <p className="mt-2 text-xl font-semibold">
              {run.steps.filter((step) => step.status === "completed").length} / {run.steps.length}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6 border-border/80 shadow-none">
        <CardHeader className="px-5 pb-3 pt-5">
          <CardTitle className="text-[15px]">Adım ayrıntıları</CardTitle>
          <p className="text-xs text-muted-foreground">
            Her düğümün durumu, süresi ve güvenli çıktı özeti.
          </p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {run.steps.map((step, index) => {
            const StepIcon =
              step.status === "completed"
                ? Check
                : step.status === "failed"
                  ? CircleAlert
                  : run.status === "running"
                    ? LoaderCircle
                    : X;
            return (
              <div key={step.id} className="flex gap-4 border-t border-border/70 py-4 first:border-t-0">
                <span
                  className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${
                    step.status === "completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : step.status === "failed"
                        ? "bg-red-50 text-red-700"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <StepIcon className={`size-4 ${run.status === "running" && step.status !== "completed" ? "animate-spin" : ""}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{index + 1}. {step.name}</p>
                    <span className="text-xs text-muted-foreground">{step.duration}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            );
          })}
          <p className="rounded-lg bg-muted/50 p-3 text-[11px] leading-5 text-muted-foreground">
            Çalıştırma çıktıları model sağlayıcısından gerçek zamanlı alınır. Gizli anahtarlar gösterilmez.
          </p>
        </CardContent>
      </Card>
      {run.outputs && (
        <Card className="mt-6 border-border/80 shadow-none">
          <CardHeader className="px-5 pb-3 pt-5">
            <CardTitle className="text-[15px]">Akış çıktısı</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-xs leading-5">
              {JSON.stringify(run.outputs, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </WorkspaceShell>
  );
}
