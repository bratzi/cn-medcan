/**
 * SVG-Filter der Marke (Spec 4.3), einmal im Layout gerendert.
 *
 * spray-rau:   Kanten aufrauen (Turbulenz + Verschiebung) und einen weichen
 *              Overspray darunterlegen - aus der Schrift, ohne gezeichnete Pfade.
 * stanzkontur: Aufkleber-Kontur in surface-raised um die Form (Wizard Trees).
 */
export function SprayFilter() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
      <defs>
        <filter id="spray-rau" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} result="rauschen" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="rauschen"
            scale={3}
            xChannelSelector="R"
            yChannelSelector="G"
            result="rau"
          />
          <feGaussianBlur in="rau" stdDeviation={2.5} result="nebel" />
          <feComponentTransfer in="nebel" result="nebel-schwach">
            <feFuncA type="linear" slope={0.35} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="nebel-schwach" />
            <feMergeNode in="rau" />
          </feMerge>
        </filter>
        <filter id="stanzkontur" x="-25%" y="-25%" width="150%" height="150%">
          <feMorphology in="SourceAlpha" operator="dilate" radius={6} result="dick" />
          <feFlood style={{ floodColor: "var(--color-surface-raised)" }} result="flaeche" />
          <feComposite in="flaeche" in2="dick" operator="in" result="kontur" />
          <feMerge>
            <feMergeNode in="kontur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
