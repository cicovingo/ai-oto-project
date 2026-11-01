"use client";

import { ArrowLeft, ArrowRight, Bot, Gauge, GitBranch, Workflow } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    title: "Görsel akışını oluştur",
    description: "Girdi, AI ajanı, metrik ve koşul düğümlerini çalışma alanına ekle.",
    icon: Workflow,
  },
  {
    title: "Ajanını yapılandır",
    description: "Model talimatlarını ve gerekli parametreleri düğüm ayarlarından düzenle.",
    icon: Bot,
  },
  {
    title: "Test et ve ölç",
    description: "Akışını doğrula, test çalıştır ve metrik sonuçlarını incele.",
    icon: Gauge,
  },
];

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const active = steps[step];
  const Icon = active.icon;

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="relative hidden overflow-hidden bg-[#181932] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-white/10">
            <Workflow className="size-4" />
          </span>
          flowmind
        </Link>
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-200">
            Görsel otomasyon platformu
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
            Fikirlerini çalışan AI akışlarına dönüştür.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
            Düğümleri birleştir, ajanlarını yapılandır ve sonuçları tek bir çalışma alanından takip et.
          </p>
          <div className="mt-10 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white/10"><GitBranch className="size-4" /></span>
            <span className="h-px w-10 bg-white/30" />
            <span className="grid size-10 place-items-center rounded-xl bg-white/10"><Bot className="size-4" /></span>
            <span className="h-px w-10 bg-white/30" />
            <span className="grid size-10 place-items-center rounded-xl bg-white/10"><Gauge className="size-4" /></span>
          </div>
        </div>
        <p className="text-xs text-white/45">Ürün önizlemesi · Demo çalışma alanı</p>
        <div aria-hidden="true" className="absolute -bottom-40 -right-36 size-[32rem] rounded-full border border-white/10" />
        <div aria-hidden="true" className="absolute -bottom-24 -right-20 size-[22rem] rounded-full border border-white/10" />
      </section>

      <section className="flex min-h-screen flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-[360px]">
          <div className="mb-10 flex items-center justify-between">
            <Link href="/" className="text-sm font-semibold lg:hidden">flowmind</Link>
            <span className="ml-auto text-xs text-muted-foreground">Adım {step + 1} / {steps.length}</span>
          </div>
          <div className="flex gap-1.5" aria-label="Onboarding ilerlemesi">
            {steps.map((item, index) => (
              <span
                key={item.title}
                className={`h-1 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <Card className="mt-10 border-0 shadow-none">
            <CardContent className="p-0">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/8 text-primary">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight">{active.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{active.description}</p>
              <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium">Demo akışı</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px]">
                  {["Girdi", "AI ajanı", "F1 metriği", "Çıktı"].map((item, index) => (
                    <span key={item} className="contents">
                      <span className="rounded-md border bg-background px-2 py-1.5">{item}</span>
                      {index < 3 && <ArrowRight className="size-3 text-muted-foreground" />}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <Button
                  variant="ghost"
                  disabled={step === 0}
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Geri
                </Button>
                {step < steps.length - 1 ? (
                  <Button onClick={() => setStep((current) => current + 1)}>
                    Devam et
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                ) : (
                  <Link
                    href="/workflows/new"
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Örnek akışı oluştur
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                )}
              </div>
              <Link href="/" className="mt-5 block text-center text-xs text-muted-foreground hover:text-foreground">
                Şimdilik atla
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
