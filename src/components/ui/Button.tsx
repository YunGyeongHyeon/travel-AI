import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

const variants = {
  primary:
    "bg-slate-900 text-white shadow-md hover:bg-black border border-transparent",
  secondary:
    "bg-white text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50",
  indigo:
    "bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 border border-transparent",
  ghost: "text-slate-600 hover:bg-slate-100 border border-transparent",
};

const sizes = {
  sm: "px-4 py-2 text-xs rounded-xl",
  md: "px-4 sm:px-5 py-2.5 text-xs sm:text-sm rounded-full",
  lg: "px-6 py-4 text-base rounded-full",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
