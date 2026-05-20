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
