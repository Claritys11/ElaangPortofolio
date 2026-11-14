---
slug: "forensics-jindal"
title: "Jindal"
competition: "PsychCTF 2026"
category: "Forensics"
difficulty: "Easy"
date: "2026-03-15"
updated: "2026-07-06"
summary: "🧩 Kesimpulan Challenge ini menggunakan beberapa teknik: File embedding (JPEG + ZIP) Nested archive Misdirection (troll message) Whitespace Steganography (tab & space encoding)"
tags: ["FORENSIC","STEGANO","EASY"]
status: "published"
flag: "psych{w311_d0n3_sp4c3s_4r3n7_4lw4y5_3mpty}"
attachments: []
source: "https://claritys.web.id/writeups/forensics-jindal"
---

# Jindal

> 🧩 Kesimpulan Challenge ini menggunakan beberapa teknik: File embedding (JPEG + ZIP) Nested archive Misdirection (troll message) Whitespace Steganography (tab & space encoding)

## 🧩 Write-Up CTF: Jindal (Misc / Forensics)

(half slop)

## 📌 Deskripsi Challenge

Diberikan sebuah file gambar bernama `jindal.jpeg`. Challenge ini mengindikasikan adanya pesan tersembunyi di dalam file tersebut.

* * *

## 🔍 Step 1 — Analisis Awal (Metadata)

Langkah pertama adalah memeriksa metadata file menggunakan `exiftool`:

```bash
~/pscyh/misc/jindal
❯ exiftool jindal.jpeg
ExifTool Version Number         : 13.50
File Name                       : jindal.jpeg
Directory                       : .
File Size                       : 299 kB
File Modification Date/Time     : 2026:03:19 15:36:55+07:00
File Access Date/Time           : 2026:03:19 15:36:55+07:00
File Inode Change Date/Time     : 2026:03:19 15:37:31+07:00
File Permissions                : -rw-r--r--
File Type                       : JPEG
File Type Extension             : jpg
MIME Type                       : image/jpeg
JFIF Version                    : 1.01
Resolution Unit                 : None
X Resolution                    : 1
Y Resolution                    : 1
Image Width                     : 1080
Image Height                    : 1420
Encoding Process                : Progressive DCT, Huffman coding
Bits Per Sample                 : 8
Color Components                : 3
Y Cb Cr Sub Sampling            : YCbCr4:2:0 (2 2)
Image Size                      : 1080x1420
Megapixels                      : 1.5
```

Hasil menunjukkan bahwa file tampak seperti JPEG biasa tanpa metadata mencurigakan.

* * *

## 🧠 Step 2 — Identifikasi File Tersembunyi

Selanjutnya dilakukan analisis menggunakan `binwalk`:

```bash
~/pscyh/misc/jindal
❯ binwalk jindal.jpeg

                                                                       /home/claritys/pscyh/misc/jindal/jindal.jpeg
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
DECIMAL                            HEXADECIMAL                        DESCRIPTION
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
0                                  0x0                                JPEG image, total size: 297874 bytes
297874                             0x48B92                            ZIP archive, file count: 1, total size: 723 bytes
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Analyzed 1 file for 85 file signatures (187 magic patterns) in 3.0 milliseconds
```

Hasil:

```
JPEG image data
Zip archive data
```

Ini menunjukkan bahwa terdapat **file ZIP yang disisipkan di dalam JPEG**.

* * *

## 📦 Step 3 — Ekstraksi File

Ekstraksi dilakukan menggunakan `foremost`:

```bash
~/pscyh/misc/jindal
❯ foremost jindal.jpeg
Processing: jindal.jpeg
|foundat=Damn_U_got_Here.cppPK
foundat=hidden_image.jpegPK
*|
```

Ditemukan file ZIP yang kemudian diekstrak:

```bash
~/pscyh/misc/jindal/output/zip
❯ unzip 00000581.zip
Archive:  00000581.zip
 extracting: Damn_U_got_Here.cpp
 extracting: hidden_image.jpeg
```

Isi file:

-   `Damn_U_got_Here.cpp`
    
-   `hidden_image.jpeg`
    

* * *

## 🪤 Step 4 — Analisis File Kedua

File `hidden_image.jpeg` ternyata bukan gambar:

```bash
~/pscyh/misc/jindal/output/zip
❯ file hidden_image.jpeg
hidden_image.jpeg: Zip archive data, made by v2.0, extract using at least v2.0, last modified Mar 14 2026 20:49:12, uncompressed size 475, method=store
```

