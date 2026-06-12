import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, Section, Callout } from "@/components/legal/legal-layout";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy · CryptoWallet" },
      {
        name: "description",
        content:
          "What cookies and local storage CryptoWallet uses, why we use them, and how you can control them — explained without dark patterns.",
      },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="We use the smallest practical amount of storage on your device — just enough to keep you signed in and the Platform secure. No tracking pixels, no third-party advertising cookies, no dark patterns."
      updated="June 12, 2026"
    >
      <Section id="what" title="1. What Cookies (and Local Storage) Are">
        <p>
          Cookies are small text files saved by your browser; local storage is a similar mechanism that lives entirely on
          your device. Both let websites remember small pieces of information between page loads, such as whether you are
          signed in or what language you prefer.
        </p>
      </Section>

      <Section id="kinds" title="2. The Kinds We Use">
        <h4 className="mt-2 text-base font-semibold">2.1 Strictly necessary</h4>
        <p>
          These are non-negotiable — without them the Platform simply cannot function. Examples include your authentication
          session token, CSRF protection token, and a small flag that remembers your accepted cookie preferences.
        </p>
        <h4 className="mt-3 text-base font-semibold">2.2 Functional</h4>
        <p>
          These remember settings you have explicitly chosen, such as theme (light or dark), language, and last-visited
          tab. They make the app feel like yours, but the Platform works without them.
        </p>
        <h4 className="mt-3 text-base font-semibold">2.3 Security &amp; fraud-prevention</h4>
        <p>
          Short-lived identifiers used to detect bot traffic, repeated failed sign-ins, and session hijacking attempts. We
          consider these necessary to operate a financial product responsibly.
        </p>
      </Section>

      <Section id="not" title="3. What We Do Not Use">
        <Callout kind="success">
          No advertising cookies. No social-media tracking pixels. No cross-site behavioural profiling. No selling of any
          telemetry to data brokers — ever.
        </Callout>
      </Section>

      <Section id="control" title="4. How to Control Cookies">
        <p>
          You can clear or block cookies and local storage at any time through your browser settings. Be aware that
          blocking strictly necessary cookies will sign you out and prevent you from using the Platform until they are
          re-enabled.
        </p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data.</li>
          <li><strong>Firefox:</strong> Settings → Privacy &amp; Security → Cookies and Site Data.</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data.</li>
          <li><strong>Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies.</li>
        </ul>
      </Section>

      <Section id="changes" title="5. Changes">
        <p>
          If we add a new category of cookie, we will update this page and request fresh consent where the law requires it.
        </p>
      </Section>
    </LegalLayout>
  );
}
