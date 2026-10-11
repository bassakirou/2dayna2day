/** Allow only content markup; strip executable elements, attributes and URLs. */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const allowed = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "A", "IMG", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "HR", "DIV", "SPAN", "PRE", "CODE"]);
  for (const node of Array.from(doc.body.querySelectorAll("*"))) {
    if (!allowed.has(node.tagName)) { node.remove(); continue; }
    for (const attribute of Array.from(node.attributes)) {
      const name = attribute.name.toLowerCase();
      if (!["href", "src", "alt", "title", "colspan", "rowspan"].includes(name)) node.removeAttribute(attribute.name);
      if (name === "href" || name === "src") {
        const value = attribute.value.trim();
        const safe = /^https?:\/\//i.test(value) || (/^[/#]/.test(value) && !value.startsWith("//") && !value.includes("\\")) || (name === "href" && /^(mailto:|tel:)/i.test(value));
        if (!safe) node.removeAttribute(attribute.name);
      }
    }
    if (node.tagName === "IMG") node.setAttribute("loading", "lazy");
  }
  return doc.body.innerHTML;
}
