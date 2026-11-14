---
slug: "forensics-sepuh-forensik"
title: "Sepuh Forensik"
competition: "DCSC"
category: "Forensics"
difficulty: "Medium"
date: "2026-07-01"
updated: "2026-07-01"
summary: "Di chall ini kita dikasih `forensic.pcapng` yang awalnya keliatan rame banget karena banyak traffic HTTP random. Setelah dipilah, ada beberapa hal yang mencurigakan: login ke `internal-portal.local/login.php`, fake flag yang jelas-jelas jebakan, dan file PNG yang dikirim lewat TCP stream 96. PNG itu ternyata berisi QR code rusak/kurang kebaca, jadi perlu direcover dulu. Setelah QR kebaca, datanya masih belum langsung jadi flag karena masih berlapis Base64, Base32, lalu XOR. Key XOR-nya diambil dari password login yang ketangkep di traffic: `rahasia`."
tags: ["FORENSICS","PCAP","MISC","MEDIUM"]
status: "published"
flag: "SCTF{53pUh_f0r3n5iK_b312aK51_4mPun_puH_s838823}"
attachments: []
source: "https://claritys.web.id/writeups/forensics-sepuh-forensik"
---

# Sepuh Forensik

> Di chall ini kita dikasih `forensic.pcapng` yang awalnya keliatan rame banget karena banyak traffic HTTP random. Setelah dipilah, ada beberapa hal yang mencurigakan: login ke `internal-portal.local/login.php`, fake flag yang jelas-jelas jebakan, dan file PNG yang dikirim lewat TCP stream 96. PNG itu ternyata berisi QR code rusak/kurang kebaca, jadi perlu direcover dulu. Setelah QR kebaca, datanya masih belum langsung jadi flag karena masih berlapis Base64, Base32, lalu XOR. Key XOR-nya diambil dari password login yang ketangkep di traffic: `rahasia`.

## **Sepuh Forensik**

![](/assets/uploads/81ce6bef-9f31-430e-933c-a793730500df-screenshot_2026-07-01_10-49-00.png)

## **Analisis Awal PCAP**

Pertama buka `forensic.pcapng` di Wireshark. Di situ banyak traffic HTTP random ke domain umum seperti:

-   `google.com`
    
-   `facebook.com`
    
-   `instagram.com`
    
-   `twitter.com`
    
-   `github.com`
    
-   `stevenjr.space`
    

![](/assets/uploads/8ccbcd16-f840-4648-bc8e-d5623e510622-screenshot_2026-07-01_10-50-49.png)

Traffic-nya rame banget, tapi sebagian besar cuma noise. Kita coba follow stream http terus-terusan.

![](/assets/uploads/e6ec052f-4671-4b75-8119-3cf7da6810f3-screenshot_2026-07-01_10-52-18.png)

Nah, di stream ke 94 ada request POST ke:

```text
internal-portal.local/login.php
```

Isi POST-nya:

```text
username=admin&password=rahasia&submit=Login
```

Ini langsung masuk daftar hal penting, karena di CTF forensic, credential yang kelihatan jelas di traffic sering banget bukan pajangan doang. Minimal dia bisa jadi clue, key, atau pivot ke tahap berikutnya.

![](/assets/uploads/73397635-e816-4fdc-9c8a-8a86340b70e5-screenshot_2026-07-01_10-53-47.png)

Di stream 95 ada juga request ke:

```text
/search?q=SCTF{fake_flag_ini_jebakan_bro}
```

Kalau ini sih fake flag yak.

![](/assets/uploads/7564d165-fd62-4889-8531-74b363651849-screenshot_2026-07-01_10-54-52.png)

## **Ekstraksi PNG dari Stream 96**

Di stream 96 ada response HTTP:

```text
HTTP/1.1 200 OK
Content-Type: image/png
Content-Disposition: attachment; filename=secret_evidence.png
Content-Length: 5049
```

Karena content type-nya PNG dan filename-nya `secret_evidence.png`, file ini diekspor dari Wireshark.

