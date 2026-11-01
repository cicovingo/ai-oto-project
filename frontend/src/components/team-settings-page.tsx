"use client";

import { MailPlus, MoreHorizontal, Shield, Users } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace-shell";

type Member = { name: string; email: string; initials: string; role: "Yönetici" | "Üye"; status: "Aktif" | "Davet bekliyor" };

const initialMembers: Member[] = [
  { name: "Ece Yılmaz", email: "ece@acme.studio", initials: "EY", role: "Yönetici", status: "Aktif" },
  { name: "Mert Kaya", email: "mert@acme.studio", initials: "MK", role: "Üye", status: "Aktif" },
  { name: "Ada Demir", email: "ada@acme.studio", initials: "AD", role: "Üye", status: "Aktif" },
];

export function TeamSettingsPage() {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");

  function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLocaleLowerCase("tr");
    if (members.some((member) => member.email.toLocaleLowerCase("tr") === normalizedEmail)) {
      setNotice("Bu e-posta çalışma alanında zaten kayıtlı.");
      return;
    }
    const name = normalizedEmail.split("@")[0].replace(/[._-]+/g, " ");
    const initials = name
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toLocaleUpperCase("tr");
    setMembers((current) => [
      ...current,
      { name, email: normalizedEmail, initials, role: "Üye", status: "Davet bekliyor" },
    ]);
    setEmail("");
    setNotice("Demo daveti listeye eklendi; e-posta gönderilmedi.");
  }

  return (
    <WorkspaceShell>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Çalışma alanı / Ayarlar / Ekip</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ekip ve erişim</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Çalışma alanı üyelerini ve rollerini yönet.
        </p>
      </div>

      <Card className="mt-8 max-w-4xl border-border/80 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-4 pt-5">
          <div>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <Users className="size-4 text-primary" />
              Çalışma alanı üyeleri
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Yöneticiler üyeleri ve çalışma alanı ayarlarını yönetebilir.
            </p>
          </div>
          <Badge variant="secondary">{members.length} kişi</Badge>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form onSubmit={inviteMember} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 sm:flex-row">
            <label htmlFor="invite-email" className="sr-only">Davet edilecek kişinin e-postası</label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ekip@ornek.com"
              required
              className="bg-background"
            />
            <Button type="submit" className="shrink-0 gap-2">
              <MailPlus className="size-4" />
              Üye davet et
            </Button>
          </form>
          {notice && <p role="status" className="mt-3 text-xs text-muted-foreground">{notice}</p>}

          <div className="mt-5 divide-y divide-border/70">
            {members.map((member, index) => (
              <div key={member.email} className="flex flex-wrap items-center gap-3 py-3.5">
                <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {member.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{member.name}</p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{member.email}</p>
                </div>
                <Badge
                  variant="outline"
                  className={member.status === "Aktif" ? "" : "border-amber-200 bg-amber-50 text-amber-700"}
                >
                  {member.status}
                </Badge>
                {index === 0 ? (
                  <span className="flex min-w-[92px] items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Shield className="size-3.5" /> Yönetici
                  </span>
                ) : (
                  <label>
                    <span className="sr-only">{member.name} rolü</span>
                    <select
                      value={member.role}
                      onChange={(event) =>
                        setMembers((current) =>
                          current.map((item) =>
                            item.email === member.email
                              ? { ...item, role: event.target.value as Member["role"] }
                              : item,
                          ),
                        )
                      }
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option>Üye</option>
                      <option>Yönetici</option>
                    </select>
                  </label>
                )}
                <Button variant="ghost" size="icon-sm" aria-label={`${member.name} seçenekleri`}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-lg bg-muted/40 p-3 text-[11px] leading-5 text-muted-foreground">
            Bu ekran arayüz prototipidir. Davetler, roller ve erişim yetkileri bu tarayıcıda veya backend&apos;de henüz kalıcı değildir.
          </p>
        </CardContent>
      </Card>
    </WorkspaceShell>
  );
}
