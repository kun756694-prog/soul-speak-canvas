import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, Section, Callout } from "@/components/legal/legal-layout";

export const Route = createFileRoute("/aml-kyc")({
  head: () => ({
    meta: [
      { title: "AML / KYC Policy · CryptoWallet" },
      {
        name: "description",
        content:
          "Our anti-money-laundering and know-your-customer commitments — what we verify, why we verify it, and what triggers enhanced due diligence.",
      },
    ],
  }),
  component: AmlPage,
});

function AmlPage() {
  return (
    <LegalLayout
      title="AML / KYC Policy"
      subtitle="Anti-money-laundering rules exist to keep crime out of the financial system — and to keep honest users like you safe. Here is exactly how we apply them on CryptoWallet."
      updated="June 12, 2026"
    >
      <Section id="commit" title="1. Our Commitment">
        <p>
          CryptoWallet is committed to preventing the use of its services for money laundering, terrorist financing,
          sanctions evasion, and any other financial crime. We follow the recommendations of the Financial Action Task
          Force (FATF) and apply the local laws of every market we operate in.
        </p>
      </Section>

      <Section id="cdd" title="2. Customer Due Diligence">
        <p>Every user passes through a tiered identity-verification process before sensitive features unlock:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li><strong>Level 1 — Basic:</strong> full name, date of birth, nationality, government-issued ID.</li>
          <li><strong>Level 2 — Advanced:</strong> live selfie + liveness check matched against the ID image.</li>
          <li><strong>Level 3 — Address:</strong> recent utility bill or bank statement confirming residential address.</li>
        </ul>
        <p>
          P2P trading and on-platform transfers require Level 2 because they are the highest-risk surfaces for abuse. This
          is a hard, enforced rule — even administrators cannot bypass it without an explicit, audited override.
        </p>
      </Section>

      <Section id="edd" title="3. Enhanced Due Diligence Triggers">
        <p>We perform additional checks when any of the following apply:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Single transaction or 24-hour aggregate value above our enhanced-review threshold.</li>
          <li>Counter-party located in a high-risk or sanctioned jurisdiction.</li>
          <li>Politically exposed person (PEP) match, or PEP-adjacent relationship.</li>
          <li>Repeated chargebacks, disputed deposits, or pattern resembling layering.</li>
        </ul>
      </Section>

      <Section id="monitoring" title="4. Transaction Monitoring">
        <p>
          Every deposit, withdrawal, transfer, and P2P order is screened in near real time against typology rules tuned for
          common abuse patterns: structuring, smurfing, rapid in-out movement, and unusual counter-party clustering. Alerts
          are reviewed by trained analysts, and confirmed suspicious activity is reported to the relevant Financial
          Intelligence Unit.
        </p>
      </Section>

      <Section id="sanctions" title="5. Sanctions Screening">
        <Callout kind="warn">
          We screen every user against the UN, EU, UK HMT, and US OFAC sanctions lists at onboarding and continuously
          afterwards. Confirmed matches result in immediate account freeze and a report to the appropriate authority.
        </Callout>
      </Section>

      <Section id="record" title="6. Record-Keeping">
        <p>
          We retain KYC documentation and transaction records for at least 5 years (and longer where local law requires).
          Records are stored in encrypted, access-controlled storage and are made available to competent authorities under
          lawful request only.
        </p>
      </Section>

      <Section id="train" title="7. Staff Training &amp; Governance">
        <p>
          All staff with access to user data receive annual AML training. A designated Money Laundering Reporting Officer
          (MLRO) owns this policy, reviews suspicious-activity reports, and reports to senior management quarterly.
        </p>
      </Section>

      <Section id="report" title="8. Reporting Suspicious Activity">
        <p>
          If you spot suspicious behaviour from a counter-party — for example, pressure to move off-platform, refusal to
          show ID matching their KYC display name, or insistence on third-party payment methods — please open a dispute and
          message our support team via the Contact Us page. Your tip helps protect the community.
        </p>
      </Section>
    </LegalLayout>
  );
}
