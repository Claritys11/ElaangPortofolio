---
slug: "web-fushigi-crawler"
title: "Fushigi Crawler"
competition: "Alpacahack"
category: "Web"
difficulty: "Easy"
date: "2026-11-04"
updated: "2026-11-04"
summary: "A bot crawler carries a flag as a header"
tags: ["CRAWLER"]
status: "published"
flag: "Alpaca{CRAWLER_IS_SUGOI!}"
attachments: []
source: "https://claritys.web.id/writeups/web-fushigi-crawler"
---

# Fushigi Crawler

> A bot crawler carries a flag as a header

## Recon

We got these files:

```python
~/ctf/alpacahack/web/fushigi-crawler
❯ tree                                                                                                                                                                        󰥔 11:33:05
.
├── bot
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   └── public
│       └── index.html
└── compose.yaml

3 directories, 6 files
```

Lets check the `index.js`

```jsx
import express from "express";
import rateLimit from "express-rate-limit";

const FLAG = process.env.FLAG ?? console.log("No flag") ?? process.exit(1);

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use("/api", rateLimit({ windowMs: 60 * 1000, max: 4, }));

app.post("/api/crawl-request", async (req, res) => {
  const url = req.body?.url;
  if (typeof url !== "string" || (!url.startsWith("http://") && !url.startsWith("https://")))
    return res.status(400).send("Invalid url");
  try {
    const r = await fetch(url, { headers: { FLAG }, signal: AbortSignal.timeout(5000) }); // !!
    if (!r.ok) return res.status(502).send("Fetch failed");
    return res.sendStatus(200);
  } catch (e) {
    return res.status(500).send(`Something wrong: ${e.name}`);
  }
});

app.listen(3333);
```

In this snippet:

```jsx
  if (typeof url !== "string" || (!url.startsWith("http://") && !url.startsWith("https://")))
    return res.status(400).send("Invalid url");
```

The requirement input must be:

1.  String
    
2.  Starts with `http://` or `https://`
    

## Vulnerability

From this snippet:

```python
    const r = await fetch(url, { headers: { FLAG }, signal: AbortSignal.timeout(5000) }); // !!
```

So the `flag` appears at the `header` when the `bot` `fetching` the `URL`.

We can conclude so we have to setup a web so the `bot` will `fetching` to that `URL` with `flag` as a `header`. But we don’t bother to setup a web, there’s a `website` called [webhook.site](http://webhook.site) that we can use it for a `temporary receiver` that useful for `receiving` the `fetch` (`GET`)

![image.png](/assets/uploads/f9b9e5db-b189-4b81-b268-0e489525cd68-image.png)

I tried it and then I successfully got the flag from the `header`.

![image.png](/assets/uploads/27e1abc8-7457-4700-9893-0ab8564ecca4-image-1.png)
