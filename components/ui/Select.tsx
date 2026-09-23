import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Field } from "./Field";

export type SelectOption = {
  wert: string;
  label: string;
  deaktiviert?: boolean;
};

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "id" | "children"
> & {
  id: string;
  label: string;
  optionen: readonly SelectOption[];
  /** Label nur fuer Screenreader, siehe Field. */
  labelVersteckt?: boolean;
  /** Erste, nicht-auswaehlbare Zeile — ersetzt kein Label. */
  platzhalter?: string;
  hinweis?: string;
  fehler?: string;
  className?: string;
  /** Klassen fuer den umgebenden Field-Block. */
  feldClassName?: string;
};

/** h-11 = 44px Touch-Target, deshalb kein 8px-Vielfaches. */
const SELECT_KLASSEN =
  "h-11 w-full appearance-none rounded-md border border-border-strong bg-surface " +
  "px-4 text-body text-text transition-opacity duration-150 ease-standard " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring " +
  "disabled:opacity-50 aria-invalid:border-danger";

export function Select({
  id,
  label,
  optionen,
  platzhalter,
  hinweis,
  fehler,
  labelVersteckt,
  className,
  feldClassName,
  ...rest
}: SelectProps) {
  /**
   * Der Platzhalter muss ausdruecklich vorausgewaehlt werden.
   *
   * HTML waehlt von sich aus die erste *nicht deaktivierte* Option - der
   * deaktivierte Platzhalter wird uebersprungen, und das Feld stand damit
   * auf dem ersten echten Eintrag, obwohl "Bitte auswaehlen" darauf stand.
   * `required` griff nie, `reset()` fiel auf denselben Eintrag zurueck, und
   * ein unachtsames Abschicken trug den ersten Katalogeintrag ein.
   *
   * Nur wenn der Aufrufer die Auswahl nicht selbst fuehrt: `value` und
   * `defaultValue` zusammen wuerde React beanstanden.
   */
  const platzhalterVorwahl =
    platzhalter !== undefined &&
    rest.value === undefined &&
    rest.defaultValue === undefined
      ? { defaultValue: "" }
      : undefined;

  return (
    <Field
      id={id}
      label={label}
      hinweis={hinweis}
      fehler={fehler}
      labelVersteckt={labelVersteckt}
      className={feldClassName}
    >
      {(attribute) => (
        <select
          {...attribute}
          {...platzhalterVorwahl}
          {...rest}
          className={cn(SELECT_KLASSEN, className)}
        >
          {platzhalter ? (
            <option value="" disabled>
              {platzhalter}
            </option>
          ) : null}
          {optionen.map((option) => (
            <option key={option.wert} value={option.wert} disabled={option.deaktiviert}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
