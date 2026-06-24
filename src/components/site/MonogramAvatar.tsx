import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MonogramProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "accent" | "primary" | "muted";
  className?: string;
}

const sizeMap = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-base",
  lg: "h-20 w-20 text-xl",
  xl: "h-32 w-32 text-3xl",
};

const toneMap = {
  accent: "bg-accent text-accent-foreground",
  primary: "bg-primary text-primary-foreground",
  muted: "bg-surface-soft text-primary",
};

export function MonogramAvatar({ name, size = "md", tone = "accent", className }: MonogramProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-display font-semibold tracking-tight ring-1 ring-border/60",
        sizeMap[size],
        toneMap[tone],
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
