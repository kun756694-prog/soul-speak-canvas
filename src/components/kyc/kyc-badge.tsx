import type { KycStatus } from "@/hooks/use-kyc";
import { BadgeCheck, Clock, ShieldAlert, ShieldX } from "lucide-react";

const META: Record<KycStatus, { label: string; cls: string; Icon: typeof BadgeCheck }> = {
  unverified: { label: "Unverified", cls: "bg-destructive/15 text-destructive border-destructive/30", Icon: ShieldAlert },
  pending:    { label: "Pending Approval", cls: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", Icon: Clock },
  verified:   { label: "Verified", cls: "bg-[oklch(0.72_0.19_160)]/15 text-[oklch(0.72_0.19_160)] border-[oklch(0.72_0.19_160)]/30", Icon: BadgeCheck },
  rejected:   { label: "Rejected", cls: "bg-destructive/15 text-destructive border-destructive/30", Icon: ShieldX },
};

export function KycBadge({ status }: { status: KycStatus }) {
  const { label, cls, Icon } = META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}
