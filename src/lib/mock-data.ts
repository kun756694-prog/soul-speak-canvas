// Static reference data (assets, merchants) + types + helpers.
// Wallet balance and transactions are now persisted in Supabase — see src/lib/wallet-api.ts.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Asset {
  symbol: string; name: string; balance: number; usdValue: number; change24h: number; color: string;
}
export interface Merchant {
  id: string; name: string; isVerified: boolean; completionRate: number; totalTrades: number;
  price: number; available: number; minLimit: number; maxLimit: number;
  paymentMethods: string[]; crypto: string; fiat: string; type: "buy" | "sell"; avgReleaseTime: string;
}
export type TxType = "deposit" | "withdraw" | "p2p_buy" | "p2p_sell" | "transfer_in" | "transfer_out";
export type TxStatus = "completed" | "pending" | "failed" | "cancelled";
export interface Transaction {
  id: string; type: TxType; amount: number; currency: string; status: TxStatus;
  created_at: string; fee?: number | null; notes?: string | null; receipt_path?: string | null;
}


export const walletAssets: Asset[] = [
  { symbol: "BTC", name: "Bitcoin", balance: 0.0524, usdValue: 3562.18, change24h: 2.34, color: "#F7931A" },
  { symbol: "ETH", name: "Ethereum", balance: 1.8432, usdValue: 4521.84, change24h: -1.23, color: "#627EEA" },
  { symbol: "USDT", name: "Tether", balance: 2450, usdValue: 2450, change24h: 0.01, color: "#26A17B" },
  { symbol: "BNB", name: "BNB", balance: 12.5, usdValue: 3875, change24h: 3.45, color: "#F0B90B" },
  { symbol: "SOL", name: "Solana", balance: 45.23, usdValue: 6332.2, change24h: 5.67, color: "#00FFA3" },
  { symbol: "XRP", name: "Ripple", balance: 1250, usdValue: 625, change24h: -0.89, color: "#23292F" },
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

// --- Supabase-backed wallet data ---
export function useWallet() {
  const { user } = useAuth();
  const uid = user?.id;

  const balanceQ = useQuery({
    queryKey: ["wallet", uid],
    enabled: !!uid,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.from("wallets").select("balance").eq("user_id", uid!).maybeSingle();
      if (error) throw error;
      return Number(data?.balance ?? 0);
    },
  });

  const txQ = useQuery({
    queryKey: ["transactions", uid],
    enabled: !!uid,
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from("transactions").select("*")
        .eq("user_id", uid!).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });

  return {
    balance: balanceQ.data ?? 0,
    transactions: txQ.data ?? [],
    loading: balanceQ.isLoading || txQ.isLoading,
  };
}

export function useWalletMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
  };

  const deposit = useMutation({
    mutationFn: async (vars: { amount: number; receiptPath?: string | null }) => {
      const { error } = await supabase.rpc("deposit_points", {
        _amount: vars.amount,
        _receipt_path: vars.receiptPath ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });


  const withdraw = useMutation({
    mutationFn: async (vars: { amount: number; address: string }) => {
      const { error } = await supabase.rpc("withdraw_points", { _amount: vars.amount, _address: vars.address });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const transfer = useMutation({
    mutationFn: async (vars: { username: string; amount: number; notes?: string }) => {
      const { error } = await supabase.rpc("transfer_points", {
        _username: vars.username, _amount: vars.amount, _notes: vars.notes ?? "",
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { deposit, withdraw, transfer };
}

export function useProfile() {
  const { user } = useAuth();
  const uid = user?.id;
  return useQuery({
    queryKey: ["profile", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
