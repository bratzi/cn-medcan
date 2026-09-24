/**
 * Handschrift "wird geschrieben" (Spec TP3 11): clip-path von links nach
 * rechts, einmal, 0,6 bis 0,9 s je Zeile. Die negativen Ränder lassen
 * Ober- und Unterlängen und Schwünge der Schreibschrift stehen, die über
 * die Box hinausragen; am Ende nimmt clearProps den Schnitt ganz weg.
 * Dieselben Ränder nutzt der CSS-Einstieg der Wortmarke (@keyframes
 * schreiben in globals.css).
 */
export const SCHREIBEN_AB = { clipPath: "inset(-50% 120% -50% -20%)" };

export const SCHREIBEN_BIS = {
  clipPath: "inset(-50% -20% -50% -20%)",
  duration: 0.8,
  ease: "power2.inOut",
  clearProps: "clipPath",
};
