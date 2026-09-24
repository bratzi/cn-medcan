import type { ReactNode, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TableProps = {
  /** Pflicht: beschreibt den Tabelleninhalt. */
  caption: string;
  /** Caption nur fuer Screenreader, wenn die Ueberschrift schon daneben steht. */
  captionVersteckt?: boolean;
  children: ReactNode;
  className?: string;
  /** Klassen fuer den scrollenden Rahmen. */
  wrapperClassName?: string;
};

/**
 * Buchtabelle (Spec TP2 3.6): kein Rahmen, kein Zebra, eine kraeftige Linie
 * unter dem Kopf, Haarlinien zwischen den Zeilen. Der Rahmen scrollt
 * seitlich (`min-w-full` innen), damit schmale Viewports nicht die ganze
 * Seite mitscrollen; `tabIndex` macht ihn per Tastatur erreichbar, den Fokus
 * zeichnet die globale Regel.
 */
export function Table({
  caption,
  captionVersteckt,
  children,
  className,
  wrapperClassName,
}: TableProps) {
  return (
    <div tabIndex={0} className={cn("w-full max-w-full overflow-x-auto", wrapperClassName)}>
      <table className={cn("w-full min-w-full border-collapse text-body", className)}>
        <caption
          className={cn(captionVersteckt ? "sr-only" : "pb-4 text-left text-small text-text-muted")}
        >
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={className}>{children}</tbody>;
}

/** Haarlinie zwischen den Zeilen; die kraeftige Linie traegt der Kopf. */
export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("border-t border-border", className)}>{children}</tr>;
}

export type TableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & {
  children: ReactNode;
  /** Rechtsbuendig fuer Zahlenspalten. */
  numerisch?: boolean;
};

export function TableHeaderCell({
  children,
  numerisch,
  scope = "col",
  className,
  ...rest
}: TableHeaderCellProps) {
  return (
    <th
      scope={scope}
      className={cn(
        "border-b-2 border-border-strong px-4 pt-2 pb-4 align-bottom text-small font-semibold text-text",
        numerisch ? "text-right" : "text-left",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  numerisch,
  className,
}: {
  children: ReactNode;
  numerisch?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-4 align-top text-body text-text",
        numerisch ? "numeric text-right" : undefined,
        className,
      )}
    >
      {children}
    </td>
  );
}
