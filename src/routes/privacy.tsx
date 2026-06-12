import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, Section, Callout } from "@/components/legal/legal-layout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · CryptoWallet" },
      {
        name: "description",
        content:
          "How CryptoWallet collects, uses, stores, and protects your personal data — including KYC documents, wallet activity, and P2P trading information.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Your trust is the most valuable asset we hold. This policy explains exactly what we collect, why we collect it, how long we keep it, and the rights you have over your data — written in plain language, without legal jargon hiding the details."
      updated="June 12, 2026"
    >
      <Section id="intro" title="1. Introduction">
        <p>
          Welcome to <strong>CryptoWallet</strong> (the "Platform", "we", "us", or "our"). We operate a non-custodial points
          wallet and peer-to-peer (P2P) trading service that lets verified users deposit funds, exchange value, transfer
          points to other verified accounts, and communicate with their counterparties through an encrypted chat channel.
        </p>
        <p>
          Because our service touches money, identity, and conversation, we take privacy extremely seriously. This Privacy
          Policy describes the personal data we process when you create an account, complete KYC verification, deposit or
          withdraw funds, post a P2P advertisement, transfer points, or simply browse the app while signed in. It applies
          worldwide to every visitor and every registered user, regardless of device or jurisdiction.
        </p>
        <Callout>
          By creating an account or using any feature of CryptoWallet, you confirm that you have read this Privacy Policy,
          understand it, and consent to the processing of your data as described below. If you do not agree, please do not
          use the service.
        </Callout>
      </Section>

      <Section id="who" title="2. Who We Are">
        <p>
          CryptoWallet is operated by an independent fintech team. We act as the <strong>data controller</strong> for the
          personal information you submit through the Platform. We rely on a small set of carefully selected{" "}
          <strong>data processors</strong> — including our cloud backend, KYC verification provider, payment-rail providers,
          and email/SMS delivery vendors — who process data only on our written instructions and under contractual
          confidentiality obligations.
        </p>
        <p>
          You can reach our privacy team at any time via the <em>Contact Us</em> page. If you live in the European Union,
          United Kingdom, or another region with formal data-protection authorities, you also have the right to lodge a
          complaint with your local regulator.
        </p>
      </Section>

      <Section id="data" title="3. The Data We Collect">
        <p>We collect personal data in four broad categories. Each category is the minimum necessary to deliver the feature it powers.</p>
        <h4 className="mt-4 text-base font-semibold">3.1 Account &amp; Identity Data</h4>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Full legal name, date of birth, nationality, and residential country.</li>
          <li>Email address and (where used) phone number, used for sign-in, security alerts, and 2FA recovery.</li>
          <li>A user-chosen display name shown to your P2P counterparties.</li>
          <li>A unique internal account ID (UUID) used to route transfers and link records inside our database.</li>
        </ul>
        <h4 className="mt-4 text-base font-semibold">3.2 KYC &amp; Verification Data</h4>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Government-issued ID images (national ID, passport, or driving licence) — front and back where applicable.</li>
          <li>A live selfie or short liveness video used to confirm that the ID belongs to a real, present person.</li>
          <li>Optional proof-of-address documents (utility bill, bank statement) for Level 3 verification.</li>
          <li>Verification status, reviewer notes, approval/rejection timestamp, and the admin who approved or rejected.</li>
        </ul>
        <h4 className="mt-4 text-base font-semibold">3.3 Financial &amp; Transaction Data</h4>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Wallet balance, deposit requests, withdrawal addresses, and historical transactions.</li>
          <li>Receipt screenshots uploaded as proof of off-platform payment for manual deposit verification.</li>
          <li>P2P advertisement details: asset, fiat currency, price, available amount, trade limits, and payment methods.</li>
          <li>P2P order metadata: counterparty IDs, amount, status, and timestamps.</li>
        </ul>
        <h4 className="mt-4 text-base font-semibold">3.4 Communications &amp; Technical Data</h4>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Messages exchanged in P2P trade chats (stored so disputes can be resolved fairly).</li>
          <li>Support emails or in-app contact-form submissions.</li>
          <li>Device type, browser, operating system, language, timezone, and screen size.</li>
          <li>IP address and approximate geolocation, used for fraud prevention and regulatory restriction checks.</li>
          <li>Log data: sign-in timestamps, sign-in method, failed attempts, and security-relevant actions.</li>
        </ul>
      </Section>

      <Section id="why" title="4. Why We Process Your Data (Legal Bases)">
        <p>We rely on the following legal bases, depending on the activity:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong>Performance of a contract</strong> — to create your account, process deposits and withdrawals, execute
            transfers, and run P2P trades you have initiated.
          </li>
          <li>
            <strong>Legal obligation</strong> — to perform KYC, sanctions screening, transaction monitoring, suspicious-
            activity reporting, and record-keeping required by anti-money-laundering laws.
          </li>
          <li>
            <strong>Legitimate interest</strong> — to detect fraud, prevent account takeover, debug crashes, improve product
            quality, and keep the platform secure for every honest user.
          </li>
          <li>
            <strong>Consent</strong> — for optional features such as email marketing, advanced analytics cookies, or
            participation in non-essential research surveys. You can withdraw consent at any time.
          </li>
        </ul>
      </Section>

      <Section id="share" title="5. Who We Share Data With">
        <p>
          We <strong>never sell</strong> personal data. Period. We share it only with the specific categories of recipients
          below, and only the minimum information required for them to perform their role:
        </p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li><strong>Cloud infrastructure provider</strong> hosting our database, authentication, and storage.</li>
          <li><strong>KYC verification partner</strong> that performs document checks and liveness analysis.</li>
          <li><strong>Email and SMS delivery vendors</strong> that send transactional messages on our behalf.</li>
          <li><strong>Fraud-prevention services</strong> that scan transactions for typologies associated with abuse.</li>
          <li><strong>Law enforcement and regulators</strong>, only when we receive a lawful, properly scoped order.</li>
          <li><strong>Your P2P counterparty</strong> sees only your display name, verification badge level, completion rate, and the messages you send in chat — never your email, phone, ID, or wallet address.</li>
        </ul>
      </Section>

      <Section id="kyc" title="6. How We Handle KYC Documents">
        <p>
          KYC documents are the most sensitive data we hold, so we apply extra protection. ID images and selfies are
          uploaded directly to a private, access-controlled storage bucket using short-lived signed URLs. Only the
          authenticated user can upload to their own folder, and only verified administrators with an explicit{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">admin</code> role can request a read-only signed URL during
          a manual review.
        </p>
        <Callout kind="success">
          KYC images are never embedded in marketing materials, never used to train machine-learning models, and never
          shared with third parties beyond the verification partner that processes them on our behalf.
        </Callout>
      </Section>

      <Section id="retain" title="7. How Long We Keep Your Data">
        <p>Retention is tied to the purpose of each data category:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li><strong>Account profile:</strong> for as long as your account is active, plus 12 months after closure.</li>
          <li><strong>KYC records:</strong> 5 years after account closure, the minimum required by most AML regimes.</li>
          <li><strong>Transactions &amp; financial logs:</strong> 7 years, to comply with tax and accounting laws.</li>
          <li><strong>P2P chat messages:</strong> 24 months after the order is closed, to allow dispute reopens and audits.</li>
          <li><strong>Security logs &amp; IP addresses:</strong> 12 months rolling, then permanently anonymised.</li>
        </ul>
        <p>
          After the retention period, records are either permanently deleted or anonymised so they can no longer be linked
          back to an identifiable individual.
        </p>
      </Section>

      <Section id="security" title="8. How We Protect Your Data">
        <p>Defence in depth is our default. The most important safeguards include:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>TLS 1.2+ encryption for every connection between your device and our servers.</li>
          <li>Row-level security on the database so users can only ever read their own rows.</li>
          <li>Strict separation between the publishable client key and the service-role key, which never leaves the server.</li>
          <li>Hashed passwords (handled by our auth provider) and optional leaked-password screening.</li>
          <li>Rate limiting and anomaly detection on sensitive endpoints such as transfer and withdrawal.</li>
          <li>Mandatory KYC Level 2 for P2P trading and point transfers, blocking the most common abuse patterns.</li>
          <li>Quarterly access reviews and least-privilege admin roles, audited via dedicated tables.</li>
        </ul>
        <p>
          No system is perfectly secure, but we promise transparency: if a personal-data breach ever affects you, we will
          notify you and the relevant authorities within the timeframe required by law (72 hours under GDPR).
        </p>
      </Section>

      <Section id="rights" title="9. Your Rights">
        <p>Depending on where you live, you have some or all of the following rights:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
          <li><strong>Rectification</strong> — ask us to correct inaccurate or incomplete information.</li>
          <li><strong>Erasure</strong> — request deletion, subject to AML retention obligations described above.</li>
          <li><strong>Restriction</strong> — ask us to pause processing while a dispute is investigated.</li>
          <li><strong>Portability</strong> — receive your data in a structured, machine-readable format.</li>
          <li><strong>Objection</strong> — object to processing based on legitimate interest, including for marketing.</li>
          <li><strong>Withdraw consent</strong> — at any time, where processing relies on consent.</li>
        </ul>
        <p>To exercise any right, email us via the Contact Us page. We respond within 30 calendar days.</p>
      </Section>

      <Section id="children" title="10. Children">
        <p>
          CryptoWallet is strictly for adults. We do not knowingly collect data from anyone under 18 (or the minimum legal
          age in your country, whichever is higher). If we discover that an underage user has registered, we will close the
          account and delete the associated data immediately.
        </p>
      </Section>

      <Section id="international" title="11. International Data Transfers">
        <p>
          Our infrastructure may store and process data in regions outside of your home country. Where transfers leave the
          EEA or UK, we rely on Standard Contractual Clauses and additional safeguards approved by the European Commission
          to ensure your data continues to receive an essentially equivalent level of protection.
        </p>
      </Section>

      <Section id="changes" title="12. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect new features, regulatory developments, or feedback
          from users. When changes are material, we will notify you by email and through an in-app banner at least 14 days
          before the new version takes effect. The "Last updated" date at the top of this page always reflects the current
          version.
        </p>
      </Section>

      <Section id="contact" title="13. How to Reach Us">
        <p>
          For privacy questions, data-subject requests, or to report a concern, please use the{" "}
          <a className="text-primary underline-offset-4 hover:underline" href="/contact">Contact Us</a> page. We aim to
          respond to every privacy enquiry within 5 business days and to formal data-subject requests within 30 calendar
          days.
        </p>
      </Section>
    </LegalLayout>
  );
}