Output:

```
Zip archive data
```

File kemudian diubah menjadi `.zip` dan diekstrak:

```bash
~/pscyh/misc/jindal/output/zip
❯ cp hidden_image.jpeg hidden_image.zip
  unzip hidden_image.zip
Archive:  hidden_image.zip
 extracting: Damn_U_got_Here_flagged.cpp
```

Didapatkan:

-   `Damn_U_got_Here_flagged.cpp`
    

* * *

## 🎭 Step 5 — Misdirection

Isi file:

```cpp
~/pscyh/misc/jindal/output/zip
❯ cat Damn_U_got_Here_flagged.cpp
#include <iostream>

int main() {
    std::cout << "u successfully wasted your time in getting here" << std::endl;
    return 0;
}
```

Pesan ini adalah **troll / misdirection** untuk mengecoh peserta.

* * *

## 🔎 Step 6 — Analisis Lebih Lanjut

Dilakukan pengecekan dengan:

```bash
~/pscyh/misc/jindal/output/zip
❯ cat -A Damn_U_got_Here_flagged.cpp
#include <iostream>^M$
^M$
int main() {^M$
    std::cout << "u successfully wasted your time in getting here" << std::endl;^M$
    return 0;^M$
}^M$
 ^I^I^I     ^I^I^I  ^I^I ^I^I^I^I  ^I ^I^I   ^I^I ^I^I ^I    ^I^I^I^I ^I^I ^I^I^I ^I^I^I  ^I^I  ^I^I  ^I^I   ^I  ^I^I   ^I ^I ^I^I^I^I^I ^I^I  ^I    ^I^I     ^I^I ^I^I^I   ^I^I  ^I^I ^I ^I^I^I^I^I ^I^I^I  ^I^I ^I^I^I      ^I^I ^I   ^I^I   ^I^I  ^I^I  ^I^I ^I^I^I  ^I^I ^I ^I^I^I^I^I  ^I^I ^I   ^I^I^I  ^I   ^I^I  ^I^I ^I^I ^I^I^I   ^I^I ^I^I^I ^I ^I^I^I^I^I  ^I^I ^I   ^I^I ^I^I   ^I^I^I ^I^I^I  ^I^I ^I   ^I^I^I^I  ^I  ^I^I ^I ^I ^I ^I^I^I^I^I  ^I^I  ^I^I ^I^I ^I^I ^I ^I^I^I     ^I^I^I ^I   ^I^I^I^I  ^I ^I^I^I^I^I ^I^M$
```

Terlihat banyak karakter:

```
^I (tab)
```

di bagian akhir file.

Ini merupakan indikasi **Whitespace Steganography**.

* * *

## 🔐 Step 7 — Ekstraksi Whitespace

Ambil baris terakhir:

```bash
tail -n 1 Damn_U_got_Here_flagged.cpp | tr -d '\n' > ws.txt
```

Konversi ke binary:

```bash
~/pscyh/misc/jindal/output/zip
❯ cat ws.txt | tr '\t' '1' | tr ' ' '0'
0111000001110011011110010110001101101000011110110111011100110011001100010011000101011111011001000011000001101110001100110101111101110011011100000011010001100011001100110111001101011111001
```

* * *

## 🔄 Step 8 — Decode Binary ke ASCII

```bash
╭─   ~/pscyh/misc/jindal/output/zip ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  08:45:59
╰─❯ cat ws.txt | tr '\t' '1' | tr ' ' '0' | \
fold -w8 | \
while read b; do printf "\\x$(printf %x $((2#$b)))"; done
psych{w311_d0n3_sp4c3s_4r3n7_4lw4y5_3mpty%
```

* * *

## 💡 Insight

Whitespace sering dianggap tidak penting, tetapi dalam CTF dapat digunakan untuk menyimpan data tersembunyi.

> "Spaces aren't always empty."

* * *

## 🛠️ Tools yang Digunakan

-   exiftool
    
-   binwalk
    
-   foremost
    
-   strings
    
-   xxd
    
-   bash scripting
    

* * *

## 🚀 Pelajaran yang Didapat

-   Selalu cek **file di dalam file**
    
-   Jangan percaya output pertama (bisa jadi decoy)
    
-   Perhatikan hal kecil seperti **whitespace**
    
-   Gunakan kombinasi tools untuk analisis
