import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, Section } from "@/components/legal/legal-layout";
import { Mail, MessageCircle, ShieldCheck, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us · CryptoWallet" },
      {
        name: "description",
        content:
          "Get in touch with the CryptoWallet support, privacy, and compliance teams. Real humans, fast responses.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <LegalLayout
      title="Contact Us"
      subtitle="Real humans, real responses. Pick the channel that fits your question — we'll get back to you as quickly as we can."
      updated="June 12, 2026"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ContactCard
          icon={<Mail className="h-5 w-5" />}
          title="General Support"
          desc="Account access, deposits, withdrawals, trade disputes."
          handle="support@cryptowallet.app"
          eta="Within 24 hours"
        />
        <ContactCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Privacy &amp; Data Requests"
          desc="Access, correction, deletion, and portability requests."
          handle="privacy@cryptowallet.app"
          eta="Within 30 days"
        />
        <ContactCard
          icon={<MessageCircle className="h-5 w-5" />}
          title="Compliance &amp; AML"
          desc="Lawful requests, KYC escalations, sanctions queries."
          handle="compliance@cryptowallet.app"
          eta="Within 5 business days"
        />
        <ContactCard
          icon={<Clock className="h-5 w-5" />}
          title="Security Reports"
          desc="Responsible disclosure of vulnerabilities."
          handle="security@cryptowallet.app"
          eta="Acknowledged within 48 hours"
        />
      </div>

      <Section id="before" title="Before you write">
        <ul className="ml-5 list-disc space-y-1.5">
          <li>For trade disputes, please open the dispute in the order chat first — it gives our team full context.</li>
          <li>Include your account ID (from Profile) but never your password or 2FA code.</li>
          <li>Attach screenshots where possible; redact any third-party personal data.</li>
        </ul>
      </Section>

      <Section id="hours" title="Operating Hours">
        <p>
          Our support team is staffed 24 / 7. Privacy, compliance, and security teams operate on business days, Monday
          through Friday, and triage urgent reports outside of those hours.
        </p>
      </Section>
    </LegalLayout>
  );
}

function ContactCard({
  icon, title, desc, handle, eta,
}: { icon: React.ReactNode; title: string; desc: string; handle: string; eta: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <h4 className="text-sm font-semibold" dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <a
        href={`mailto:${handle}`}
        className="mt-3 inline-block break-all rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/70"
      >
        {handle}
      </a>
      <p className="mt-2 text-xs text-muted-foreground">⏱ {eta}</p>
    </div>
  );
}
