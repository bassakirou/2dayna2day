import { Block } from "@/lib/data";

type BuilderBlock = Record<string, unknown> & { id?: string; type?: string };

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : (value ?? "").toString();
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && isFinite(value)) return value;
  if (typeof value === "string") {
    const v = parseFloat(value.trim().replace(",", "."));
    return isFinite(v) ? v : fallback;
  }
  return fallback;
}

function parseJsonArray(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getMetaValue(meta: unknown, key: string): unknown {
  if (!meta || typeof meta !== "object") return undefined;
  return (meta as Record<string, unknown>)[key];
}

function mapBuilderBlocksToFrontend(blocks: BuilderBlock[]): Block[] {
  return blocks
    .map((b) => {
      const type = typeof b.type === "string" ? b.type : "";
      if (!type) return null;

      if (type === "banner") {
        const bgImage = toStringValue(b.bgImage || b.image);
        const cta = b.cta && typeof b.cta === "object" ? b.cta : undefined;
        const label =
          cta && typeof (cta as Record<string, unknown>).label === "string"
            ? ((cta as Record<string, unknown>).label as string)
            : "";
        const anchor =
          cta && typeof (cta as Record<string, unknown>).anchor === "string"
            ? ((cta as Record<string, unknown>).anchor as string)
            : "checkout";

        return {
          type: "banner",
          title: toStringValue(b.title),
          subtitle: toStringValue(b.subtitle),
          image: bgImage,
          cta: { label: label, anchor: anchor },
        };
      }

      if (type === "features") {
        const itemsRaw = Array.isArray(b.items) ? (b.items as unknown[]) : [];
        const items = itemsRaw
          .map((it) => {
            if (!it || typeof it !== "object") return null;
            const o = it as Record<string, unknown>;
            const mode = typeof o.mode === "string" ? o.mode : "";
            const icon = typeof o.icon === "string" ? o.icon : undefined;
            const image = typeof o.image === "string" ? o.image : undefined;
            return {
              icon: mode === "icon" ? icon : undefined,
              image: mode === "image" ? image : undefined,
              title: toStringValue(o.title),
              text: toStringValue(o.text),
            };
          })
          .filter(Boolean) as Array<{
          icon?: string;
          image?: string;
          title: string;
          text: string;
        }>;

        return {
          type: "features",
          title: toStringValue(b.title),
          columns: toNumberValue(b.columns, 4),
          items: items,
        };
      }

      if (type === "gallery") {
        const imagesRaw = Array.isArray(b.images) ? (b.images as unknown[]) : [];
        const images = imagesRaw
          .map((img) => {
            if (typeof img === "string") return img;
            if (!img || typeof img !== "object") return "";
            const url = toStringValue((img as Record<string, unknown>).url);
            return url;
          })
          .map((v) => v.trim())
          .filter(Boolean);

        return { type: "gallery", images: images };
      }

      if (type === "testimonials") {
        const itemsRaw = Array.isArray(b.items) ? (b.items as unknown[]) : [];
        const items = itemsRaw
          .map((it) => {
            if (!it || typeof it !== "object") return null;
            const o = it as Record<string, unknown>;
            return {
              id: toStringValue(o.id),
              name: toStringValue(o.name),
              city: toStringValue(o.city || o.role || ""),
              date: toStringValue(o.date),
              rating: toNumberValue(o.rating, 5),
              text: toStringValue(o.text),
            };
          })
          .filter(Boolean) as Array<{
          id: string;
          name: string;
          city: string;
          date: string;
          rating: number;
          text: string;
        }>;

        return { 
          type: "testimonials", 
          title: toStringValue(b.title),
          count: toNumberValue(b.count, 3),
          items: items 
        };
      }

      if (type === "video") {
        const videoUrl = toStringValue(b.videoUrl);
        return {
          type: "video",
          videoUrl: videoUrl,
          title: toStringValue(b.title),
        };
      }

      if (type === "cta") {
        return {
          type: "cta",
          text: toStringValue((b as Record<string, unknown>).text),
          bgColor:
            typeof (b as Record<string, unknown>).bgColor === "string"
              ? ((b as Record<string, unknown>).bgColor as string)
              : undefined,
          textColor:
            typeof (b as Record<string, unknown>).textColor === "string"
              ? ((b as Record<string, unknown>).textColor as string)
              : undefined,
          buttonText: toStringValue((b as Record<string, unknown>).buttonText),
        };
      }

      if (type === "image_left_text_right" || type === "image_right_text_left") {
        return {
          type: type,
          image: toStringValue(b.image),
          title: toStringValue(b.title),
          text: toStringValue(b.text),
        };
      }

      if (type === "pricing") {
        const tablesRaw = Array.isArray(b.tables) ? (b.tables as unknown[]) : [];
        const tiers = tablesRaw
          .map((t) => {
            if (!t || typeof t !== "object") return null;
            const o = t as Record<string, unknown>;
            const servicesRaw = Array.isArray(o.services) ? o.services : [];
            const features = (servicesRaw as unknown[])
              .map((s) => {
                if (!s || typeof s !== "object") return "";
                const so = s as Record<string, unknown>;
                const name = toStringValue(so.name).trim();
                const price = toStringValue(so.price).trim();
                if (!name) return "";
                return price ? `${name} (${price})` : name;
              })
              .filter(Boolean);

            return {
              name: toStringValue(o.title) || "Offre",
              price: toNumberValue(o.price, 0),
              description: toStringValue(o.subtitle),
              features: features,
              cta: toStringValue(o.buttonText) || "Commander",
            };
          })
          .filter(Boolean);

        return { type: "pricing", tiers: tiers };
      }

      if (type === "countdown") {
        return {
          type: "countdown",
          endDate: toStringValue((b as Record<string, unknown>).deadline),
          title: toStringValue((b as Record<string, unknown>).title),
          discountType: toStringValue((b as Record<string, unknown>).discountType),
          discountValue: toNumberValue((b as Record<string, unknown>).discountValue, 0),
          buttonText: toStringValue((b as Record<string, unknown>).buttonText),
        };
      }

      return b as unknown as Block;
    })
    .filter(Boolean) as Block[];
}

export async function fetchBlocksForProductSlug(slug: string): Promise<Block[] | null> {
  const apiUrl = (process.env.NEXT_PUBLIC_WP_API_URL || "").toString().trim();
  if (!apiUrl) return null;

  const endpoint = `${apiUrl.replace(/\/$/, "")}/product?slug=${encodeURIComponent(
    slug,
  )}&per_page=1&_fields=meta`;

  const resp = await fetch(endpoint, { method: "GET" });
  if (!resp.ok) return null;

  const data = (await resp.json()) as Array<{ meta?: unknown }>;
  const meta = data && data[0] ? data[0].meta : undefined;
  const raw = getMetaValue(meta, "_2day_product_builder");
  if (typeof raw !== "string" || !raw.trim()) return null;

  const blocksRaw = parseJsonArray(raw.trim());
  const blocks = blocksRaw
    .map((b) => (b && typeof b === "object" ? (b as BuilderBlock) : null))
    .filter(Boolean) as BuilderBlock[];

  return mapBuilderBlocksToFrontend(blocks);
}

export async function fetchProductBuilderEnabledForProductSlug(
  slug: string,
): Promise<boolean | null> {
  const apiUrl = (process.env.NEXT_PUBLIC_WP_API_URL || "").toString().trim();
  if (!apiUrl) return null;

  const endpoint = `${apiUrl.replace(/\/$/, "")}/product?slug=${encodeURIComponent(
    slug,
  )}&per_page=1&_fields=meta`;

  const resp = await fetch(endpoint, { method: "GET" });
  if (!resp.ok) return null;

  const data = (await resp.json()) as Array<{ meta?: unknown }>;
  const meta = data && data[0] ? data[0].meta : undefined;
  const raw = getMetaValue(meta, "_2day_product_builder_enabled");

  if (raw === undefined || raw === null || raw === "") return true;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  if (typeof raw === "string") {
    const v = raw.trim().toLowerCase();
    if (v === "0" || v === "false" || v === "off") return false;
    if (v === "1" || v === "true" || v === "on") return true;
    return true;
  }
  return true;
}
