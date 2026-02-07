import fetch from "node-fetch";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send("#EXTM3U\n# Missing id");
  }

  const channelsUrl = new URL("../../channels.json", import.meta.url);
  const channels = await fetch(channelsUrl).then(r => r.json());

  if (!channels[id]) {
    return res.status(404).send("#EXTM3U\n# Channel Not Found");
  }

  const ch = channels[id];

  // تجهيز الهيدرز
  const headers = {};
  if (ch.userAgent) headers["user-agent"] = ch.userAgent;
  if (ch.referer) headers["referer"] = ch.referer;
  if (ch.origin) headers["origin"] = ch.origin;

  // تحديد النوع تلقائي
  if (ch.url.includes(".m3u8")) {
    return handleHLS(ch, headers, res);
  }

  if (ch.url.includes(".mpd")) {
    return handleMPD(ch, headers, res);
  }

  return res.status(400).send("#EXTM3U\n# Unknown Stream Type");
}

// ================= HLS =================
async function handleHLS(ch, headers, res) {
  const r = await fetch(ch.url, { headers });
  let text = await r.text();

  const base = new URL(ch.url);

  // تصحيح الروابط الداخلية
  text = text.replace(/^(?!#)(.+)$/gm, line => {
    if (line.startsWith("http")) return line;
    return new URL(line, base).href;
  });

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(text);
}

// ================= MPD =================
async function handleMPD(ch, headers, res) {
  const r = await fetch(ch.url, { headers });
  let xml = await r.text();

  // دعم ClearKey
  if (ch.drmKey) {
    const [keyId, key] = ch.drmKey.split(":");

    const clearkey = Buffer.from(JSON.stringify({
      keys: [
        {
          kty: "oct",
          kid: Buffer.from(keyId, "hex").toString("base64"),
          k: Buffer.from(key, "hex").toString("base64")
        }
      ]
    })).toString("base64");

    xml = xml.replace(
      "</MPD>",
      `
<ContentProtection schemeIdUri="urn:uuid:e2719d58-a985-b3c9-781a-b030af78d30e">
  <cenc:pssh>${clearkey}</cenc:pssh>
</ContentProtection>
</MPD>`
    );
  }

  res.setHeader("Content-Type", "application/dash+xml");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(xml);
}
