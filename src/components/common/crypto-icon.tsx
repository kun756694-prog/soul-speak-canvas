interface Props { symbol: string; color?: string; size?: "sm" | "md" | "lg" }
const sizes = { sm: "h-6 w-6 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" };
export function CryptoIcon({ symbol, color = "#F0B90B", size = "md" }: Props) {
  return (
    <div className={`flex items-center justify-center rounded-full font-bold text-white ${sizes[size]}`} style={{ backgroundColor: color }}>
      {symbol.slice(0, 1)}
    </div>
  );
}
