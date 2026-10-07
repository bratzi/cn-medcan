import "./server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";

import { sichtbarkeitsDaten } from "@/lib/profil-sichtbarkeit";

const neu = () => "neu23456";

test("Einschalten ohne Kurz-Id vergibt eine", () => {
  assert.deepEqual(sichtbarkeitsDaten(true, null, neu), { profilOeffentlich: true, kurzId: "neu23456" });
});

test("Wieder einschalten behält die alte Adresse", () => {
  assert.deepEqual(sichtbarkeitsDaten(true, "alt23456", neu), { profilOeffentlich: true });
});

test("Ausschalten behält die Kurz-Id, schreibt sie aber nicht", () => {
  assert.deepEqual(sichtbarkeitsDaten(false, "alt23456", neu), { profilOeffentlich: false });
  assert.deepEqual(sichtbarkeitsDaten(false, null, neu), { profilOeffentlich: false });
});

test("ProfilSichtbarkeit: aus zeigt Einschalten, an zeigt Adresse und Link", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { ProfilSichtbarkeit } = await import("@/components/mitglied/ProfilSichtbarkeit");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const { de } = await import("@/lib/i18n/de");
  // useRouter verlangt einen eingehängten App Router; im Test genügt ein leerer.
  const router = {} as never;
  const rendere = (an: boolean) =>
    renderToStaticMarkup(
      createElement(
        AppRouterContext.Provider,
        { value: router },
        createElement(ProfilSichtbarkeit, { an, kurzId: "alt23456", texte: de.mitglied.sichtbarkeit }),
      ),
    );
  const aus = rendere(false);
  assert.match(aus, /Dein Profil ist privat\./);
  assert.match(aus, /Profil öffentlich machen/);
  assert.doesNotMatch(aus, /\/profil\/alt23456/);
  const an = rendere(true);
  assert.match(an, /Dein Profil ist öffentlich\./);
  assert.match(an, /href="\/profil\/alt23456"/);
  assert.match(an, /Wieder privat machen/);
});
