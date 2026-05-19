import { createFileRoute, Link } from "@tanstack/react-router";
import { BalanceCard } from "@/components/wallet/balance-card";
import { QuickActions } from "@/components/wallet/quick-actions";
import { RecentTransactions } from "@/components/wallet/recent-transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, loading } = useAuth();
  const { balance, transactions } = useWallet();

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Card className="border-border">
          <CardContent className="space-y-4 p-6 text-center">
            <h2 className="text-xl font-bold">Welcome to CryptoWallet</h2>
            <p className="text-sm text-muted-foreground">Sign in to access your wallet, transactions, and P2P trading.</p>
            <Button asChild className="w-full"><Link to="/auth">Sign In or Create Account</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <BalanceCard balance={balance} />
      <QuickActions />
      <RecentTransactions transactions={transactions.slice(0, 5)} />
    </div>
  );
}
