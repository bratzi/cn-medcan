import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariante = "primary" | "secondary" | "ghost";
export type ButtonGroesse = "md" | "sm";

const BASIS =
  "inline-flex items-center justify-center gap-2 rounded-full border " +
  "font-medium whitespace-nowrap transition-colors duration-fast ease-standard " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANTEN: Record<ButtonVariante, string> = {
  // Hover ueber eigene Tokens: bleibt in hell und dunkel korrekt und
  // haelt den Kontrast (accent-fg auf accent-hover 7.88 bzw. 5.40).
  // Rahmenfarbe je Variante: cn() fuegt nur zusammen, ein border-transparent
  // in BASIS wuerde im CSS den Rahmen der Sekundaervariante schlagen.
  primary: "border-transparent bg-accent text-accent-fg hover:bg-accent-hover",
  secondary: "border-border-strong bg-surface-raised text-text hover:bg-surface-sunken",
  ghost: "border-transparent bg-transparent text-text hover:bg-surface-sunken",
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
