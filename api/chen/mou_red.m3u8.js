import fetch from "node-fetch";

// جدول القنوات
const channels = {
  "001/4": {
    url: "https://example.com/live/stream1.m3u8",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    referer: "https://example.com",
    origin: "https://example.com",
    drmKey: null
  },
  "002/1": {
    url: "https://example.com/live/stream2.mpd",
    userAgent: "Mozilla/5.0",
    referer: "https://example2.com",
    origin: "https://example2.com",
    drmKey: "17774f82a3b9e33ea7a149596acbb20f"
  },
  "003/2": {
    url: "https://example3.com/live/stream3.m3u8",
    userAgent: "Mozilla/5.0",
    referer: "https://example3.com",
    origin: "https://example3.com",
    drmKey: null
  }
};

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id || !channels[id]) {
      return res.status(404).send("#EXTM3U\n# Channel Not Found");
    }

    const channel = channels[id];

    const upstream = await fetch(channel.url, {
      headers: {
        "User-Agent": channel.userAgent || "Mozilla/5.0",
        "Referer": channel.referer || "",
        "Origin": channel.origin || ""
      }
    });

    const data = await upstream.text();

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // لو فيه drmKey ممكن تضيفه لاحقاً في ملف m3u8
    res.send(data);

  } catch (err) {
    console.error(err);
    res.status(500).send("#EXTM3U\n# Server Error");
  }
}
