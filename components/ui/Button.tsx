import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariante = "primary" | "secondary" | "ghost";
export type ButtonGroesse = "md" | "sm";

const BASIS =
  "inline-flex items-center justify-center gap-2 rounded-md border border-transparent " +
  "font-medium whitespace-nowrap transition-opacity duration-150 ease-standard " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANTEN: Record<ButtonVariante, string> = {
  // Hover/Active nur ueber opacity: bleibt in Light und Dark korrekt,
  // ohne Rohfarben aus der Ramp zu greifen.
  primary: "bg-accent text-accent-fg hover:opacity-90 active:opacity-100",
  secondary:
    "border-border-strong bg-surface-raised text-text hover:opacity-80 active:opacity-100",
  ghost: "bg-transparent text-text hover:opacity-70 active:opacity-100",
};

/** h-11 = 44px: Mindest-Touch-Target, deshalb kein 8px-Vielfaches. */
const GROESSEN: Record<ButtonGroesse, string> = {
  md: "h-11 px-6 text-body",
  sm: "h-9 px-4 text-small",
};

/** Damit ein `<Link>` denselben Look bekommt, ohne `asChild`-Magie. */
export function buttonKlassen(
  variante: ButtonVariante = "primary",
  groesse: ButtonGroesse = "md",
  className?: string,
): string {
  return cn(BASIS, VARIANTEN[variante], GROESSEN[groesse], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: ButtonVariante;
  groesse?: ButtonGroesse;
};

export function Button({
  variante = "primary",
  groesse = "md",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonKlassen(variante, groesse, className)}
      {...rest}
    />
  );
}
