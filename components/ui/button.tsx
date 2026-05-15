import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/utils/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: "primary" | "secondary" | "outline" | "ghost"; size?: "sm" | "md" };
export function Button({ className, variant = "primary", size = "md", asChild, ...props }: Props) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn("inline-flex items-center justify-center rounded-md font-semibold transition disabled:opacity-50", size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2", variant === "primary" && "bg-blue-700 text-white hover:bg-blue-800", variant === "secondary" && "bg-slate-900 text-white hover:bg-slate-800", variant === "outline" && "border border-slate-300 bg-white hover:bg-slate-50", variant === "ghost" && "hover:bg-slate-100", className)} {...props} />;
}
