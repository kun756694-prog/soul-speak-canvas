import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck, Users, BadgeCheck, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-kyc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({ component: AdminHub });

function AdminHub() {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || isLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-6 text-center space-y-3">
        <h2 className="text-lg font-semibold">Admin only</h2>
        <p className="text-sm text-muted-foreground">You don't have admin access.</p>
        <Button asChild variant="outline"><Link to="/">Back home</Link></Button>
      </div>
    );
  }

  const cards = [
    { to: "/admin/users", title: "User Management", desc: "Promote admins, adjust point balances, set KYC status.", Icon: Users },
    { to: "/admin/kyc", title: "KYC Review", desc: "Approve or reject identity submissions.", Icon: BadgeCheck },
    { to: "/admin/deposits", title: "Deposit Review", desc: "Verify payment receipts and credit pending deposits.", Icon: Wallet },
  ] as const;


  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" />Admin Console</h1>
        <p className="text-sm text-muted-foreground">Manage users, balances, and verifications.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ to, title, desc, Icon }) => (
          <Link key={to} to={to}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><span className="font-semibold">{title}</span></div>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
