---
slug: "forensics-sunset"
title: "Sunset"
competition: "FGTE"
category: "Forensics"
difficulty: "Medium"
date: "2026-03-16"
updated: "2026-07-06"
summary: "🧠 Kesimpulan Challenge ini menggunakan teknik: PNG → LSB extraction → RGB channel split → hex encoding → bit interleave (R-G-B) → ZIP file → PNG → flag"
tags: ["FORENSIC","STEGANO","MEDIUM"]
status: "published"
flag: "flag{9e068194-a2a5-4e4b-bf95-b85a9ca7d7fe}"
attachments: []
source: "https://claritys.web.id/writeups/forensics-sunset"
---

# Sunset

> 🧠 Kesimpulan Challenge ini menggunakan teknik: PNG → LSB extraction → RGB channel split → hex encoding → bit interleave (R-G-B) → ZIP file → PNG → flag

## 🧩 Write-Up: Sunset (Forensic / Steganography)

(half slop)

## 📌 Deskripsi

Diberikan sebuah file gambar PNG (`sunset.png`). Berdasarkan deskripsi, terdapat pesan tersembunyi di dalam gambar.

* * *

## 🔍 Step 1 — Analisis Awal

Langkah pertama adalah melakukan pengecekan dasar:

```bash
╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:10:05
╰─❯ file sunset.png
sunset.png: PNG image data, 1911 x 955, 8-bit/color RGB, non-interlaced

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:10:22
╰─❯ strings sunset.png | head
IHDR
IDATx
%!!Y/b
I-h!
LJ$     @"
.$ fi   @)
JDh>
P,4H
gO>%
:F-!

╭─   ~/FGTE/foren/sunset/forWU ────────────────────────────── ✔ PIPE|0  kali  06:10:28
╰─❯ binwalk sunset.png

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             PNG image, 1911 x 955, 8-bit/color RGB, non-interlaced
41            0x29            Zlib compressed data, default compression
```

Tidak ditemukan signature mencurigakan atau embedded file.

* * *

## 🔬 Step 2 — Steganografi dengan zsteg

Karena file adalah PNG, pake zsteg juga:

```bash
╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:10:35
╰─❯ zsteg sunset.png
imagedata           .. text: ",BLMffIfi@Ye"
b1,r,lsb,xy         .. file: Zip archive data, at least v2.0 to extract, compression method=deflate
b1,g,lsb,xy         .. file: Zip archive data, at least v2.0 to extract, compression method=deflate
b1,b,lsb,xy         .. file: Zip archive data, at least v2.0 to extract, compression method=deflate
b1,rgb,msb,xy       .. file: BS image, Version 0, Quantization 64624, (Decompresses to 3640 words)
b1,bgr,lsb,xy       .. <wbStego size=0x701c ext="\x1C\x0E?" data="\x00\x00?\x00\x01\xC0\x00q\xC0\x00"... even=false hdr=nil enc=nil mix=nil controlbyte=nil>
b1,bgr,msb,xy       .. file: BS image, Version 0, Quantization 64624, (Decompresses to 3640 words)
b2,g,msb,xy         .. text: "RU'uJ`s~"
b2,rgb,lsb,xy       .. file: mc68k COFF object not stripped
b2,bgr,lsb,xy       .. file: mc68k COFF object not stripped
b3,g,msb,xy         .. text: "HJ$IR$\t8#"
b4,r,lsb,xy         .. file: PDP-11 UNIX/RT ldp
b4,r,msb,xy         .. text: "HDDDDLDD\"B\"\""
b4,g,lsb,xy         .. file: PDP-11 UNIX/RT ldp
b4,g,msb,xy         .. text: "QUUUUUU]5SUSu[5;"
b4,b,lsb,xy         .. text: "3\"4R24UR\"3##%$US$UC5UUEEgDUGUefeDTDy"
b4,b,msb,xy         .. text: "UU=3Uu7ww"
b4,bgr,msb,xy       .. file: Tower/XP rel 3 object not stripped
```

Ditemukan indikasi data pada channel RGB.

Kemudian dilakukan extract:

```bash
╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:11:08
╰─❯ zsteg -E b1,rgb,lsb,xy sunset.png > raw_bits.bin

╭─   ~/FGTE/foren/sunset/forWU ─────────────────────────────────  11s  kali  06:11:49
╰─❯ file raw_bits.bin
raw_bits.bin: data

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:11:52
╰─❯ zsteg -E b1,r,lsb,xy sunset.png > raw_bits_r.bin

