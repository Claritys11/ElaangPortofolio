---
slug: "crypto-locked-desk-drawer"
title: "Locked Desk Drawer"
competition: "FGTE"
category: "Crypto"
difficulty: "Medium"
date: "2026-03-24"
updated: "2026-07-06"
summary: "🔚 Kesimpulan: Challenge ini menggabungkan Forensik (metadata & steganografi) Encoding (Base64) Kriptografi (AES + MD5)"
tags: ["MISC","MEDIUM","AES"]
status: "published"
flag: "FGTE{MISC_MASTERED}"
attachments: []
source: "https://claritys.web.id/writeups/crypto-locked-desk-drawer"
---

# Locked Desk Drawer

> 🔚 Kesimpulan: Challenge ini menggabungkan Forensik (metadata & steganografi) Encoding (Base64) Kriptografi (AES + MD5)

## 🧩 Write-up CTF: _Locked Desk Drawer_ (MISC)

(half slop)

## 📌 Deskripsi Singkat

Pada challenge ini, diberikan tiga file:

-   `desk.png`
    
-   `note.txt`
    
-   `drawer.enc`
    

Tujuan dari challenge ini adalah menemukan flag yang tersembunyi melalui beberapa lapisan teknik **forensik, encoding, dan kriptografi**.

* * *

## 🖼️ Tahap 1 — Analisis `desk.png`

### 🔎 Cek metadata

```bash
~/FGTE/MISC/lockeddeskdrawer
❯ exiftool desk.png
ExifTool Version Number         : 13.50
File Name                       : desk.png
Directory                       : .
File Size                       : 767 bytes
File Modification Date/Time     : 2026:03:03 16:45:00+07:00
File Access Date/Time           : 2026:03:03 16:44:59+07:00
File Inode Change Date/Time     : 2026:03:03 16:45:00+07:00
File Permissions                : -rw-r--r--
File Type                       : PNG
File Type Extension             : png
MIME Type                       : image/png
Image Width                     : 320
Image Height                    : 200
Bit Depth                       : 8
Color Type                      : RGB
Compression                     : Deflate/Inflate
Filter                          : Adaptive
Interlace                       : Noninterlaced
User Comment                    : note2.txt
Description                     : A photo of a wooden desk. (Check UserComment)
Image Size                      : 320x200
Megapixels                      : 0.064
```

Hasil penting:

```
User Comment : note2.txt
Description  : A photo of a wooden desk. (Check UserComment)
```

👉 Ini memberikan clue:

> Ada sesuatu yang berkaitan dengan **note2.txt**

* * *

### 🔬 Cek struktur file

