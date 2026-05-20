import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ID_TYPES = ["Passport", "National ID", "Driver's License", "Residence Permit"];
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

export function KycModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [idType, setIdType] = useState<string>(ID_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!file) throw new Error("Please upload an ID image");
      if (!ACCEPT.includes(file.type)) throw new Error("Image must be JPG, PNG, or WebP");
      if (file.size > MAX_BYTES) throw new Error("Image must be 5MB or smaller");
      if (fullName.trim().length < 2) throw new Error("Please enter your full name");

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("kyc_documents").upload(path, file, { upsert: false, contentType: file.type });
      if (up.error) throw up.error;

      const { error } = await supabase.from("kyc_submissions").insert({
        user_id: user.id,
        full_name: fullName.trim(),
        id_type: idType,
        document_path: path,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Submitted for review");
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["kyc_submission"] });
      onOpenChange(false);
      setFullName(""); setFile(null); setIdType(ID_TYPES[0]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify your identity</DialogTitle>
          <DialogDescription>Submit your ID to unlock P2P trading. Review usually takes a few minutes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full name (as on ID)</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">ID type</label>
            <Select value={idType} onValueChange={setIdType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ID_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">ID image</label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground hover:bg-secondary">
              <Upload className="h-5 w-5" />
              {file ? <span className="text-foreground">{file.name}</span> : <span>Click to upload (JPG/PNG/WebP, max 5MB)</span>}
              <input type="file" accept={ACCEPT.join(",")} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submit.isPending}>Cancel</Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
