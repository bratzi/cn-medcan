import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Basis = {
  children: ReactNode;
  className?: string;
};

/** Ruhende Flaeche auf derselben Ebene: Trennung ueber border, kein Schatten. */
export function Card({ children, className }: Basis) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: Basis) {
  return (
    <div className={cn("border-b border-border px-6 py-4", className)}>{children}</div>
  );
}

export function CardBody({ children, className }: Basis) {
  return <div className={cn("px-6 py-6", className)}>{children}</div>;
}

export function CardFooter({ children, className }: Basis) {
  return (
    <div
      className={cn(
        "border-t border-border bg-surface-raised px-6 py-4 rounded-b-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}
