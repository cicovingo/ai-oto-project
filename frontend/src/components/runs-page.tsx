"use client";

import { Activity, Download, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace-shell";
import { useGetRunsQuery, useGetWorkflowsQuery } from "@/lib/store/api";
import { formatRunDate, runIsWithinDays } from "@/lib/run-date";
import type { RunStatus, WorkflowRun } from "@/lib/store/workflows-slice";

const statusLabels: Record<RunStatus, string> = {
  queued: "Sırada",
  running: "Çalışıyor",
  completed: "Tamamlandı",
  failed: "Başarısız",
  cancelled: "İptal edildi",
};

function statusStyle(status: RunStatus) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-700";
  if (status === "running" || status === "queued") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  return "border-border bg-muted/50 text-muted-foreground";
}

function downloadCsv(runs: WorkflowRun[]) {
  const rows = [
    ["Çalıştırma", "İş akışı", "Durum", "Başlangıç", "Süre", "Skor", "Tetikleyici"],
    ...runs.map((run) => [
      run.id,
      run.workflowName,
      statusLabels[run.status],
      run.startedAt,
      run.duration,
      run.score === null ? "" : run.score.toLocaleString("tr-TR"),
      run.trigger,
    ]),
  ];
  const csv = `\uFEFF${rows
    .map((row) => row.map((field) => `"${field.replaceAll('"', '""')}"`).join(","))
    .join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "flowmind-calistirmalar.csv";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function RunsPage() {
  const runsQuery = useGetRunsQuery("demo");
  const workflowsQuery = useGetWorkflowsQuery("demo");
  const runs = useMemo(() => runsQuery.data ?? [], [runsQuery.data]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RunStatus | "all">("all");
  const [workflow, setWorkflow] = useState("all");
  const [period, setPeriod] = useState("30");
  const workflows = workflowsQuery.data ?? [];
  const visibleRuns = useMemo(
    () =>
      runs.filter((run) => {
        const matchesText =
          !query.trim() ||
          `${run.id} ${run.workflowName}`.toLocaleLowerCase("tr").includes(query.trim().toLocaleLowerCase("tr"));
        return (
          matchesText &&
          (status === "all" || run.status === status) &&
          (workflow === "all" || run.workflowId === workflow) &&
          (period === "all" || runIsWithinDays(run.startedAt, Number(period)))
        );
      }),
    [period, query, runs, status, workflow],
  );

  return (
    <WorkspaceShell>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Çalışma alanı / Çalıştırmalar</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Çalıştırma geçmişi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            İş akışlarının sonuçlarını, adımlarını ve hata durumlarını incele.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => downloadCsv(visibleRuns)}
          disabled={visibleRuns.length === 0}
        >
          <Download className="size-4" />
          CSV dışa aktar
        </Button>
      </div>

      <Card className="mt-8 border-border/80 shadow-none">
        <CardContent className="p-4 sm:p-5">
          {runsQuery.isError && (
            <p role="alert" className="mb-4 text-sm text-red-700">
              Çalıştırmalar backend’den alınamadı. Backend bağlantısını kontrol et.
            </p>
          )}
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px_190px_190px]">
            <div className="relative">
              <label htmlFor="run-search" className="sr-only">Çalıştırmalarda ara</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="run-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="İş akışı veya çalıştırma kimliği..."
                className="pl-9"
              />
            </div>
            <label className="sr-only" htmlFor="run-status">Duruma göre filtrele</label>
            <select
              id="run-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as RunStatus | "all")}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="all">Tüm durumlar</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="run-workflow">İş akışına göre filtrele</label>
            <select
              id="run-workflow"
              value={workflow}
              onChange={(event) => setWorkflow(event.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="all">Tüm iş akışları</option>
              {workflows.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="run-period">Tarih aralığı</label>
            <select
              id="run-period"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="all">Tüm tarihler</option>
              <option value="1">Son 24 saat</option>
              <option value="7">Son 7 gün</option>
              <option value="30">Son 30 gün</option>
            </select>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pl-3 font-medium">İş akışı</th>
                  <th className="pb-3 font-medium">Çalıştırma</th>
                  <th className="pb-3 font-medium">Durum</th>
                  <th className="pb-3 font-medium">Başlangıç</th>
                  <th className="pb-3 font-medium">Süre</th>
                  <th className="pb-3 font-medium">Skor</th>
                  <th className="pb-3 pr-3 text-right font-medium">Tetikleyici</th>
                </tr>
              </thead>
              <tbody>
                {visibleRuns.map((run) => (
                  <tr key={run.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                    <td className="py-3.5 pl-3">
                      <Link href={`/runs/${run.id}`} className="font-medium hover:text-primary">
                        {run.workflowName}
                      </Link>
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-muted-foreground">{run.id}</td>
                    <td className="py-3.5">
                      <Badge variant="outline" className={statusStyle(run.status)}>
                        {statusLabels[run.status]}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-muted-foreground">{formatRunDate(run.startedAt)}</td>
                    <td className="py-3.5 text-muted-foreground">{run.duration}</td>
                    <td className="py-3.5 font-medium">
                      {run.score === null ? "—" : `${Math.round(run.score * 100)}%`}
                    </td>
                    <td className="py-3.5 pr-3 text-right text-muted-foreground">{run.trigger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {runsQuery.isLoading ? (
              <p className="py-14 text-center text-sm text-muted-foreground">
                Çalıştırmalar yükleniyor...
              </p>
            ) : visibleRuns.length === 0 && (
              <div className="py-14 text-center">
                <Activity className="mx-auto size-5 text-muted-foreground/60" />
                <p className="mt-3 text-sm font-medium">Çalıştırma bulunamadı</p>
                <p className="mt-1 text-xs text-muted-foreground">Filtrelerini değiştirip tekrar dene.</p>
              </div>
            )}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {visibleRuns.length} çalıştırma listeleniyor · Kayıtlar backend veritabanında tutulur.
          </p>
        </CardContent>
      </Card>
    </WorkspaceShell>
  );
}