![](/assets/uploads/f0830ad2-c27b-41e7-aff8-48114e0315c6-screenshot_2026-07-01_10-55-56.png)Kita export gambarnya terlebih dahulu, sekalian dengan login.php karena kena juga.

![](/assets/uploads/688a9423-a6cc-4000-8df8-73a3ee963a16-screenshot_2026-07-01_10-57-04.png)

Ternyata, gambarnya ada QR Code yang rusak..

![](/assets/uploads/ec9ecc26-dafe-4a57-9468-6c60dfcb24e8-secret_evidence.png)

QR-nya tidak langsung kebaca normal, sebenarnya, aku mau ngerecovery QR ini menggunakan QRazyBox. Tapi websitenya error, alhasil aku meminta claude untuk recover QR ini.

[https://claude.ai/share/a9af7246-d5f4-4f16-844b-97f18a1ebcb6](https://claude.ai/share/a9af7246-d5f4-4f16-844b-97f18a1ebcb6)

![](/assets/uploads/dd4c0ddc-9ccf-40ad-a4dd-1876649a8ca2-screenshot_2026-07-01_11-02-33.png)

Ini hasilnya:

![](/assets/uploads/48c3193b-d321-46e2-9717-0deb835179c2-recovered_qr_from_secret_evidence.png)

Setelah dibenerin/recover, QR menghasilkan string Base64 panjang:

```text
RUVSRFlKWUlMUkpBRU5BQUhZS1ZTRTJCQjVPUVFPQldBTkFWQVdRQUhCT0ZBTEtWQVVZUU1CWjZBSUtDQVBRQUtGSkVVV0syS0lIQT09PT0=
```

## **Trial 1 - Decode Base64**

Karena string QR diakhiri `=`, dan karakternya cocok format Base64, langkah pertama paling masuk akal adalah decode Base64.

Cyberchef:

![](/assets/uploads/5a454e7a-395b-4cf9-9e7c-792d59316247-screenshot_2026-07-01_11-04-48.png)

Hasil:

```text
EERDYJYILRJAENAAHYKVSE2BB5OQQOBWANAVAWQAHBOFALKVAUYQMBZ6AIKCAPQAKFJEUWK2KIHA====
```

Oke, ini sepertinya dijalan yang benar.

## **Trial 2 - Decode Base32**

![](/assets/uploads/acc00cd1-538d-469a-af08-3fb486c4a4e6-screenshot_2026-07-01_11-07-46.png)

Decode Base32:

![](/assets/uploads/0bd61361-062a-49df-bb6c-da1274421698-screenshot_2026-07-01_11-08-38.png)

Hasilnya bukan plaintext:

```text
!"<'\R4>YA]86APZ8\P-U1> >QRJYZR
```

Di sini sempat keliatan kayak dead end, tapi sebenernya justru makin jelas: ini kemungkinan ciphertext. Kita disuruh ngawang di sini.

## **Trial 3 - Coba Cari Pola Cipher**

Karena hasil Base32 berupa byte non-printable, beberapa kemungkinan muncul:

-   XOR
    
-   AES/crypto lain
    
-   data compressed
    
-   QR-nya masih salah
    
-   perlu key dari artefak lain
    

Aku cek dulu kemungkinan sederhana. Untuk CTF forensic, kalau ada credential di traffic dan ada ciphertext pendek, XOR dengan password adalah tebakan yang worth it banget.

Sebenarnya aku ada 1 yang mengganjal sih, yaitu login.php tadi.

```python
POST /login.php HTTP/1.1
Host: internal-portal.local
Content-Type: application/x-www-form-urlencoded
Content-Length: 44

username=admin&password=rahasia&submit=Login
```

Di sini ada password=rahasia, ini seperti key. Meskipun cuman asumsi, tapi layak untuk dicoba.

![](/assets/uploads/5c1654ac-69af-4a97-8ddd-2b2e9dbf54f3-screenshot_2026-07-01_11-14-35.png)

Nah, ketemu deh.

![](/assets/uploads/b48a2e78-cd67-435f-81bf-9957006b8a96-screenshot_2026-07-01_10-32-50.png)
