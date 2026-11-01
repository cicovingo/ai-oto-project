"use client";

import { ArrowUpRight, Gauge, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace-shell";

type MetricDefinition = {
  id: string;
  name: string;
  category: "Sınıflandırma" | "Metin kalitesi";
  description: string;
  formula: string;
  sample: number;
  defaultThreshold: number;
  parameters: { name: string; type: "number" | "select"; defaultValue: string }[];
};

const catalog: MetricDefinition[] = [
  {
    id: "accuracy",
    name: "Doğruluk (Accuracy)",
    category: "Sınıflandırma",
    description: "Doğru tahminlerin tüm tahminlere oranını ölçer.",
    formula: "Doğru tahmin / Toplam tahmin",
    sample: 0.94,
    defaultThreshold: 0.8,
    parameters: [{ name: "Ortalama yöntemi", type: "select", defaultValue: "Micro" }],
  },
  {
    id: "precision",
    name: "Precision",
    category: "Sınıflandırma",
    description: "Pozitif tahminlerin ne kadarının doğru olduğunu ölçer.",
    formula: "TP / (TP + FP)",
    sample: 0.88,
    defaultThreshold: 0.75,
    parameters: [{ name: "Pozitif sınıf", type: "select", defaultValue: "1" }],
  },
  {
    id: "recall",
    name: "Recall",
    category: "Sınıflandırma",
    description: "Gerçek pozitiflerin ne kadarının bulunduğunu ölçer.",
    formula: "TP / (TP + FN)",
    sample: 0.82,
    defaultThreshold: 0.75,
    parameters: [{ name: "Pozitif sınıf", type: "select", defaultValue: "1" }],
  },
  {
    id: "f1",
    name: "F1 skoru",
    category: "Sınıflandırma",
    description: "Precision ve recall değerlerinin harmonik ortalamasıdır.",
    formula: "2 × (Precision × Recall) / (Precision + Recall)",
    sample: 0.85,
    defaultThreshold: 0.8,
    parameters: [{ name: "Ortalama yöntemi", type: "select", defaultValue: "Macro" }],
  },
  {
    id: "relevance",
    name: "Yanıt ilgililiği",
    category: "Metin kalitesi",
    description: "Üretilen yanıtın kullanıcı sorusuyla ilgisini puanlar.",
    formula: "Model tabanlı değerlendirme · 0–1",
    sample: 0.91,
    defaultThreshold: 0.8,
    parameters: [
      { name: "Değerlendirme ölçeği", type: "select", defaultValue: "0–1" },
      { name: "Minimum eşik", type: "number", defaultValue: "0.8" },
    ],
  },
  {
    id: "groundedness",
    name: "Kaynağa bağlılık",
    category: "Metin kalitesi",
    description: "Yanıttaki ifadelerin verilen kaynaklarla desteklenmesini ölçer.",
    formula: "Desteklenen iddia / Tüm iddialar",
    sample: 0.78,
    defaultThreshold: 0.8,
    parameters: [{ name: "Minimum eşik", type: "number", defaultValue: "0.8" }],
  },
];

export function MetricsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tümü");
  const [selectedId, setSelectedId] = useState(catalog[0].id);
  const [threshold, setThreshold] = useState(String(catalog[0].defaultThreshold));
  const [parameterValue, setParameterValue] = useState(catalog[0].parameters[0].defaultValue);
  const selected = catalog.find((metric) => metric.id === selectedId) ?? catalog[0];
  const visibleMetrics = useMemo(
    () =>
      catalog.filter((metric) => {
        const matchesQuery =
          !query.trim() ||
          `${metric.name} ${metric.description}`.toLocaleLowerCase("tr").includes(query.trim().toLocaleLowerCase("tr"));
        return matchesQuery && (category === "Tümü" || metric.category === category);
      }),
    [category, query],
  );
  const currentThreshold = Number(threshold);
  const thresholdValid =
    Number.isFinite(currentThreshold) && currentThreshold >= 0 && currentThreshold <= 1;
  const passes = thresholdValid && selected.sample >= currentThreshold;

  function chooseMetric(metric: MetricDefinition) {
    setSelectedId(metric.id);
    setThreshold(String(metric.defaultThreshold));
    setParameterValue(metric.parameters[0]?.defaultValue ?? "");
  }

  return (
    <WorkspaceShell>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Çalışma alanı / Metrik kütüphanesi</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Metrik kütüphanesi</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajan çıktılarını değerlendirmek için metrikleri keşfet ve parametrelerini önizle.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(330px,0.8fr)]">
        <Card className="border-border/80 shadow-none">
          <CardHeader className="space-y-4 px-5 pb-4 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[15px]">Hazır metrikler</CardTitle>
              <Badge variant="secondary">{catalog.length} metrik</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
              <div className="relative">
                <label htmlFor="metric-search" className="sr-only">Metrik ara</label>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="metric-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Metrik ara..."
                  className="pl-9"
                />
              </div>
              <label className="sr-only" htmlFor="metric-category">Kategori seç</label>
              <select
                id="metric-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option>Tümü</option>
                <option>Sınıflandırma</option>
                <option>Metin kalitesi</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-5 pb-5">
            {visibleMetrics.length ? visibleMetrics.map((metric) => (
              <button
                key={metric.id}
                onClick={() => chooseMetric(metric)}
                aria-pressed={metric.id === selectedId}
                className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                  metric.id === selectedId
                    ? "border-primary/40 bg-primary/[0.035] ring-1 ring-primary/15"
                    : "border-border/70 hover:bg-muted/40"
                }`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                  <Gauge className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold">{metric.name}</span>
                    <Badge variant="outline" className="h-5 text-[9px]">{metric.category}</Badge>
                  </span>
                  <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">
                    {metric.description}
                  </span>
                </span>
                {metric.id === selectedId && <ArrowUpRight className="mt-1 size-4 shrink-0 text-primary" />}
              </button>
            )) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Aramana uygun metrik bulunamadı.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-none">
          <CardHeader className="px-5 pb-3 pt-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              <CardTitle className="text-[15px]">Parametre önizlemesi</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              {selected.name} · {selected.category}
            </p>
          </CardHeader>
          <CardContent className="space-y-5 px-5 pb-5">
            <div className="rounded-lg bg-muted/50 p-3.5">
              <p className="text-xs font-medium">Metrik açıklaması</p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{selected.description}</p>
              <p className="mt-3 text-[10px] text-muted-foreground">
                Hesaplama: <span className="font-mono text-foreground">{selected.formula}</span>
              </p>
            </div>
            {selected.parameters.map((parameter) => (
              <label key={parameter.name} className="block space-y-1.5">
                <span className="text-xs font-medium">{parameter.name}</span>
                {parameter.type === "select" ? (
                  <select
                    value={parameterValue}
                    onChange={(event) => setParameterValue(event.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    {parameter.name === "Ortalama yöntemi" ? (
                      <>
                        <option>Micro</option>
                        <option>Macro</option>
                        <option>Weighted</option>
                      </>
                    ) : parameter.name === "Pozitif sınıf" ? (
                      <>
                        <option>1</option>
                        <option>0</option>
                      </>
                    ) : (
                      <>
                        <option>0–1</option>
                        <option>0–5</option>
                      </>
                    )}
                  </select>
                ) : (
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={threshold}
                    aria-invalid={!thresholdValid}
                    onChange={(event) => setThreshold(event.target.value)}
                  />
                )}
              </label>
            ))}
            {!selected.parameters.some((parameter) => parameter.name === "Minimum eşik") && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium">Minimum eşik</span>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={threshold}
                  aria-invalid={!thresholdValid}
                  onChange={(event) => setThreshold(event.target.value)}
                />
              </label>
            )}
            {!thresholdValid && (
              <p role="alert" className="text-xs text-destructive">
                Eşik 0 ile 1 arasında bir sayı olmalı.
              </p>
            )}
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-medium">Örnek sonuç önizlemesi</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold tracking-tight">
                    {(selected.sample * 100).toFixed(0)}%
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Demo veri · Tahmini sonuç
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={passes ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}
                >
                  {passes ? "Eşiği geçti" : "Eşiğin altında"}
                </Badge>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${selected.sample * 100}%` }} />
              </div>
            </div>
            <p className="text-[10px] leading-4 text-muted-foreground">
              Bu önizleme örnek veridir. Metrik düğümlerinin gerçek değerlendirmesi henüz çalıştırma motoruna bağlı değildir.
            </p>
          </CardContent>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
