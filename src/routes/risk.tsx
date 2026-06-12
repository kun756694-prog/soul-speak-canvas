import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, Section, Callout } from "@/components/legal/legal-layout";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk Disclosure · CryptoWallet" },
      {
        name: "description",
        content:
          "Trading and holding digital assets involves real risk. Read this before you deposit, transfer, or trade on CryptoWallet.",
      },
    ],
  }),
  component: RiskPage,
});

function RiskPage() {
  return (
    <LegalLayout
      title="Risk Disclosure"
      subtitle="Crypto and P2P trading can be rewarding, but they also carry real, sometimes total, financial risk. Read this page in full before you commit funds you cannot afford to lose."
      updated="June 12, 2026"
    >
      <Section id="general" title="1. General Warning">
        <Callout kind="warn">
          Digital assets are volatile and largely unregulated in many jurisdictions. Their value can move sharply in either
          direction within minutes, and past performance is never a reliable indicator of future results.
        </Callout>
      </Section>

      <Section id="market" title="2. Market Risk">
        <p>
          Prices on the Platform are set by P2P advertisers, not by an institutional market maker. Wide spreads, sudden
          gaps, and temporary liquidity gaps are normal. Always confirm the going rate before accepting a trade and never
          trade with funds you cannot afford to lose entirely.
        </p>
      </Section>

      <Section id="counterparty" title="3. Counter-party Risk">
        <p>
          In a P2P trade you transact directly with another user. We verify identity and freeze POINTs on the platform
          side, but we cannot move fiat funds in or out of your external bank or wallet on your behalf. If a counter-party
          fails to release fiat after you pay them, you may need to escalate through our dispute process or, in serious
          cases, through your local payment provider.
        </p>
      </Section>

      <Section id="tech" title="4. Technology &amp; Operational Risk">
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Network congestion or downtime at our cloud provider may delay deposits, withdrawals, or chat messages.</li>
          <li>Mobile or browser bugs can occasionally interrupt a trade in progress; in-app chat preserves evidence.</li>
          <li>Phishing, SIM-swap, and social-engineering attacks remain the most common threats to user funds — enable 2FA, never share recovery codes, and beware of anyone asking for your password.</li>
        </ul>
      </Section>

      <Section id="regulatory" title="5. Regulatory &amp; Legal Risk">
        <p>
          The legal status of digital assets varies between countries and is evolving rapidly. New laws, sanctions, or tax
          rules can be introduced with little notice and may affect your ability to deposit, withdraw, trade, or convert
          POINTs back into fiat. You are responsible for understanding the laws of your country of residence.
        </p>
      </Section>

      <Section id="tax" title="6. Tax">
        <p>
          Profits realised from trading or holding digital assets may be subject to income, capital-gains, or other tax in
          your jurisdiction. We do not provide tax advice. Consider consulting a qualified tax professional.
        </p>
      </Section>

      <Section id="ack" title="7. Your Acknowledgement">
        <p>
          By using the Platform you confirm that you have read this Risk Disclosure, understand the risks involved, and
          accept full responsibility for your trading decisions. CryptoWallet is a tool, not financial advice.
        </p>
      </Section>
    </LegalLayout>
  );
}
