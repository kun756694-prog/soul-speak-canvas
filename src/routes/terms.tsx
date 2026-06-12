import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, Section, Callout } from "@/components/legal/legal-layout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · CryptoWallet" },
      {
        name: "description",
        content:
          "The rules of the road for using CryptoWallet — your account, your responsibilities, our obligations, and what happens if something goes wrong.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="A clear, two-way agreement between you and CryptoWallet. Read it once and you'll know exactly what you can expect from us — and what we expect from you."
      updated="June 12, 2026"
    >
      <Section id="agree" title="1. Acceptance of Terms">
        <p>
          These Terms of Service ("Terms") form a binding contract between you and CryptoWallet. By creating an account,
          signing in, depositing funds, posting a P2P advertisement, transferring points, or using any other feature of the
          Platform, you confirm that you have read, understood, and agreed to be bound by these Terms together with our
          Privacy Policy, Cookie Policy, AML/KYC Policy, and Risk Disclosure.
        </p>
      </Section>

      <Section id="eligibility" title="2. Eligibility">
        <ul className="ml-5 list-disc space-y-1.5">
          <li>You are at least 18 years old (or the legal age of majority in your country).</li>
          <li>You have the legal capacity to enter into a binding contract.</li>
          <li>You are not a resident of a country we cannot lawfully serve, and you are not on any international sanctions list.</li>
          <li>You are acting on your own behalf, not as an undisclosed agent for a third party.</li>
        </ul>
      </Section>

      <Section id="account" title="3. Your Account">
        <p>
          You are responsible for keeping your sign-in credentials, recovery email, and any 2FA device secure. Treat your
          account like your bank account — because in many ways it is one. You agree to notify us immediately if you
          suspect unauthorised access.
        </p>
        <p>
          Each person may hold only one personal account. Creating multiple accounts to bypass limits, KYC, or moderation
          decisions is grounds for permanent closure of every linked account and forfeiture of points held in violation of
          these Terms.
        </p>
      </Section>

      <Section id="kyc-tier" title="4. Verification Tiers &amp; Feature Gates">
        <p>To balance accessibility with regulatory compliance, features unlock as you complete verification:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li><strong>Level 0 (unverified):</strong> sign in, browse, and read the public order book.</li>
          <li><strong>Level 1 (basic):</strong> deposit and withdraw points within standard daily limits.</li>
          <li><strong>Level 2 (advanced):</strong> post P2P advertisements and transfer points to other accounts.</li>
          <li><strong>Level 3 (address):</strong> raised trading and withdrawal limits for high-volume users.</li>
        </ul>
      </Section>

      <Section id="deposits" title="5. Deposits, Withdrawals &amp; the Point System">
        <p>
          The internal unit of value on the Platform is the <strong>POINT</strong>, exchanged at a fixed rate of{" "}
          <strong>1 POINT = 1 USD</strong>. Deposits are processed manually after you upload a payment receipt; an
          administrator reviews the receipt and credits your wallet on approval. Withdrawals are dispatched to the
          on-platform address you supply.
        </p>
        <Callout kind="warn">
          You are solely responsible for the accuracy of the wallet address or payment details you provide. Transfers sent
          to incorrect addresses on external networks may be irretrievable.
        </Callout>
      </Section>

      <Section id="p2p" title="6. P2P Trading Rules">
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Honour every advertisement you post. Cancelling repeatedly mid-trade harms your completion rate.</li>
          <li>Pay or release within the time window you committed to. Counter-parties may open a dispute after expiry.</li>
          <li>Communicate exclusively in the in-app chat. Off-platform contact is at your own risk and outside our protection.</li>
          <li>Never request or send payment receipts that show personal data beyond what is necessary to prove the transfer.</li>
          <li>We do not act as escrow agent for fiat payments — we only freeze and release POINTs on the Platform side.</li>
        </ul>
      </Section>

      <Section id="prohibited" title="7. Prohibited Conduct">
        <p>You agree not to:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Use the Platform for money laundering, terrorist financing, sanctions evasion, or any other illegal purpose.</li>
          <li>Submit forged, stolen, or AI-generated identity documents during KYC.</li>
          <li>Attempt to probe, scan, or breach the security of the Platform or any other user.</li>
          <li>Harass, threaten, or discriminate against another user inside the chat.</li>
          <li>Use bots, scrapers, or any automated system to interact with the Platform without our written permission.</li>
          <li>Reverse-engineer, decompile, or attempt to extract our source code.</li>
        </ul>
      </Section>

      <Section id="fees" title="8. Fees">
        <p>
          The Platform may charge fees for deposits, withdrawals, transfers, and successful P2P trades. The current fee
          schedule is always displayed on the relevant action screen before you confirm a transaction. Where fees change,
          we will give at least 14 days' notice via in-app banner and email.
        </p>
      </Section>

      <Section id="suspension" title="9. Suspension &amp; Termination">
        <p>
          We may suspend or terminate your account, freeze a transaction, or refuse a withdrawal where we reasonably
          believe you have breached these Terms, violated applicable law, exposed the Platform or other users to risk, or
          where a regulator or court orders us to do so. Wherever possible, we will tell you why.
        </p>
      </Section>

      <Section id="ip" title="10. Intellectual Property">
        <p>
          The Platform, including its name, logo, user interface, code, copy, and visual design, is owned by CryptoWallet
          and protected by intellectual-property laws. You receive a limited, non-exclusive, non-transferable, revocable
          licence to use it for personal, non-commercial purposes only.
        </p>
      </Section>

      <Section id="warranty" title="11. Disclaimer of Warranties">
        <p>
          The Platform is provided "as is" and "as available". To the maximum extent permitted by law, we disclaim all
          warranties, whether express or implied, including merchantability, fitness for a particular purpose, and
          non-infringement. We do not guarantee that the Platform will be uninterrupted, error-free, or secure against
          every conceivable threat.
        </p>
      </Section>

      <Section id="liability" title="12. Limitation of Liability">
        <p>
          To the fullest extent permitted by law, our total aggregate liability arising from or related to your use of the
          Platform, regardless of legal theory, will not exceed the greater of (a) the fees you paid to us in the 6 months
          preceding the event giving rise to the claim or (b) USD 100. We are not liable for indirect, incidental, special,
          consequential, or punitive damages.
        </p>
      </Section>

      <Section id="indem" title="13. Indemnification">
        <p>
          You agree to defend, indemnify, and hold CryptoWallet and its officers, employees, and partners harmless from any
          claim, liability, damage, or expense (including reasonable legal fees) arising out of your breach of these Terms,
          your violation of law, or your infringement of any third-party right.
        </p>
      </Section>

      <Section id="law" title="14. Governing Law &amp; Dispute Resolution">
        <p>
          These Terms are governed by the laws of the jurisdiction in which CryptoWallet is established, excluding its
          conflict-of-laws rules. Before initiating any formal dispute, you agree to contact us via the Contact Us page so
          we can attempt to resolve the issue informally within 30 days.
        </p>
      </Section>

      <Section id="changes" title="15. Changes to the Terms">
        <p>
          We may update these Terms from time to time. Where changes are material, we will notify you at least 14 days in
          advance. Continued use of the Platform after the effective date constitutes acceptance of the updated Terms.
        </p>
      </Section>

      <Section id="contact" title="16. Contact">
        <p>
          Questions about these Terms? Reach out via the{" "}
          <a className="text-primary underline-offset-4 hover:underline" href="/contact">Contact Us</a> page.
        </p>
      </Section>
    </LegalLayout>
  );
}
