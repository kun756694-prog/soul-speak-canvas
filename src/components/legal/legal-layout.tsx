import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  updated: string;
  children: ReactNode;
}

export function LegalLayout({ title, subtitle, updated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-14 z-10 flex items-center gap-3 border-b border-border bg-background/95 p-4 backdrop-blur">
        <Link to="/">
          <Button variant="ghost" size="icon" aria-label="Back to home">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">Last updated · {updated}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <div className="mb-8 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Legal &amp; Compliance
          </div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">{subtitle}</p>
        </div>

        <article className="legal-prose space-y-6 text-[15px] leading-7 text-foreground/90">
          {children}
        </article>

        <LegalFooterLinks />
      </div>
    </div>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 space-y-3">
      <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
      <div className="space-y-3 text-foreground/85">{children}</div>
    </section>
  );
}

export function Callout({ kind = "info", children }: { kind?: "info" | "warn" | "success"; children: ReactNode }) {
  const styles =
    kind === "warn"
      ? "border-destructive/40 bg-destructive/10 text-destructive-foreground"
      : kind === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-foreground"
      : "border-primary/30 bg-primary/10 text-foreground";
  return <div className={`rounded-xl border p-4 text-sm ${styles}`}>{children}</div>;
}

function LegalFooterLinks() {
  const links: { to: string; label: string }[] = [
    { to: "/privacy", label: "Privacy Policy" },
    { to: "/terms", label: "Terms of Service" },
    { to: "/cookies", label: "Cookie Policy" },
    { to: "/aml-kyc", label: "AML / KYC Policy" },
    { to: "/risk", label: "Risk Disclosure" },
    { to: "/contact", label: "Contact Us" },
  ];
  return (
    <div className="mt-12 rounded-2xl border border-border bg-card/50 p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">More legal documents</p>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
