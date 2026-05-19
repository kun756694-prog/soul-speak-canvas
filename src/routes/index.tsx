import { createFileRoute } from "@tanstack/react-router";
import { BalanceCard } from "@/components/wallet/balance-card";
import { QuickActions } from "@/components/wallet/quick-actions";
import { RecentTransactions } from "@/components/wallet/recent-transactions";
import { useWallet } from "@/lib/mock-data";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { balance, transactions } = useWallet();
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <BalanceCard balance={balance} />
      <QuickActions />
      <RecentTransactions transactions={transactions.slice(0, 5)} />
    </div>
  );
}
