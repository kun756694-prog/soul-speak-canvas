import { Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Repeat2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  { href: "/deposit", label: "Deposit", icon: ArrowDownLeft, color: "text-[oklch(0.72_0.19_160)]" },
  { href: "/withdraw", label: "Withdraw", icon: ArrowUpRight, color: "text-primary" },
  { href: "/p2p", label: "P2P", icon: Repeat2, color: "text-[oklch(0.7_0.15_250)]" },
  { href: "/transfer", label: "Transfer", icon: Send, color: "text-[oklch(0.75_0.15_300)]" },
] as const;

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link key={a.label} to={a.href}>
            <Button variant="secondary" className="flex h-auto w-full flex-col items-center gap-2 py-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-card ${a.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{a.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
