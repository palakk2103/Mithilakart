/**
 * Renders a JSON-LD structured-data script tag. React escapes text content
 * by default, so JSON.stringify output is safe here — no dangerouslySetInnerHTML.
 */
export default function JsonLd({ data }) {
  if (!data) return null;
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}
