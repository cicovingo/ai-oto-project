"use client";

import {
  Activity,
  Boxes,
  Command,
  FileText,
  Gauge,
  LayoutDashboard,
  Sparkles,
  Settings2,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const primaryNavigation = [
  { label: "Genel Bakış", href: "/", icon: LayoutDashboard },
  { label: "İş Akışları", href: "/workflows", icon: Workflow },
  { label: "AI Proje Görevi", href: "/project-tasks", icon: Sparkles },
  { label: "Çalıştırmalar", href: "/runs", icon: Activity },
  { label: "Metrik Kütüphanesi", href: "/metrics", icon: Gauge },
  { label: "Raporlar", href: "/reports", icon: FileText },
];

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden min-h-screen w-[248px] shrink-0 flex-col border-r border-border/70 bg-white px-4 py-5 lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Command className="size-[18px]" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">flowmind</span>
        </Link>

        <div className="mt-8 flex items-center gap-3 rounded-xl border border-border/80 p-2.5">
          <Avatar className="rounded-lg" size="sm">
            <AvatarFallback className="rounded-lg bg-[#e8eaff] text-[10px] font-semibold text-[#5458b8]">
              AC
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">Acme Studio</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Ücretsiz plan</p>
          </div>
        </div>

        <p className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Çalışma alanı
        </p>
        <nav className="mt-2 space-y-1" aria-label="Ana menü">
          {primaryNavigation.map(({ label, href, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
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
            );
          })}
        </nav>

        <p className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Yönetim
        </p>
        <nav className="mt-2 space-y-1" aria-label="Yönetim menüsü">
          <Link
            href="/integrations"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] ${
              pathname.startsWith("/integrations")
                ? "bg-primary/8 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <Boxes className="size-[17px]" />
            Entegrasyonlar
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] ${
              pathname.startsWith("/settings")
                ? "bg-primary/8 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <Settings2 className="size-[17px]" />
            Ayarlar
          </Link>
        </nav>

        <div className="mt-auto">
          <Card className="border-primary/10 bg-[#f7f7ff] shadow-none">
            <CardContent className="p-3.5">
              <p className="text-xs font-semibold">Ekibinle büyüt</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                İş akışlarını birlikte oluştur ve yönet.
              </p>
              <Link
                href="/settings/team"
                className="mt-3 flex h-8 w-full items-center justify-center rounded-lg border border-border bg-white px-2.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Ekibi yönet
              </Link>
            </CardContent>
          </Card>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md sm:px-8">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Command className="size-4" />
            </span>
            <span className="text-sm font-semibold">flowmind</span>
          </Link>
          <p className="hidden text-sm font-medium text-muted-foreground lg:block">
            Acme Studio <span className="px-1 text-border">/</span>{" "}
            {primaryNavigation.find((item) =>
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
            )?.label ?? "Çalışma alanı"}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              aria-label="Bildirimler"
            >
              <Activity className="size-[18px]" />
            </Button>
            <Separator orientation="vertical" className="hidden h-7 sm:block" />
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarFallback className="bg-[#e9e9ff] text-xs font-semibold text-[#5753a4]">
                  EY
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-xs font-medium">Ece Yılmaz</p>
                <p className="text-[10px] text-muted-foreground">Yönetici</p>
              </div>
            </div>
          </div>
        </header>
        <nav
          className="flex gap-1 overflow-x-auto border-b border-border/70 bg-background px-4 py-2 lg:hidden"
          aria-label="Mobil ana menü"
        >
          {primaryNavigation.map(({ label, href, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
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
          {children}
        </main>
      </div>
    </div>
  );
}
