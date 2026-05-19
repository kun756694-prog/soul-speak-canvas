import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/mock-data";

export function BalanceCard({ balance }: { balance: number }) {
  const [show, setShow] = useState(true);
  return (
    <Card className="overflow-hidden border-border bg-gradient-to-br from-card to-card/80">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Point Balance</p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {show ? formatNumber(balance) : "••••••"}
              </h1>
              <span className="text-lg font-semibold text-primary">POINT</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setShow(!show)}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Available for trading</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="text-2xl font-bold text-primary">P</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
