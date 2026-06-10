import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JsonLd } from "../src/jsonld";

describe("JsonLd", () => {
  it("renders an application/ld+json script tag", () => {
    const html = renderToStaticMarkup(<JsonLd data={{ "@type": "Thing" }} />);
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain("Thing");
  });
  it("escapes </script> so content cannot break out of the script tag", () => {
    const html = renderToStaticMarkup(<JsonLd data={{ answer: "x</script><script>alert(1)</script>" }} />);
    expect(html).not.toContain("</script><script>");
    expect(html).toContain("\\u003c/script\\u003e");
  });
});
