---
slug: "web-alpaca-certification"
title: "Alpaca Certification"
competition: "Alpacahack"
category: "Web"
difficulty: "Easy"
date: "2026-11-07"
updated: "2026-11-07"
summary: "\"Intercepting an SSL request and decoding it (using OpenSSL and HTTPS requests)\""
tags: []
status: "published"
flag: "Alpaca{L3ts_continu3_th1s_f0r_another_6_mon7hs}"
attachments: []
source: "https://claritys.web.id/writeups/web-alpaca-certification"
---

# Alpaca Certification

> "Intercepting an SSL request and decoding it (using OpenSSL and HTTPS requests)"

## Recon

We got these files:

```python
~/ctf/alpacahack/web/alpaca-certification
❯ tree                                                                                                                                                                        󰥔 07:56:05
.
├── compose.yaml
├── nginx
│   ├── default.conf
│   ├── Dockerfile
│   ├── index.html
│   └── openssl.cnf
└── publickeynya.pem

2 directories, 9 files
```

Now let’s check the important files:

```python
~/ctf/alpacahack/web/alpaca-certification
❯ cat nginx/default.conf                                                                                                                                                      󰥔 07:54:43
server {
    listen 443 ssl;

    root /usr/share/nginx/html;

    ssl_certificate     /cert/cert.pem;
    ssl_certificate_key /cert/key.pem;

}
```

```python
~/ctf/alpacahack/web/alpaca-certification
❯ cat nginx/openssl.cnf                                                                                                                                                       󰥔 07:54:39
[ req ]
distinguished_name = dn
x509_extensions = v3_req
prompt = no

[ dn ]
O = Alpacahack
OU = Alpacahack

[ v3_req ]
1.2.3.4.5.6 = ASN1:UTF8String:Alpaca{REDACTED}
```

As we can see in the output, the flag is stored at `v3_req` (custom) at `openssl`.

💡

**Google:** \[ req \] is used for creating a new certificate (_Certificate Signing Request)._ This section is used to define X509v3 Extensions. These extensions are typically used to add security features such as Subject Alternative Name (SAN) so that a single certificate can be used across multiple domains (e.g., \*.google.com).

But in this one is used for hiding the flag.

## Exploit

So in the meaning, we can get the flag after we got the `cert.pem`, not the `key.pem`. Which is kinda easy because `cert.pem` is not a secret, it’s like a public key. So we always get the `cert.pem`where the flag hiding in that file.

In this case, i use a command for receiving the `cert.pem`.

```python
 openssl s_client -connect 34.170.146.252:6521 | openssl x509 -text -noout
```

`openssl s_client` is used so we access the website using SSL and we get the SSL request information. For the `openssl x509` is used to decode the certificate (BEGIN CERTIFICATE - END CERTIFICATE).

This is the output so we got the flag:

![image.png](/assets/uploads/35020000-1718-4f49-8226-07cfb66b472c-image.png)

## PoC request

```
openssl s_client -connect 34.170.146.252:6521 | openssl x509 -text -noout
```
