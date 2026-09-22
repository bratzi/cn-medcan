import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Attribute, die das Feld selbst tragen muss, damit Label und Fehler haengen. */
export type FeldAttribute = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

export type FieldProps = {
  /** Muss eindeutig sein — verbindet `<label for>` mit dem Feld. */
  id: string;
  label: string;
  /** Feld. Als Funktion aufgerufen bekommt es id und ARIA-Attribute geliefert. */
  children: ReactNode | ((attribute: FeldAttribute) => ReactNode);
  hinweis?: string;
  fehler?: string;
  pflicht?: boolean;
  className?: string;
};

export function Field({
  id,
  label,
  children,
  hinweis,
  fehler,
  pflicht,
  className,
}: FieldProps) {
  const hinweisId = hinweis ? `${id}-hinweis` : undefined;
  const fehlerId = fehler ? `${id}-fehler` : undefined;
  const describedBy = [fehlerId, hinweisId].filter(Boolean).join(" ") || undefined;

  const attribute: FeldAttribute = {
    id,
    ...(fehler ? { "aria-invalid": true as const } : {}),
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-small font-medium text-text">
        {label}
        {pflicht ? (
          <span className="text-text-muted"> (Pflichtangabe)</span>
        ) : null}
      </label>

      {typeof children === "function" ? children(attribute) : children}

      {hinweis ? (
        <p id={hinweisId} className="text-small text-text-muted">
          {hinweis}
        </p>
      ) : null}

      {fehler ? (
        // Fehler nicht nur farblich: Klartext mit vorangestelltem Wortmarker.
        <p id={fehlerId} role="alert" className="text-small text-danger">
          <span className="font-medium">Fehler: </span>
          {fehler}
        </p>
      ) : null}
    </div>
  );
}
