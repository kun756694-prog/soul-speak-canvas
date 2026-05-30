import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ID_TYPES = ["Passport", "National ID", "Driver's License", "Residence Permit"];
const ADDRESS_DOC_TYPES = ["Utility Bill", "Bank Statement", "Government Letter", "Lease Agreement"];
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  level?: 1 | 2 | 3;
}

const LEVEL_META: Record<1 | 2 | 3, { title: string; desc: string }> = {
  1: { title: "Level 1 — Basic Verification", desc: "Provide your full name and a photo of your government-issued ID." },
  2: { title: "Level 2 — Advanced Verification", desc: "Upload a clear live selfie holding your ID and a photo of your Government ID." },
  3: { title: "Level 3 — Address Verification", desc: "Upload a recent utility bill or bank statement (within the last 3 months)." },
};

export function KycModal({ open, onOpenChange, level = 1 }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [idType, setIdType] = useState<string>(level === 3 ? ADDRESS_DOC_TYPES[0] : ID_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const reset = () => {
    setFullName(""); setFile(null); setSelfie(null);
    setIdType(level === 3 ? ADDRESS_DOC_TYPES[0] : ID_TYPES[0]);
  };

  const validateImage = (f: File, label: string) => {
    if (!ACCEPT.includes(f.type)) throw new Error(`${label} must be JPG, PNG, or WebP`);
    if (f.size > MAX_BYTES) throw new Error(`${label} must be 5MB or smaller`);
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!file) throw new Error(level === 3 ? "Please upload your address proof" : "Please upload your ID image");
      validateImage(file, "Document");
      if (level === 1 && fullName.trim().length < 2) throw new Error("Please enter your full name");
      if (level === 2 && !selfie) throw new Error("Please upload a live selfie");
      if (selfie) validateImage(selfie, "Selfie");

      const ts = Date.now();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/L${level}-doc-${ts}.${ext}`;
      const up1 = await supabase.storage.from("kyc_documents").upload(path, file, { contentType: file.type });
      if (up1.error) throw up1.error;

      let selfiePath: string | null = null;
      if (selfie) {
        const sExt = selfie.name.split(".").pop() || "jpg";
        selfiePath = `${user.id}/L${level}-selfie-${ts}.${sExt}`;
        const up2 = await supabase.storage.from("kyc_documents").upload(selfiePath, selfie, { contentType: selfie.type });
        if (up2.error) throw up2.error;
      }

      const { error } = await supabase.from("kyc_submissions").insert({
        user_id: user.id,
        full_name: fullName.trim() || (user.email ?? "Applicant"),
        id_type: idType,
        document_path: path,
        selfie_path: selfiePath,
        level,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Submitted for review");
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["kyc_status"] });
      qc.invalidateQueries({ queryKey: ["kyc_level"] });
      onOpenChange(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const meta = LEVEL_META[level];
  const docOptions = level === 3 ? ADDRESS_DOC_TYPES : ID_TYPES;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />{meta.title}</DialogTitle>
          <DialogDescription>{meta.desc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {level === 1 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full name (as on ID)</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" maxLength={100} />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{level === 3 ? "Document type" : "ID type"}</label>
            <Select value={idType} onValueChange={setIdType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {docOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {level === 1 && "ID image"}
              {level === 2 && "Government ID image"}
              {level === 3 && "Proof of address (e.g. utility bill)"}
            </label>
            <FilePicker file={file} onPick={setFile} />
          </div>
          {level === 2 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Live selfie holding your ID</label>
              <FilePicker file={selfie} onPick={setSelfie} hint="Face clearly visible, ID readable." />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submit.isPending}>Cancel</Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : "Submit for Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FilePicker({ file, onPick, hint }: { file: File | null; onPick: (f: File | null) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground hover:bg-secondary">
      <Upload className="h-5 w-5" />
      {file ? <span className="text-foreground break-all">{file.name}</span> : <span>Click to upload (JPG/PNG/WebP, max 5MB)</span>}
      {hint && <span className="text-xs">{hint}</span>}
      <input type="file" accept={ACCEPT.join(",")} className="hidden" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
    </label>
  );
}