```bash
~/FGTE/MISC/lockeddeskdrawer
❯ xxd desk.png
00000000: 8950 4e47 0d0a 1a0a 0000 000d 4948 4452  .PNG........IHDR
00000010: 0000 0140 0000 00c8 0802 0000 0016 66af  ...@..........f.
00000020: fc00 0000 1574 4558 7455 7365 7243 6f6d  .....tEXtUserCom
00000030: 6d65 6e74 006e 6f74 6532 2e74 7874 f2c2  ment.note2.txt..
00000040: f95c 0000 0039 7445 5874 4465 7363 7269  .\...9tEXtDescri
00000050: 7074 696f 6e00 4120 7068 6f74 6f20 6f66  ption.A photo of
00000060: 2061 2077 6f6f 6465 6e20 6465 736b 2e20   a wooden desk.
00000070: 2843 6865 636b 2055 7365 7243 6f6d 6d65  (Check UserComme
00000080: 6e74 2919 d99f 5b00 0002 6049 4441 5478  nt)...[...`IDATx
00000090: 9ced d331 0d00 2000 c030 c0bf 3094 a003  ...1.. ..0..0...
000000a0: 0f3c 6449 ab60 cfe6 de67 004d eb77 00f0  .<dI.`...g.M.w..
000000b0: cec0 1066 6008 3330 8419 18c2 0c0c 6106  ...f`.30......a.
000000c0: 8630 0343 9881 21cc c010 6660 0833 3084  .0.C..!...f`.30.
000000d0: 1918 c20c 0c61 0686 3003 4398 8121 ccc0  .....a..0.C..!..
000000e0: 1066 6008 3330 8419 18c2 0c0c 6106 8630  .f`.30......a..0
000000f0: 0343 9881 21cc c010 6660 0833 3084 1918  .C..!...f`.30...
00000100: c20c 0c61 0686 3003 4398 8121 ccc0 1066  ...a..0.C..!...f
00000110: 6008 3330 8419 18c2 0c0c 6106 8630 0343  `.30......a..0.C
00000120: 9881 21cc c010 6660 0833 3084 1918 c20c  ..!...f`.30.....
00000130: 0c61 0686 3003 4398 8121 ccc0 1066 6008  .a..0.C..!...f`.
00000140: 3330 8419 18c2 0c0c 6106 8630 0343 9881  30......a..0.C..
00000150: 21cc c010 6660 0833 3084 1918 c20c 0c61  !...f`.30......a
00000160: 0686 3003 4398 8121 ccc0 1066 6008 3330  ..0.C..!...f`.30
00000170: 8419 18c2 0c0c 6106 8630 0343 9881 21cc  ......a..0.C..!.
00000180: c010 6660 0833 3084 1918 c20c 0c61 0686  ..f`.30......a..
00000190: 3003 4398 8121 ccc0 1066 6008 3330 8419  0.C..!...f`.30..
000001a0: 18c2 0c0c 6106 8630 0343 9881 21cc c010  ....a..0.C..!...
000001b0: 6660 0833 3084 1918 c20c 0c61 0686 3003  f`.30......a..0.
000001c0: 4398 8121 ccc0 1066 6008 3330 8419 18c2  C..!...f`.30....
000001d0: 0c0c 6106 8630 0343 9881 21cc c010 6660  ..a..0.C..!...f`
000001e0: 0833 3084 1918 c20c 0c61 0686 3003 4398  .30......a..0.C.
000001f0: 8121 ccc0 1066 6008 3330 8419 18c2 0c0c  .!...f`.30......
00000200: 6106 8630 0343 9881 21cc c010 6660 0833  a..0.C..!...f`.3
00000210: 3084 1918 c20c 0c61 0686 3003 4398 8121  0......a..0.C..!
00000220: ccc0 1066 6008 3330 8419 18c2 0c0c 6106  ...f`.30......a.
00000230: 8630 0343 9881 21cc c010 6660 0833 3084  .0.C..!...f`.30.
00000240: 1918 c20c 0c61 0686 3003 4398 8121 ccc0  .....a..0.C..!..
00000250: 1066 6008 3330 8419 18c2 0c0c 6106 8630  .f`.30......a..0
00000260: 0343 9881 21cc c010 6660 0833 3084 1918  .C..!...f`.30...
00000270: c20c 0c61 0686 3003 4398 8121 ccc0 1066  ...a..0.C..!...f
00000280: 6008 3330 8419 18c2 0c0c 6106 8630 0343  `.30......a..0.C
00000290: 9881 21cc c010 6660 0833 3084 1918 c20c  ..!...f`.30.....
000002a0: 0c61 0686 3003 4398 8121 ccc0 1066 6008  .a..0.C..!...f`.
000002b0: 3330 8419 18c2 0c0c 6106 8630 0343 9881  30......a..0.C..
000002c0: 21cc c010 6660 0833 3084 1918 c20c 0c61  !...f`.30......a
000002d0: 0686 3003 4398 8121 ccc0 1066 6008 3330  ..0.C..!...f`.30
000002e0: 8419 18c2 0c0c 6106 86b0 0ba4 f904 06a4  ......a.........
000002f0: 27d6 b900 0000 0049 454e 44ae 4260 82    '......IEND.B`.
```

Terlihat adanya chunk:

```
tEXtUserComment → note2.txt
```

Namun tidak ada file `note2.txt` secara langsung.

* * *

### 🧠 Steganografi (LSB)

Menggunakan:

```bash
╭─   ~/FGTE/MISC/lockeddeskdrawer ────────────────────────────────────  kali  07:22:42
╰─❯ zsteg -a desk.png
meta UserComment    .. text: "note2.txt"
meta Description    .. text: "A photo of a wooden desk. (Check UserComment)"
chunk:0:IHDR        .. file: Adobe Photoshop Color swatch, version 0, 320 colors; 1st RGB space (0), w 0xc8, x 0x802, y 0, z 0; 2nd RGB space (0), w 0, x 0, y 0, z 0
b6,b,lsb,xy         .. file: OpenPGP Public Key
b6,bgr,lsb,xy       .. file: OpenPGP Public Key
```

Hasil:

```
b6,b,lsb,xy → OpenPGP Public Key
```

* * *

### ⚠️ Insight

Data LSB menghasilkan sesuatu yang terlihat seperti **OpenPGP key**, namun:

-   Tidak bisa di-import dengan GPG
    
-   Format tidak valid
    

👉 Ini adalah **decoy / jebakan**, bukan solusi utama.

* * *

## 📄 Tahap 3 — Analisis `note.txt`

```bash
~/FGTE/MISC/lockeddeskdrawer
❯ cat note.txt
T3BlbiB0aGUgZHJhd2VyIHdpdGggcGFzczogcGFzcy14eXoxMjM0
```

Isi:

```
T3BlbiB0aGUgZHJhd2VyIHdpdGggcGFzczogcGFzcy14eXoxMjM0
```

* * *

### 🔓 Decode Base64

```bash
~/FGTE/MISC/lockeddeskdrawer
❯ echo T3BlbiB0aGUgZHJhd2VyIHdpdGggcGFzczogcGFzcy14eXoxMjM0 | base64 -d
Open the drawer with pass: pass-xyz1234⏎
```

Hasil:

```
Open the drawer with pass: pass-xyz1234
```

👉 Didapatkan:

```
Password: pass-xyz1234
```

* * *

## 🔐 Tahap 4 — Analisis `drawer.enc`

### 🔎 Identifikasi file

```bash

