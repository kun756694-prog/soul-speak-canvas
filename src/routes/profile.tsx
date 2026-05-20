import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, ChevronRight, Copy, LogOut, Shield, Bell, HelpCircle, FileText, Check, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/lib/mock-data";
import { useKycStatus, useIsAdmin } from "@/hooks/use-kyc";
import { KycBadge } from "@/components/kyc/kyc-badge";
import { KycModal } from "@/components/kyc/kyc-modal";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

const levels = [
  { level: 1, label: "Basic", limit: "2 BTC/day" },
  { level: 2, label: "Verified", limit: "100 BTC/day" },
  { level: 3, label: "Advanced", limit: "Unlimited" },
];
const menuItems = [
  { icon: Shield, label: "Security Settings" },
  { icon: Bell, label: "Notifications" },
  { icon: HelpCircle, label: "Help Center" },
  { icon: FileText, label: "Terms of Service" },
];

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const { data: kycStatus = "unverified" } = useKycStatus();
  const { data: isAdmin } = useIsAdmin();
  const [copied, setCopied] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);

  if (!loading && !user) {
    navigate({ to: "/auth" });
    return null;
  }
  if (!user) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  const name = profile?.name || user.email?.split("@")[0] || "User";
  const level = profile?.kyc_level ?? 1;
  const totalTrades = profile?.total_trades ?? 0;
  const completionRate = Number(profile?.completion_rate ?? 0);
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
                {level >= 2 && <BadgeCheck className="h-5 w-5 text-primary" />}
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
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5 text-primary" />Identity Verification</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Verification status</p>
              <p className="text-xs text-muted-foreground">Required for P2P trading</p>
            </div>
            <KycBadge status={kycStatus} />
          </div>
          {kycStatus === "unverified" || kycStatus === "rejected" ? (
            <Button className="w-full" onClick={() => setKycOpen(true)}>
              {kycStatus === "rejected" ? "Resubmit Identity" : "Verify Identity"}
            </Button>
          ) : kycStatus === "pending" ? (
            <p className="text-xs text-muted-foreground">Your submission is under review.</p>
          ) : null}
          {isAdmin && (
            <Button asChild variant="outline" className="w-full"><Link to="/admin/kyc">Open admin review</Link></Button>
          )}
        </CardContent>
      </Card>


      <Card className="border-border">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><Shield className="h-5 w-5 text-primary" />Verification Level</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm">Level {level}</span><span className="text-sm text-muted-foreground">{levels[level - 1]?.label}</span></div>
            <Progress value={(level / 3) * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            {levels.map((l) => (
              <div key={l.level} className={`flex items-center justify-between rounded-lg p-3 ${l.level <= level ? "bg-[oklch(0.72_0.19_160)]/10" : "bg-secondary"}`}>
                <div className="flex items-center gap-2">
                  {l.level <= level ? <Check className="h-4 w-4 text-[oklch(0.72_0.19_160)]" /> : <div className="h-4 w-4 rounded-full border border-muted-foreground" />}
                  <span className={l.level <= level ? "text-[oklch(0.72_0.19_160)]" : "text-muted-foreground"}>Level {l.level} - {l.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{l.limit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-2"><CardTitle className="text-lg">Trading Statistics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-secondary p-4 text-center"><p className="text-2xl font-bold text-primary">{totalTrades}</p><p className="text-sm text-muted-foreground">Total Trades</p></div>
            <div className="rounded-lg bg-secondary p-4 text-center"><p className="text-2xl font-bold text-[oklch(0.72_0.19_160)]">{completionRate}%</p><p className="text-sm text-muted-foreground">Completion Rate</p></div>
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
            return (
              <button key={item.label} className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-accent transition-colors">
                <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-muted-foreground" /><span>{item.label}</span></div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full gap-2" onClick={logout}><LogOut className="h-4 w-4" />Log Out</Button>
    </div>
  );
}
