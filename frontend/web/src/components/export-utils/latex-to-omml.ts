// LaTeX → OMML conversion requires `temml` and `mathml2omml`
// which are OpenMAIC workspace packages not published to npm.
// Falls back gracefully — LaTeX elements export as SVG images instead.

/** Always returns null: OMML export unavailable without workspace packages */
export function latexToOmml(_latex: string, _fontSize: number): null {
  return null;
}
