import Link from "next/link";
import { ArrowRight, Bell, Shield, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspaceShell } from "@/components/workspace-shell";

const settings = [
  { title: "Ekip ve erişim", detail: "Üyeleri, davetleri ve çalışma alanı rollerini yönet.", icon: Users, href: "/settings/team" },
  { title: "Güvenlik", detail: "Oturum ve erişim denetimlerini yapılandır.", icon: Shield, href: "/settings/team" },
  { title: "Bildirimler", detail: "Çalıştırma durumu bildirimlerini düzenle.", icon: Bell, href: "/settings/team" },
];

export default function SettingsRoute() {
  return (
    <WorkspaceShell>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Çalışma alanı / Ayarlar</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ayarlar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Çalışma alanı tercihlerini ve üyelerini düzenle.</p>
      </div>
      <div className="mt-8 max-w-3xl space-y-3">
        {settings.map(({ title, detail, icon: Icon, href }) => (
          <Link key={title} href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="border-border/80 shadow-none transition hover:border-primary/30 hover:bg-muted/20">
              <CardContent className="flex items-center gap-4 p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/8 text-primary"><Icon className="size-4" /></span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </WorkspaceShell>
  );
}
