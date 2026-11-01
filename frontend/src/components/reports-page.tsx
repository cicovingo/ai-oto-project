"use client";

import { Download, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceShell } from "@/components/workspace-shell";
import { useGetRunsQuery, useGetWorkflowsQuery } from "@/lib/store/api";

export function ReportsPage() {
  const workflowsQuery = useGetWorkflowsQuery("demo");
  const runsQuery = useGetRunsQuery("demo");
  const items = workflowsQuery.data ?? [];
  const runs = runsQuery.data ?? [];
  const completedRuns = runs.filter((run) => run.status === "completed");
  const finishedRuns = runs.filter((run) =>
    ["completed", "failed", "cancelled"].includes(run.status),
  );
  const successRate = finishedRuns.length
    ? Math.round((completedRuns.length / finishedRuns.length) * 100)
    : null;

  function exportReport() {
    const data = [
      ["Rapor", "Flowmind iş akışı özeti"],
      ["Oluşturulma", new Date().toLocaleString("tr-TR")],
      ["İş akışı sayısı", String(items.length)],
      ["Toplam çalıştırma", String(runs.length)],
      ["Tamamlanan çalıştırma", String(completedRuns.length)],
      ["Başarı oranı", successRate === null ? "" : `${successRate}%`],
      [],
      ["Çalıştırma", "İş akışı", "Durum", "Başlangıç", "Süre", "Skor"],
      ...runs.map((run) => [
        run.id,
        run.workflowName,
        run.status,
        run.startedAt,
        run.duration,
        run.score === null ? "" : `${Math.round(run.score * 100)}%`,
      ]),
    ];
    const csv = `\uFEFF${data
      .map((row) =>
        row.map((field) => `"${String(field ?? "").replaceAll('"', '""')}"`).join(","),
      )
      .join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "flowmind-ozet-raporu.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <WorkspaceShell>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Çalışma alanı / Raporlar</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Raporlar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Backend’de saklanan workflow ve çalıştırma verilerini incele ve dışa aktar.
        </p>
      </div>
      {(workflowsQuery.isError || runsQuery.isError) && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          Rapor verileri backend’den alınamadı. Backend bağlantısını kontrol et.
        </p>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["İş akışları", String(items.length)],
          ["Toplam çalıştırma", String(runs.length)],
          ["Tamamlanma oranı", successRate === null ? "—" : `${successRate}%`],
        ].map(([label, value]) => (
          <Card key={label} className="border-border/80 shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-3 text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 max-w-3xl border-border/80 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[15px]">
            <FileSpreadsheet className="size-4 text-primary" />
            Çalıştırma özeti
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Filtrelenmemiş çalışma alanı çalıştırmalarının CSV dışa aktarımı.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-between gap-4 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <p className="text-xs leading-5 text-muted-foreground">
                Rapor backend’deki çalıştırma kayıtlarını içerir. Hassas girdi ve sağlayıcı anahtarı dışa aktarılmaz.
              </p>
            </div>
            <Button className="shrink-0 gap-2" onClick={exportReport} disabled={runs.length === 0}>
              <Download className="size-4" />
              CSV indir
            </Button>
          </div>
        </CardContent>
      </Card>
    </WorkspaceShell>
  );
}