╭─   ~/FGTE/foren/sunset/forWU ──────────────────────────────────  9s  kali  06:12:35
╰─❯ zsteg -E b1,g,lsb,xy sunset.png > raw_bits_g.bin

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────── ✘ INT  kali  06:12:56
╰─❯ zsteg -E b1,b,lsb,xy sunset.png > raw_bits_b.bin
```

Namun hasilnya tidak langsung membentuk file valid. Akhirnya saya coba untuk melakukannya satu satu.

```bash

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:14:18
╰─❯ file raw_bits_r.bin
raw_bits_r.bin: Zip archive data, at least v2.0 to extract, compression method=deflate

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:14:34
╰─❯ mv raw_bits_r.bin raw_bits_r.zip

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:14:46
╰─❯ zipinfo raw_bits_r.zip
Archive:  raw_bits_r.zip
Zip file size: 228125 bytes, number of entries: 1
-rw-a--     6.3 fat   141366 bx defN 22-Jul-03 21:20 r.txt
1 file, 141366 bytes uncompressed, 81587 bytes compressed:  42.3%

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:14:53
╰─❯ unzip raw_bits_r.zip
Archive:  raw_bits_r.zip
  End-of-central-directory signature not found.  Either this file is not
  a zipfile, or it constitutes one disk of a multi-part archive.  In the
  latter case the central directory and zipfile comment will be found on
  the last disk(s) of this archive.
unzip:  cannot find zipfile directory in one of raw_bits_r.zip or
        raw_bits_r.zip.zip, and cannot find raw_bits_r.zip.ZIP, period.

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:15:38
╰─❯ 7z x raw_bits_r.zip

7-Zip 25.01 (x64) : Copyright (c) 1999-2025 Igor Pavlov : 2025-08-03
 64-bit locale=en_US.UTF-8 Threads:12 OPEN_MAX:1024, ASM

Scanning the drive for archives:
1 file, 228125 bytes (223 KiB)

Extracting archive: raw_bits_r.zip

WARNINGS:
There are data after the end of archive

--
Path = raw_bits_r.zip
Type = zip
WARNINGS:
There are data after the end of archive
Physical Size = 81731
Tail Size = 146394
Characteristics = Local Central

Everything is Ok

Archives with Warnings: 1

Warnings: 1
Size:       141366
Compressed: 228125
```

Setelah saya pisahkan masing masing, saya coba ke bagian 'r' dulu. Ternyata 'r' adalah .zip. Saya coba ke yang lain akhirnya.

```bash
╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────── ✘ INT  kali  06:22:50
╰─❯ file raw_bits_g.bin
raw_bits_g.bin: Zip archive data, at least v2.0 to extract, compression method=deflate

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:22:59
╰─❯ file raw_bits_b.bin
raw_bits_b.bin: Zip archive data, at least v2.0 to extract, compression method=deflate

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:23:02
╰─❯ mv raw_bits_g.bin raw_bits_g.zip

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:23:19
╰─❯ mv raw_bits_b.bin raw_bits_b.zip

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:23:26
╰─❯ 7z x raw_bits_g.zip

7-Zip 25.01 (x64) : Copyright (c) 1999-2025 Igor Pavlov : 2025-08-03
 64-bit locale=en_US.UTF-8 Threads:12 OPEN_MAX:1024, ASM

Scanning the drive for archives:
1 file, 228125 bytes (223 KiB)

Extracting archive: raw_bits_g.zip

WARNINGS:
There are data after the end of archive

--
Path = raw_bits_g.zip
Type = zip
WARNINGS:
There are data after the end of archive
Physical Size = 81862
Tail Size = 146263
Characteristics = Local Central

Everything is Ok

Archives with Warnings: 1

Warnings: 1
Size:       141366
Compressed: 228125

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:23:39
╰─❯ 7z x raw_bits_b.zip

7-Zip 25.01 (x64) : Copyright (c) 1999-2025 Igor Pavlov : 2025-08-03
 64-bit locale=en_US.UTF-8 Threads:12 OPEN_MAX:1024, ASM

Scanning the drive for archives:
1 file, 228125 bytes (223 KiB)

Extracting archive: raw_bits_b.zip

WARNINGS:
There are data after the end of archive

--
Path = raw_bits_b.zip
Type = zip
WARNINGS:
There are data after the end of archive
Physical Size = 81826
Tail Size = 146299
Characteristics = Local Central

Everything is Ok

Archives with Warnings: 1

