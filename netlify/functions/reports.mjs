import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export default async (req) => {
  const url = new URL(req.url);
  const store = getStore("shared-reports");

  // Po rewrite z Netlify: /.netlify/functions/reports albo /.netlify/functions/reports/:id
  const segments = url.pathname.split("/").filter(Boolean);
  const idx = segments.lastIndexOf("reports");
  const id = idx >= 0 && segments.length > idx + 1 ? segments[idx + 1] : null;

  // GET /api/reports/:id
  if (req.method === "GET" && id) {
    const report = await store.get(id, { type: "json" });
    if (!report) return json({ error: "Not found" }, 404);
    return json(report, 200);
  }

  // POST /api/reports
  if (req.method === "POST" && !id) {
    const body = await req.json().catch(() => ({}));

    // WHITELIST: zapisujemy tylko agregaty (bez "Kontrahent" i bez surowych wierszy)
    const safe = {
      createdAt: body?.createdAt ?? new Date().toISOString(),
      dateFilter: body?.dateFilter ?? { from: null, to: null },
      aggregatedData: body?.aggregatedData ?? {},
      chartsData: body?.chartsData ?? {},
    };

    const newId = crypto.randomUUID().slice(0, 10);
    await store.setJSON(newId, safe);

    const origin = new URL(req.url).origin;
    const shareUrl = `${origin}/raporty/r/${newId}`;
    return json({ id: newId, url: shareUrl }, 200);
  }

  return json({ error: "Not found" }, 404);
};
