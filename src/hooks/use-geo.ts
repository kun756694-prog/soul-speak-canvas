import { useQuery } from "@tanstack/react-query";

export interface GeoInfo {
  countryCode: string;
  currency: string;
  source: "ipapi" | "ip-api" | "locale" | "fallback";
}

// Minimal country -> currency map for common cases (used as locale fallback).
const LOCALE_CURRENCY: Record<string, string> = {
  MM: "MMK", MY: "MYR", US: "USD", GB: "GBP", TH: "THB", SG: "SGD",
  ID: "IDR", PH: "PHP", VN: "VND", JP: "JPY", KR: "KRW", CN: "CNY",
  IN: "INR", AU: "AUD", CA: "CAD", DE: "EUR", FR: "EUR", IT: "EUR",
  ES: "EUR", NL: "EUR", BR: "BRL", MX: "MXN", RU: "RUB", TR: "TRY",
  AE: "AED", SA: "SAR", PK: "PKR", BD: "BDT", LK: "LKR", NG: "NGN",
  ZA: "ZAR", EG: "EGP", KH: "KHR", LA: "LAK", NZ: "NZD", HK: "HKD",
  TW: "TWD",
};

function fromLocale(): GeoInfo | null {
  if (typeof navigator === "undefined") return null;
  const loc = navigator.language || (navigator.languages && navigator.languages[0]);
  if (!loc) return null;
  const parts = loc.split("-");
  const cc = (parts[1] || "").toUpperCase();
  if (cc && LOCALE_CURRENCY[cc]) {
    return { countryCode: cc, currency: LOCALE_CURRENCY[cc], source: "locale" };
  }
  return null;
}

async function fetchJson(url: string, timeoutMs = 3500): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function detectGeo(): Promise<GeoInfo> {
  // 1. ipapi.co (returns currency directly)
  try {
    const d = await fetchJson("https://ipapi.co/json/");
    if (d?.currency && d?.country_code) {
      return { countryCode: d.country_code, currency: d.currency, source: "ipapi" };
    }
  } catch {}
  // 2. ip-api.com (no currency field; derive from country)
  try {
    const d = await fetchJson("https://ip-api.com/json/?fields=status,countryCode");
    if (d?.status === "success" && d?.countryCode) {
      const cur = LOCALE_CURRENCY[d.countryCode] ?? "USD";
      return { countryCode: d.countryCode, currency: cur, source: "ip-api" };
    }
  } catch {}
  // 3. browser locale
  const loc = fromLocale();
  if (loc) return loc;
  // 4. fallback
  return { countryCode: "US", currency: "USD", source: "fallback" };
}

export function useGeo() {
  return useQuery({
    queryKey: ["geo"],
    queryFn: detectGeo,
    staleTime: 1000 * 60 * 60, // 1h
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}
