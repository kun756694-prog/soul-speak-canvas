import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type KycStatus = "unverified" | "pending" | "verified" | "rejected";

export function useKycStatus() {
  const { user } = useAuth();
  const uid = user?.id;
  return useQuery({
    queryKey: ["kyc_status", uid],
    enabled: !!uid,
    queryFn: async (): Promise<KycStatus> => {
      const { data, error } = await supabase
        .from("profiles").select("kyc_status").eq("id", uid!).maybeSingle();
      if (error) throw error;
      return (data?.kyc_status ?? "unverified") as KycStatus;
    },
  });
}

export interface LevelInfo {
  level: number;
  status: KycStatus;
  submitted_at: string | null;
  notes: string | null;
}

export interface KycLevelData {
  approvedLevel: number; // highest approved level (0 if none)
  perLevel: Record<1 | 2 | 3, LevelInfo>;
}

export function useKycLevel() {
  const { user } = useAuth();
  const uid = user?.id;
  return useQuery({
    queryKey: ["kyc_level", uid],
    enabled: !!uid,
    queryFn: async (): Promise<KycLevelData> => {
      const [profileRes, subsRes] = await Promise.all([
        supabase.from("profiles").select("kyc_level").eq("id", uid!).maybeSingle(),
        supabase
          .from("kyc_submissions")
          // @ts-expect-error - new columns
          .select("level,status,submitted_at,notes")
          .eq("user_id", uid!)
          .order("submitted_at", { ascending: false }),
      ]);
      if (profileRes.error) throw profileRes.error;
      if (subsRes.error) throw subsRes.error;

      const perLevel: KycLevelData["perLevel"] = {
        1: { level: 1, status: "unverified", submitted_at: null, notes: null },
        2: { level: 2, status: "unverified", submitted_at: null, notes: null },
        3: { level: 3, status: "unverified", submitted_at: null, notes: null },
      };
      for (const row of (subsRes.data ?? []) as any[]) {
        const lvl = (row.level ?? 1) as 1 | 2 | 3;
        if (perLevel[lvl].submitted_at) continue; // already have latest
        perLevel[lvl] = {
          level: lvl,
          status: row.status as KycStatus,
          submitted_at: row.submitted_at,
          notes: row.notes,
        };
      }

      const approvedLevel = Math.max(
        0,
        ...(Object.values(perLevel)
          .filter((l) => l.status === "verified")
          .map((l) => l.level)),
      );
      return { approvedLevel, perLevel };
    },
  });
}

export function useIsAdmin() {
  const { user } = useAuth();
  const uid = user?.id;
  return useQuery({
    queryKey: ["is_admin", uid],
    enabled: !!uid,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("user_roles").select("role").eq("user_id", uid!).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}
