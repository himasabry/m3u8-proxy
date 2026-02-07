import fetch from "node-fetch";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).send("#EXTM3U\n# Missing id");

  const channelsUrl = new URL("../../channels.json", import.meta.url);
  const channels = await fetch(channelsUrl).then(r => r.json());

  if (!channels[id]) return res.status(404).send("#EXTM3U\n# Channel Not Found");

  const ch = channels[id];

  // هيدرز بسيطة لو موجودة
  const headers = {};
  if (ch.userAgent) headers["user-agent"] = ch.userAgent;
  if (ch.referer) headers["referer"] = ch.referer;
  if (ch.origin) headers["origin"] = ch.origin;

  // HLS فقط
  const r = await fetch(ch.url, { headers });
  let text = await r.text();

  const base = new URL(ch.url);
  text = text.replace(/^(?!#)(.+)$/gm, line => {
    if (line.startsWith("http")) return line;
    return new URL(line, base).href;
  });

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(text);
}
