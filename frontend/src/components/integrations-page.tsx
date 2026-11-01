import { ArrowUpRight, Boxes, CircleCheck, PlugZap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspaceShell } from "@/components/workspace-shell";

const integrations = [
  { name: "OpenAI", description: "AI ajanlarında model sağlayıcısı olarak kullan.", category: "AI sağlayıcısı", icon: "O", connected: false },
  { name: "Anthropic", description: "Claude modellerini iş akışlarına ekle.", category: "AI sağlayıcısı", icon: "A", connected: false },
  { name: "Webhook", description: "Akışları dış sistemlerden tetikle.", category: "Tetikleyici", icon: "↗", connected: true },
  { name: "PostgreSQL", description: "Harici veritabanı kaynaklarına bağlan.", category: "Veri kaynağı", icon: "P", connected: false },
];

export function IntegrationsPage() {
  return (
    <WorkspaceShell>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Çalışma alanı / Entegrasyonlar</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Entegrasyonlar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          İş akışlarında kullanacağın servisleri ve bağlantıları yönet.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.name} className="border-border/80 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-muted text-sm font-semibold text-foreground">
                  {integration.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">{integration.name}</h2>
                    {integration.connected && (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        <CircleCheck className="mr-1 size-3" /> Bağlı
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{integration.category}</p>
                </div>
              </div>
              <p className="mt-4 min-h-10 text-xs leading-5 text-muted-foreground">{integration.description}</p>
              <Button variant="outline" size="sm" className="mt-4 w-full gap-2" disabled>
                <PlugZap className="size-3.5" />
                {integration.connected ? "Bağlantıyı yönet" : "Yakında"}
                <ArrowUpRight className="ml-auto size-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <Boxes className="size-4" />
        Canlı bağlantı yönetimi backend ve gizli anahtar saklama altyapısı gerektirir.
      </p>
    </WorkspaceShell>
  );
}
