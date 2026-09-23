import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Field } from "./Field";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  hinweis?: string;
  fehler?: string;
  /**
   * Setzt den Zusatz "(Pflichtangabe)" ans Label. Bewusst NICHT an `required`
   * gekoppelt: in diesen Formularen ist fast jedes Feld Pflicht, der Marker
   * an jedem Label waere Rauschen. Freiwillige Felder sagen es im `hinweis`.
   */
  pflicht?: boolean;
  /** Klassen fuer den umgebenden Field-Block. */
  feldClassName?: string;
};

/**
 * h-11 = 44px Touch-Target, deshalb kein 8px-Vielfaches.
 * Dieselben Klassen wie Select, damit Feldreihen auf einer Kante sitzen.
 */
export const INPUT_KLASSEN =
  "h-11 w-full rounded-md border border-border-strong bg-surface " +
  "px-4 text-body text-text transition-opacity duration-150 ease-standard " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring " +
  "disabled:opacity-50 aria-invalid:border-danger";

export function Input({
  id,
  label,
  hinweis,
  fehler,
  className,
  feldClassName,
  pflicht,
  ...rest
}: InputProps) {
  return (
    <Field
      id={id}
      label={label}
      hinweis={hinweis}
      fehler={fehler}
      pflicht={pflicht}
      className={feldClassName}
    >
      {(attribute) => (
        <input {...attribute} {...rest} className={cn(INPUT_KLASSEN, className)} />
      )}
    </Field>
  );
}
