---
slug: "forensics-invisible-ink"
title: "Invisible Ink"
competition: "SCTF 2026"
category: "Forensics"
difficulty: "Medium"
date: "2026-07-04"
updated: "2026-07-06"
summary: "Deskripsi : Can you read between the lines?"
tags: ["FORENSIC","MEDIUM","ZERO WIDTH UNICODE"]
status: "published"
flag: "SCTF26{z3r0_w1dth_1s_tr1cky_f0r_3y3s}"
attachments: [{"url":"/assets/uploads/15091af0-9f94-4064-bd5e-317f4b5e7403-a.txt","name":"a.txt","contentType":"text/plain"}]
source: "https://claritys.web.id/writeups/forensics-invisible-ink"
---

# Invisible Ink

> Deskripsi : Can you read between the lines?

![](/assets/uploads/78ee0ebc-732f-4239-b575-338b3744f893-image-10.png)

Pertama-pertama, kita langsung google kalau ini itu apa. Dari situ, dia mention Windows-1252. Gw langsung mencari cara untuk decode Windows-1252.

Turns out, hasil semuanya itu aneh. Jadinya aku coba cek cyberchef apakah ada atau tidak.

![](/assets/uploads/f611f0ed-c2c3-474e-8196-6ae1f2870e23-image-11.png)

Ternyata ada, aku langsung nyoba pakai decode text malah hasilnya sama

![](/assets/uploads/d9131b7b-c24b-4c66-a85f-dcce503c4ec7-image-12.png)

Alhasil aku pakai encode, dan ternyata work. But, hasilnya itu merah merah, aku awalnya tetep bingung sih. Tapi dipikir pikir ini itu mirip zero-width Unicode steganography. Apalagi itu ada UTF-8 detected dari cyberchef pojok kanan bawah. Langsung saja kita tambahkan decode UTF-8.

![](/assets/uploads/aff974dd-b323-489c-a6f3-0a07a9c7230b-image-13.png)

Yaa.. even though sama aja merah merah but it’s different ahh moment. Langsung copy raw to clipboard lalu google tentang zero-width Unicode steganography dan milih web [https://stegzero.com/](https://stegzero.com/).

![](/assets/uploads/ad3537bc-2d1c-4669-bd64-2f64245480cc-image-14.png)

Completed :3
