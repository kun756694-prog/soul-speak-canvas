import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

const columns: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { to: "/", label: "Home" },
      { to: "/p2p", label: "P2P Trading" },
      { to: "/wallet", label: "Wallet" },
      { to: "/orders", label: "My Orders" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy Policy" },
      { to: "/terms", label: "Terms of Service" },
      { to: "/cookies", label: "Cookie Policy" },
    ],
  },
  {
    title: "Compliance",
    links: [
      { to: "/aml-kyc", label: "AML / KYC" },
      { to: "/risk", label: "Risk Disclosure" },
      { to: "/contact", label: "Contact Us" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-border bg-card/30 pb-16 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            CryptoWallet
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Secure P2P trading and a points wallet, built with verified identity and clear, plain-language policies.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.title}</h4>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-foreground/80 transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {year} CryptoWallet. All rights reserved.
      </div>
    </footer>
  );
}
