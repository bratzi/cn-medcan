export type GraphSchritt = { pfad: string; parameter: Record<string, string> };

/** Instagram Content Publishing (Karussell): je Bild ein Kind-Container, dann der Karussell-Container mit
 * `collaborators` (bis 3 Handles), dann media_publish. `children` und `creation_id` setzt der Aufrufer ein. */
export function graphKarussellSchritte(bildUrls: string[], caption: string, collaborators: string[]): GraphSchritt[] {
  return [
    ...bildUrls.map((url) => ({ pfad: "media", parameter: { image_url: url, is_carousel_item: "true" } })),
    { pfad: "media", parameter: { media_type: "CAROUSEL", caption, collaborators: JSON.stringify(collaborators.slice(0, 3)) } },
    { pfad: "media_publish", parameter: {} },
  ];
}
