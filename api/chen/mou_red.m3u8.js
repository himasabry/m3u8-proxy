export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send("#EXTM3U\n# Missing id");
    }

    const channels = {
      "001/4": "ضع_هنا_رابط_m3u8_الاصلي"
    };

    if (!channels[id]) {
      return res.status(404).send("#EXTM3U\n# Channel Not Found");
    }

    const upstream = await fetch(channels[id], {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://google.com",
        "Origin": "https://google.com"
      }
    });

    const data = await upstream.text();

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.send(data);

  } catch (err) {
    res.status(500).send("#EXTM3U\n# Server Error");
  }
}