~/FGTE/MISC/lockeddeskdrawer
❯ file drawer.enc
drawer.enc: data
```

Hasil:

```
data
```

* * *

### ❌ Percobaan yang gagal

Beberapa metode dicoba namun gagal:

-   ❌ OpenSSL (bad magic number)
    
-   ❌ ZIP / archive
    
-   ❌ XOR
    

👉 Artinya:

> Ini bukan format standar → kemungkinan **raw encryption**

* * *

## 🧠 Tahap 5 — Analisis Kriptografi

### 📏 Observasi penting

```
.rw-r--r--   64 claritys  3 Mar 16:45  drawer.enc
```

-   Ukuran file: **64 byte**
    
-   AES block size: **16 byte**
    

👉 64 byte = 4 blok AES

➡️ Indikasi kuat:

> Menggunakan **AES**

* * *

### 🔑 Masalah: password ≠ key

AES membutuhkan:

-   16 / 24 / 32 byte key
    

Password:

```
pass-xyz1234 (12 byte)
```

👉 Maka:

> Password harus diubah menjadi key

* * *

### 🔬 Coba Hash sebagai Key

#### ❌ SHA256 (tidak berhasil)

#### ✅ MD5 (berhasil sebagian)

```python
import hashlib
from Crypto.Cipher import AES

data = open("drawer.enc","rb").read()
key = hashlib.md5(b"pass-xyz1234").digest()

cipher = AES.new(key, AES.MODE_ECB)
print(cipher.decrypt(data))
```

Hasil:

```
>>> import hashlib
... from Crypto.Cipher import AES
...
... data = open("drawer.enc","rb").read()
... key = hashlib.md5(b"pass-xyz1234").digest()
...
... cipher = AES.new(key, AES.MODE_ECB)
... print(cipher.decrypt(data))
...
b'The desk hides m\xddN\xf2\xc9b5\x83\xb6;:K\xa17A\xdd~\xdcC"\x90b\x11\x12\xa4:0\xae\xdc\xe7?(\xa8\xb7Xh\x9bg\x84\x8a\xb7s\x8alx\x99\xe8R\x18'

The desk hides m...
```

👉 Sudah mulai terbaca → berarti arah benar

* * *

### 🔥 Gunakan Mode CBC

```python
from Crypto.Cipher import AES
import hashlib

data = open("drawer.enc","rb").read()

key = hashlib.md5(b"pass-xyz1234").digest()
iv = b"\x00" * 16

cipher = AES.new(key, AES.MODE_CBC, iv)
out = cipher.decrypt(data)

print(out)
```

* * *

## 🎉 Hasil Akhir

Output:

```
>>> from Crypto.Cipher import AES
... import hashlib
...
... data = open("drawer.enc","rb").read()
...
... key = hashlib.md5(b"pass-xyz1234").digest()
... iv = b"\x00" * 16
...
... cipher = AES.new(key, AES.MODE_CBC, iv)
... out = cipher.decrypt(data)
...
... print(out)
...
b'The desk hides more than paper.\nFGTE{MISC_MASTERED}\n\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c'
>>>

The desk hides more than paper.
FGTE{MISC_MASTERED}
```

* * *

## 🧠 Insight & Pembelajaran

Challenge ini mengajarkan beberapa hal penting:

### 🔍 1. Jangan terjebak decoy

-   Data LSB menghasilkan PGP key palsu
    
-   Tidak semua hasil tool adalah solusi
    

* * *

### 🔐 2. Password ≠ Key

-   Password sering di-hash (MD5/SHA) sebelum dipakai sebagai key
    

* * *

### 🧩 3. Kenali pola file kecil

-   64 byte → sangat khas AES block cipher
    

* * *

### ⚙️ 4. Trial yang terarah

Bukan brute force random, tapi:

-   eliminasi metode
    
-   gunakan pola umum CTF
