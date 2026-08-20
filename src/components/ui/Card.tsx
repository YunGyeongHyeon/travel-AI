import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-[32px] border border-slate-200 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
