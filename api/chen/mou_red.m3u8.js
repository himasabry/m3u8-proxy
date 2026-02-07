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

  if (ch.type === "hls") {
    return handleHLS(ch, res);
  }

  if (ch.type === "mpd") {
    return handleMPD(ch, res);
  }

  res.status(400).send("#EXTM3U\n# Invalid Channel Type");
}

// ================= HLS =================
async function handleHLS(ch, res) {
  const r = await fetch(ch.url, {
    headers: ch.headers || {}
  });

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

// ================= MPD =================
async function handleMPD(ch, res) {
  const r = await fetch(ch.url, {
    headers: ch.headers || {}
  });

  let xml = await r.text();

  res.setHeader("Content-Type", "application/dash+xml");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(xml);
}
