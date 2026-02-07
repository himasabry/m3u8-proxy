import fs from "fs";
import path from "path";
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send("#EXTM3U\n# Missing id");
    }

    // قراءة القنوات من ملف JSON
    const channelsPath = path.resolve("./channels.json");
    const channelsData = fs.readFileSync(channelsPath, "utf-8");
    const channels = JSON.parse(channelsData);

    if (!channels[id]) {
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

    let data = await upstream.text();

    // إضافة مفتاح Clearkey لو موجود
    if (channel.drmKey) {
      const [keyId, keyValue] = channel.drmKey.split(":");
      const clearkeyJson = JSON.stringify({
        keys: [
          { kty: "oct", k: Buffer.from(keyValue, "hex").toString("base64"), kid: Buffer.from(keyId, "hex").toString("base64") }
        ]
      });

      data = `#EXTM3U
#EXT-X-KEY:METHOD=SAMPLE-AES,KEYFORMAT="org.w3.clearkey",URI="data:application/json;base64,${Buffer.from(clearkeyJson).toString("base64")}"
${data}`;
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.send(data);

  } catch (err) {
    console.error(err);
    res.status(500).send("#EXTM3U\n# Server Error");
  }
}
