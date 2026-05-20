export interface CurrencyOption {
  code: string;
  name: string;
  symbol?: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "MMK", name: "Myanmar Kyat", symbol: "K" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "KRW", name: "Korean Won", symbol: "₩" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "TWD", name: "Taiwan Dollar", symbol: "NT$" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
];

export const PAYMENT_METHODS = [
  "Bank Transfer", "KBZPay", "Wave", "AYA Pay", "CB Pay",
  "TouchNGo", "PayNow", "PromptPay", "GCash", "Alipay",
  "WeChat Pay", "UPI", "PayPal", "Wise",
];

export function isSupportedCurrency(code: string): boolean {
  return CURRENCIES.some((c) => c.code === code);
}