Warnings: 1
Size:       141366
Compressed: 228125

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:23:44
╰─❯ ls
b.txt  raw_bits.bin    raw_bits_g.zip  r.txt
g.txt  raw_bits_b.zip  raw_bits_r.zip  sunset.png
```

* * *

## 🧠 Step 3 — Analisis Channel RGB

Dilakukan pemisahan channel menjadi tiga file:

```bash
r.txt
g.txt
b.txt
```

Ketiganya memiliki ukuran sama:

```bash
╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:23:51
╰─❯ wc -c r.txt g.txt b.txt
141366 r.txt
141366 g.txt
141366 b.txt
424098 total
```

Menunjukkan bahwa kemungkinan besar ketiga channel harus digabung kembali.

* * *

## ⚠️ Step 4 — Dead End Awal

Beberapa percobaan awal:

-   XOR antar channel → tidak menghasilkan hasil
    
-   Interleave byte RGB → tidak menghasilkan file valid
    
-   Cek compression (zlib/gzip) → gagal
    

Ini menunjukkan bahwa encoding bukan metode standar.

* * *

## 🔑 Step 5 — Insight Penting

Dengan melihat isi file:

```bash
╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:25:49
╰─❯ xxd r.txt | head

00000000: 3563 3038 3030 3036 6232 6330 6563 3038  5c080006b2c0ec08
00000010: 2030 3130 3034 3233 3332 6333 3532 3830   010042332c35280
00000020: 3020 205c 2e2e 2e2e 2e2e 2e20 2e2e 4233  0  \....... ..B3
00000030: 2c35 282e 0d0a 3163 3130 3035 3030 3639  ,5(...1c10050069
00000040: 3030 6531 3830 2030 6531 6530 3036 3032  00e180 0e1e00602
00000050: 3430 3934 3033 6520 202e 2e2e 2e69 2e2e  409403e  ....i..
00000060: 2e20 2e2e 2e60 242e 403e 0d0a 3334 3562  . ...`$.@>..345b
00000070: 3565 3165 3163 3232 3766 3162 2030 3265  5e1e1c227f1b 02e
00000080: 6337 3865 3366 3733 3064 3266 3820 2034  c78e3f730d2f8  4
00000090: 5b5e 2e2e 227f 2e20 2e2e 782e 2e30 2e2e  [^..".. ..x..0..
```

didapatkan pola seperti:

```
5c080006b2c0ec08
```

Artinya:

👉 Data bukan raw byte, melainkan **hex-encoded**

* * *

## ⚙️ Step 6 — Reconstruct dengan Bit Interleave

Setiap channel berisi **hex nibble (4-bit)**.

Pendekatan yang digunakan:

1.  Convert hex → binary (4-bit)
    
2.  Ambil bit dari R, G, B
    
3.  Interleave menjadi:
    
    ```
    Rbit Gbit Bbit
    ```
    
4.  Gabungkan menjadi stream bit
    
5.  Convert kembali ke byte
    

* * *

## 🧪 Solver

Ini merupakan dasar code yang saya bisa simpulkan.

```python
def combine_channels_to_bytes(r_data, g_data, b_data):
    binary_data = ''
    for r, g, b in zip(r_data, g_data, b_data):
        r_binary = bin(int(r, 16))[2:].zfill(4)
        g_binary = bin(int(g, 16))[2:].zfill(4)
        b_binary = bin(int(b, 16))[2:].zfill(4)

        binary_data += ''.join(a + b + c for a, b, c in zip(r_binary, g_binary, b_binary))

    output = bytearray()
    for i in range(0, len(binary_data), 8):
        chunk = binary_data[i:i+8]
        if len(chunk) == 8:
            output.append(int(chunk, 2))

    return output
def hex_to_bytes(filename):
    out = bytearray()

    with open(filename) as f:
        for line in f:
            parts = line.strip().split()

            for p in parts:
                # hanya ambil string yang benar-benar hex
                if all(c in "0123456789abcdefABCDEF" for c in p):
                    if len(p) % 2 == 0:
                        out.extend(bytes.fromhex(p))

    return out

```

Dengan memakai dasar seperti ini, saya bisa mengembangkan menjadi seperti ini:

```python

def combine_channels(r_data, g_data, b_data):
    binary = ""

    for r, g, b in zip(r_data, g_data, b_data):
        r_bin = bin(r)[2:].zfill(8)
        g_bin = bin(g)[2:].zfill(8)
        b_bin = bin(b)[2:].zfill(8)

        binary += ''.join(a+b+c for a,b,c in zip(r_bin,g_bin,b_bin))

    out = bytearray()
    for i in range(0, len(binary), 8):
        byte = binary[i:i+8]
        if len(byte) == 8:
            out.append(int(byte, 2))

    return out


r = hex_to_bytes("r.txt")
g = hex_to_bytes("g.txt")
b = hex_to_bytes("b.txt")

combined = combine_channels(r, g, b)

open("combined_solver.bin", "wb").write(combined)

print("output size:", len(combined))
```

Saya namai sebagai solver.py.

```python
╭─   ~/FGTE/foren/sunset/ ─────────────────────────────────────── ✘ INT  kali  06:28:48
╰─❯ python3 solver.py
output size: 125658
```

* * *

## 📦 Step 7 — Hasil

Langsung cek hasil without hesitation:

```bash

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:32:01
╰─❯ file combined_solver.bin
combined_solver.bin: Zip archive data, at least v1.0 to extract, compression method=store
```

Output:

```
Zip archive data
```

Kemudian:

```bash
╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:32:14
╰─❯ mv combined_solver.bin combined_solver.zip

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:32:57
╰─❯ 7z x combined_solver.zip

7-Zip 25.01 (x64) : Copyright (c) 1999-2025 Igor Pavlov : 2025-08-03
 64-bit locale=en_US.UTF-8 Threads:12 OPEN_MAX:1024, ASM

Scanning the drive for archives:
1 file, 125658 bytes (123 KiB)

Extracting archive: combined_solver.zip

WARNINGS:
There are data after the end of archive

--
Path = combined_solver.zip
Type = zip
WARNINGS:
There are data after the end of archive
Physical Size = 68430
Tail Size = 57228
Comment = �

Everything is Ok

Archives with Warnings: 1

Warnings: 1
Size:       68026
Compressed: 125658

╭─   ~/FGTE/foren/sunset/forWU ───────────────────────────────────────  kali  06:33:01
╰─❯ ls
123.png  combined_solver.zip  raw_bits.bin    raw_bits_g.zip  r.txt      sunset.png
b.txt    g.txt                raw_bits_b.zip  raw_bits_r.zip  solver.py
```

menghasilkan:

```
123.png
```

* * *

## 🖼️ Step 8 — Final

Membuka gambar:

```bash
open 123.png
```

Didapatkan gambar:

![](/assets/uploads/writeup-inline-0afecfba-af46-4179-973b-0d7e8a03a84a.png)

* * *

## 💡 Insight

-   Tidak semua stego menggunakan byte-level encoding
    
-   Bit-level interleave sering digunakan untuk menghindari deteksi tool otomatis
    
-   Analisis format data (hex vs raw) sangat krusial
    
-   Signature file (`PK`, `PNG`) adalah indikator penting keberhasilan
    

## 🔥 Antisipasi

Karena ini merupakan chall yang susah, saya insert data yang penting ke ChatGPT, lalu buatkan code agar saya bisa menghadapi ketika stuck seperti ini. Hasil code:

```text
import itertools

def hex_to_bytes(filename):
    out = bytearray()

    with open(filename) as f:
        for line in f:
            parts = line.strip().split()
            for p in parts:
                if all(c in "0123456789abcdefABCDEF" for c in p):
                    if len(p) % 2 == 0:
                        out.extend(bytes.fromhex(p))
    return out


def interleave_bits(a, b, c):
    binary = ""

    for x, y, z in zip(a, b, c):
        xb = bin(x)[2:].zfill(8)
        yb = bin(y)[2:].zfill(8)
        zb = bin(z)[2:].zfill(8)

        binary += ''.join(i+j+k for i,j,k in zip(xb,yb,zb))

    out = bytearray()
    for i in range(0,len(binary),8):
        chunk = binary[i:i+8]
        if len(chunk)==8:
            out.append(int(chunk,2))

    return out


def check_signature(data):
    if data.startswith(b'PK'):
        return "ZIP"
    if data.startswith(b'\x89PNG'):
        return "PNG"
    if data.startswith(b'\xff\xd8'):
        return "JPEG"
    if data.startswith(b'GIF'):
        return "GIF"
    if data.startswith(b'%PDF'):
        return "PDF"
    return None


print("loading channels...")

r = hex_to_bytes("r.txt")
g = hex_to_bytes("g.txt")
b = hex_to_bytes("b.txt")

channels = {
    "R": r,
    "G": g,
    "B": b
}

print("trying permutations...")

for perm in itertools.permutations(["R","G","B"]):

    a = channels[perm[0]]
    b = channels[perm[1]]
    c = channels[perm[2]]

    data = interleave_bits(a,b,c)

    sig = check_signature(data)

    if sig:
        print("FOUND:", perm, "->", sig)

        filename = f"output_{perm[0]}{perm[1]}{perm[2]}.bin"
        open(filename,"wb").write(data)

        print("written:", filename)

```
