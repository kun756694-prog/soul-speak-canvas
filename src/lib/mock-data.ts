// Mock data store with simple subscriber pattern
export interface Asset {
  symbol: string; name: string; balance: number; usdValue: number; change24h: number; color: string;
}
export interface Merchant {
  id: string; name: string; isVerified: boolean; completionRate: number; totalTrades: number;
  price: number; available: number; minLimit: number; maxLimit: number;
  paymentMethods: string[]; crypto: string; fiat: string; type: "buy" | "sell"; avgReleaseTime: string;
}
export interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "p2p_buy" | "p2p_sell" | "transfer_in" | "transfer_out";
  amount: number; currency: string; status: "completed" | "pending" | "failed" | "cancelled";
  created_at: string; fee?: number; notes?: string;
}
export interface User {
  id: string; name: string; email: string; kycLevel: number; isVerified: boolean;
  totalTrades: number; completionRate: number; joinedAt: Date;
}

export const currentUser: User = {
  id: "user-001", name: "Aung Kyaw", email: "aung.kyaw@email.com",
  kycLevel: 2, isVerified: true, totalTrades: 45, completionRate: 98.5,
  joinedAt: new Date("2023-06-15"),
};

export const walletAssets: Asset[] = [
  { symbol: "BTC", name: "Bitcoin", balance: 0.0524, usdValue: 3562.18, change24h: 2.34, color: "#F7931A" },
  { symbol: "ETH", name: "Ethereum", balance: 1.8432, usdValue: 4521.84, change24h: -1.23, color: "#627EEA" },
  { symbol: "USDT", name: "Tether", balance: 2450, usdValue: 2450, change24h: 0.01, color: "#26A17B" },
  { symbol: "BNB", name: "BNB", balance: 12.5, usdValue: 3875, change24h: 3.45, color: "#F0B90B" },
  { symbol: "SOL", name: "Solana", balance: 45.23, usdValue: 6332.2, change24h: 5.67, color: "#00FFA3" },
  { symbol: "XRP", name: "Ripple", balance: 1250, usdValue: 625, change24h: -0.89, color: "#23292F" },
];

const initialTxs: Transaction[] = [
  { id: "tx-001", type: "p2p_buy", amount: 500, currency: "POINT", status: "completed", created_at: new Date(Date.now() - 2 * 3600e3).toISOString() },
  { id: "tx-002", type: "deposit", amount: 1000, currency: "POINT", status: "completed", created_at: new Date(Date.now() - 5 * 3600e3).toISOString() },
  { id: "tx-003", type: "withdraw", amount: 200, currency: "POINT", status: "completed", created_at: new Date(Date.now() - 86400e3).toISOString(), fee: 1 },
  { id: "tx-004", type: "p2p_sell", amount: 300, currency: "POINT", status: "completed", created_at: new Date(Date.now() - 2 * 86400e3).toISOString() },
  { id: "tx-005", type: "transfer_out", amount: 50, currency: "POINT", status: "pending", created_at: new Date(Date.now() - 1800e3).toISOString() },
  { id: "tx-006", type: "deposit", amount: 5000, currency: "POINT", status: "completed", created_at: new Date(Date.now() - 3 * 86400e3).toISOString() },
];

export const buyMerchants: Merchant[] = [
  { id: "1", name: "CryptoKing_MM", isVerified: true, completionRate: 99.2, totalTrades: 1532, price: 4850, available: 50000, minLimit: 50000, maxLimit: 5_000_000, paymentMethods: ["KBZPay", "Wave", "Bank Transfer"], crypto: "POINT", fiat: "MMK", type: "buy", avgReleaseTime: "5 min" },
  { id: "2", name: "GoldenTrader", isVerified: true, completionRate: 98.5, totalTrades: 892, price: 4845, available: 100000, minLimit: 100000, maxLimit: 10_000_000, paymentMethods: ["Bank Transfer", "KBZPay"], crypto: "POINT", fiat: "MMK", type: "buy", avgReleaseTime: "3 min" },
  { id: "3", name: "FastCrypto", isVerified: false, completionRate: 97.8, totalTrades: 456, price: 4855, available: 25000, minLimit: 25000, maxLimit: 2_500_000, paymentMethods: ["Wave", "KBZPay"], crypto: "POINT", fiat: "MMK", type: "buy", avgReleaseTime: "8 min" },
  { id: "4", name: "TrustExchange", isVerified: true, completionRate: 99.8, totalTrades: 2341, price: 4852, available: 200000, minLimit: 50000, maxLimit: 20_000_000, paymentMethods: ["Bank Transfer", "KBZPay", "Wave"], crypto: "POINT", fiat: "MMK", type: "buy", avgReleaseTime: "2 min" },
];

export const sellMerchants: Merchant[] = [
  { id: "6", name: "CryptoKing_MM", isVerified: true, completionRate: 99.2, totalTrades: 1532, price: 4820, available: 100000, minLimit: 50000, maxLimit: 5_000_000, paymentMethods: ["KBZPay", "Wave", "Bank Transfer"], crypto: "POINT", fiat: "MMK", type: "sell", avgReleaseTime: "5 min" },
  { id: "7", name: "MoneyMaster", isVerified: true, completionRate: 98.9, totalTrades: 678, price: 4825, available: 75000, minLimit: 25000, maxLimit: 7_500_000, paymentMethods: ["Bank Transfer", "Wave"], crypto: "POINT", fiat: "MMK", type: "sell", avgReleaseTime: "4 min" },
  { id: "8", name: "SafeTrade_MM", isVerified: true, completionRate: 99.5, totalTrades: 1890, price: 4815, available: 150000, minLimit: 100000, maxLimit: 15_000_000, paymentMethods: ["KBZPay", "AYA Pay"], crypto: "POINT", fiat: "MMK", type: "sell", avgReleaseTime: "3 min" },
];

// In-memory reactive store
type State = { balance: number; transactions: Transaction[] };
let state: State = { balance: 10000, transactions: initialTxs };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const walletStore = {
  getState: () => state,
  subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  deposit(amount: number) {
    state = {
      balance: state.balance + amount,
      transactions: [{ id: `tx-${Date.now()}`, type: "deposit", amount, currency: "POINT", status: "completed", created_at: new Date().toISOString() }, ...state.transactions],
    };
    emit();
  },
  withdraw(amount: number, address: string) {
    if (amount > state.balance) return { error: "Insufficient balance" };
    state = {
      balance: state.balance - amount,
      transactions: [{ id: `tx-${Date.now()}`, type: "withdraw", amount, currency: "POINT", status: "completed", created_at: new Date().toISOString(), notes: `To ${address}` }, ...state.transactions],
    };
    emit();
    return { success: true };
  },
  transfer(username: string, amount: number, notes?: string) {
    if (amount > state.balance) return { error: "Insufficient balance" };
    state = {
      balance: state.balance - amount,
      transactions: [{ id: `tx-${Date.now()}`, type: "transfer_out", amount, currency: "POINT", status: "completed", created_at: new Date().toISOString(), notes: notes || `To ${username}` }, ...state.transactions],
    };
    emit();
    return { success: true, recipient: username };
  },
};

import { useSyncExternalStore } from "react";
export function useWallet() {
  return useSyncExternalStore(
    walletStore.subscribe,
    walletStore.getState,
    walletStore.getState,
  );
}

export function formatNumber(num: number, decimals = 2) {
  return num.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
export function getTimeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
