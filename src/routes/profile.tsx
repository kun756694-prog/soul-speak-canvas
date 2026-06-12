import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, ChevronRight, Copy, LogOut, Shield, Bell, HelpCircle, FileText, Check, ShieldCheck, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/lib/mock-data";
import { useKycLevel, useIsAdmin, type LevelInfo } from "@/hooks/use-kyc";
import { KycBadge } from "@/components/kyc/kyc-badge";
import { KycModal } from "@/components/kyc/kyc-modal";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

const LEVELS: { level: 1 | 2 | 3; label: string; desc: string; unlock: string }[] = [
  { level: 1, label: "Basic Verification", desc: "Full name + ID document", unlock: "Account access" },
  { level: 2, label: "Advanced Verification", desc: "Live selfie + Government ID", unlock: "Unlocks P2P Trading & Transfers" },
  { level: 3, label: "Address Verification", desc: "Utility bill or bank statement", unlock: "Raises trading limits" },
];

const menuItems: { icon: typeof Shield; label: string; to?: string }[] = [
  { icon: Shield, label: "Security Settings" },
  { icon: Bell, label: "Notifications" },
  { icon: HelpCircle, label: "Help Center", to: "/contact" },
  { icon: FileText, label: "Privacy Policy", to: "/privacy" },
  { icon: FileText, label: "Terms of Service", to: "/terms" },
  { icon: FileText, label: "Cookie Policy", to: "/cookies" },
  { icon: ShieldCheck, label: "AML / KYC Policy", to: "/aml-kyc" },
  { icon: ShieldCheck, label: "Risk Disclosure", to: "/risk" },
];

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const { data: kyc } = useKycLevel();
  const { data: isAdmin } = useIsAdmin();
  const [copied, setCopied] = useState(false);
  const [openLevel, setOpenLevel] = useState<1 | 2 | 3 | null>(null);

  if (!loading && !user) {
    navigate({ to: "/auth" });
    return null;
  }
  if (!user) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  const name = profile?.name || user.email?.split("@")[0] || "User";
  const approvedLevel = kyc?.approvedLevel ?? 0;
  const joinedAt = profile?.created_at ? new Date(profile.created_at) : new Date(user.created_at);

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary text-2xl font-bold">{name[0]?.toUpperCase()}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{name}</h1>
                {approvedLevel >= 2 && <BadgeCheck className="h-5 w-5 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">UID: {user.id.slice(0, 8)}…</code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyId}>
                  {copied ? <Check className="h-3 w-3 text-[oklch(0.72_0.19_160)]" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />Identity Verification
          </CardTitle>
          <p className="text-xs text-muted-foreground">Complete each level in order. Higher levels unlock more features.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {LEVELS.map((l, idx) => {
            const info: LevelInfo = kyc?.perLevel[l.level] ?? { level: l.level, status: "unverified", submitted_at: null, notes: null };
            const prevApproved = idx === 0 || approvedLevel >= l.level - 1;
            const isApproved = info.status === "verified";
            const locked = !prevApproved;
            return (
              <div key={l.level} className={`rounded-lg border p-3 ${isApproved ? "border-[oklch(0.72_0.19_160)]/40 bg-[oklch(0.72_0.19_160)]/5" : "border-border bg-secondary/30"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">Level {l.level} · {l.label}</span>
                      {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{l.desc}</p>
                    <p className="text-xs text-primary mt-0.5">{l.unlock}</p>
                    {info.notes && info.status === "rejected" && (
                      <p className="text-xs text-destructive mt-1">Rejected: {info.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <KycBadge status={info.status} />
                    {!isApproved && !locked && info.status !== "pending" && (
                      <Button size="sm" onClick={() => setOpenLevel(l.level)}>
                        {info.status === "rejected" ? "Resubmit" : "Verify"}
                      </Button>
                    )}
                    {info.status === "pending" && (
                      <Button size="sm" variant="outline" disabled>Pending</Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {isAdmin && (
            <Button asChild variant="outline" className="w-full"><Link to="/admin/kyc">Open admin review</Link></Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-2"><CardTitle className="text-lg">Trading Statistics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-secondary p-4 text-center">
              <p className="text-2xl font-bold text-primary">{profile?.total_trades ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total Trades</p>
            </div>
            <div className="rounded-lg bg-secondary p-4 text-center">
              <p className="text-2xl font-bold text-[oklch(0.72_0.19_160)]">{Number(profile?.completion_rate ?? 0)}%</p>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span>{joinedAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const inner = (
              <>
                <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-muted-foreground" /><span>{item.label}</span></div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </>
            );
            return item.to ? (
              <Link key={item.label} to={item.to} className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-accent transition-colors">
                {inner}
              </Link>
            ) : (
              <button key={item.label} className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-accent transition-colors">
                {inner}
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full gap-2" onClick={logout}><LogOut className="h-4 w-4" />Log Out</Button>
      <KycModal open={openLevel !== null} onOpenChange={(v) => { if (!v) setOpenLevel(null); }} level={openLevel ?? 1} />
    </div>
  );
}
