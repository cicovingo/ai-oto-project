"use client";

import { ArrowRight, Command, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  const [notice, setNotice] = useState("");

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1fr_1fr]">
      <section className="hidden flex-col justify-between bg-[#181932] p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-white/10">
            <Command className="size-4" />
          </span>
          flowmind
        </Link>
        <div className="max-w-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-indigo-200">AI workflow studio</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
            Akışların. Ajanların. Tek bir yerde.
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/65">
            AI otomasyonlarını görsel olarak oluştur, test et ve performansını izle.
          </p>
        </div>
        <p className="text-xs text-white/45">Flowmind önizlemesi</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-[390px] border-0 shadow-none">
          <CardContent className="p-0">
            <Link href="/" className="mb-10 flex items-center gap-3 text-sm font-semibold lg:hidden">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Command className="size-4" />
              </span>
              flowmind
            </Link>
            <span className="grid size-11 place-items-center rounded-xl bg-primary/8 text-primary">
              <LockKeyhole className="size-5" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight">Hesabına giriş yap</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Çalışma alanına erişmek için oturum aç.
            </p>
            <form
              className="mt-7 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setNotice("Kimlik doğrulama servisi henüz bağlı değil. Demo hesabıyla devam edebilirsin.");
              }}
            >
              <label className="block space-y-1.5">
                <span className="text-xs font-medium">E-posta</span>
                <Input type="email" name="email" autoComplete="email" placeholder="sen@ornek.com" required />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium">Parola</span>
                <Input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Parolan"
                  minLength={8}
                  required
                />
              </label>
              <Button type="submit" className="w-full">
                Giriş yap
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>
            {notice && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">{notice}</p>}
            <div className="my-6 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              VEYA
              <span className="h-px flex-1 bg-border" />
            </div>
            <Link
              href="/onboarding"
              className="flex h-9 w-full items-center justify-center rounded-lg border border-input text-sm font-medium transition hover:bg-muted"
            >
              Demo olarak devam et
            </Link>
            <p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">
              Demo modu kimlik bilgisi doğrulamaz veya saklamaz. Gerçek oturum yönetimi backend entegrasyonu gerektirir.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
