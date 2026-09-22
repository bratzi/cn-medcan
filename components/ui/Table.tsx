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
 * Zugaengliche Datentabelle. Der Wrapper scrollt horizontal (`min-w-full`
 * innen), damit schmale Viewports nicht die ganze Seite mitscrollen.
 * `tabIndex` am Wrapper, damit der Scrollbereich per Tastatur erreichbar ist.
 */
export function Table({
  caption,
  captionVersteckt,
  children,
  className,
  wrapperClassName,
}: TableProps) {
  return (
    <div
      tabIndex={0}
      className={cn(
        "w-full max-w-full overflow-x-auto rounded-lg border border-border",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        wrapperClassName,
      )}
    >
      <table className={cn("w-full min-w-full border-collapse text-body", className)}>
        <caption
          className={cn(
            captionVersteckt
              ? "sr-only"
              : "px-4 py-4 text-left text-small text-text-muted",
          )}
        >
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <thead className={cn("bg-surface-raised", className)}>{children}</thead>
  );
}

export function TableBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <tbody className={className}>{children}</tbody>;
}

/** Zebra ueber Tokens, nicht ueber Rohfarben. */
export function TableRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("border-t border-border even:bg-surface-raised", className)}>
      {children}
    </tr>
  );
}

export type TableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & {
  children: ReactNode;
  /** Rechtsbuendig und monospaced fuer Zahlenspalten. */
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
        "px-4 py-2 text-small font-medium text-text",
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
        "px-4 py-2 align-top text-body text-text",
        numerisch ? "numeric text-right" : undefined,
        className,
      )}
    >
      {children}
    </td>
  );
}
