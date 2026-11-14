---
slug: "forensics-evaporated"
title: "Evaporated"
competition: "FGTE"
category: "Forensics"
difficulty: "Medium"
date: "2026-02-09"
updated: "2026-07-06"
summary: "🔚 Kesimpulan Challenge ini tidak hanya tentang forensik filesystem, tetapi juga: analisis struktur file pemahaman format PNG membedakan metadata vs data asli"
tags: ["FORENSIC","MEDIUM","DISK"]
status: "published"
flag: "NCLPS1{t4k_kus4ngkA_t3rny4Ta_fl4gny4_b3rsembuny1_09217b9c25}"
attachments: []
source: "https://claritys.web.id/writeups/forensics-evaporated"
---

# Evaporated

> 🔚 Kesimpulan Challenge ini tidak hanya tentang forensik filesystem, tetapi juga: analisis struktur file pemahaman format PNG membedakan metadata vs data asli

## 📝 Write-Up: Evaporated

(half slop)

## 📌 Deskripsi Singkat

Diberikan sebuah file `evaporated.zip` yang berisi:

-   `evaporated.001` (image forensik)
    
-   `evaporated.001.txt` (metadata dari FTK Imager)
    

Challenge ini mengarah pada analisis **digital forensics** untuk menemukan data tersembunyi.

* * *

## 🔍 Tahap 1 — Identifikasi File

Ekstrak file:

```bash
~/FGTE/foren/evaporated/forWU
❯ unzip evaporated.zip
Archive:  evaporated.zip
  inflating: evaporated.001
  inflating: evaporated.001.txt
```

Cek tipe file:

```bash
~/FGTE/foren/evaporated/forWU
❯ file evaporated.001
evaporated.001: DOS/MBR boot sector, code offset 0x52+2, OEM-ID "NTFS    ", sectors/cluster 8, Media descriptor 0xf8, sectors/track 63, heads 255, hidden sectors 498636800, dos < 4.0 BootSector (0x80), FAT (1Y bit by descriptor); NTFS, sectors/track 63, sectors 161791, $MFT start cluster 6741, $MFTMirror start cluster 2, bytes/RecordSegment 2^(-1*246), clusters/index block 1, serial number 0840cf29c0cf28886; contains bootstrap BOOTMGR
```

Hasil:

```
NTFS filesystem
```

📌 Ini menunjukkan bahwa file adalah **image NTFS** hasil akuisisi (FTK Imager).

* * *

## 🔍 Tahap 2 — Mount Image

Karena ini **logical image tanpa partition table**, mounting langsung:

```bash
mkdir chall
sudo ntfs-3g -o ro evaporated.001 chall
```

* * *

## 🔍 Tahap 3 — Eksplorasi File System

Kita cek isi filenya:  

```bash
~/FGTE/foren/evaporated/forWU
❯ ls chall/
drwxrwxrwx     - root 28 Aug  2025  $RECYCLE.BIN
drwxrwxrwx     - root 28 Aug  2025  'System Volume Information'
.rwxrwxrwx@ 1.3M root 24 Apr  2025  'Pertemuan 2 - dasar transmisi, gelombang elektromagnetik, kapasitas channel 2024.pdf'
.rwxrwxrwx  2.5M root 22 Aug  2025  RobloxScreenShot20250822_094618484.png
.rwxrwxrwx  2.7M root 22 Aug  2025  RobloxScreenShot20250822_094740606.png
.rwxrwxrwx  2.9M root 23 Aug  2025  RobloxScreenShot20250823_140554259.png
.rwxrwxrwx  3.2M root 23 Aug  2025  RobloxScreenShot20250823_152901122.png
.rwxrwxrwx  2.2M root 23 Aug  2025  RobloxScreenShot20250823_153246330.png
.rwxrwxrwx  1.8M root 24 Aug  2025  RobloxScreenShot20250824_152303314.png
.rwxrwxrwx  3.2M root 24 Aug  2025  RobloxScreenShot20250824_165340850.png
.rwxrwxrwx   41k root 23 Jul  2018  'Segoe UI Italic.ttf'
.rwxrwxrwx   11k root  8 Jun  2025  'sender gui.png'
.rwxrwxrwx@ 3.5M root 28 Apr  2025  'TrueCrypt Setup 7.1a.exe'
.rwxrwxrwx@ 2.3M root 12 Aug  2025  winbox64.exe
```

Aku udah cek RobloxScreenShot, tapi isinya malah muncak :'). Udah aku analisis tapi gak guna :D.

Aku cek Recycle Bin dulu aja karena sus daripada .exenya:

```bash
~/FGTE/foren/evaporated/forWU
❯ ls chall/\$RECYCLE.BIN/
drwxrwxrwx - root 28 Aug  2025  S-1-5-21-3056431194-2433350566-3139343528-1001

~/FGTE/foren/evaporated/forWU
❯ ls chall/\$RECYCLE.BIN/S-1-5-21-3056431194-2433350566-3139343528-1001/
.rwxrwxrwx   78 root 28 Aug  2025  $IE59JVC.png
.rwxrwxrwx 1.6M root 28 Aug  2025  $RE59JVC.png
.rwxrwxrwx  129 root 28 Aug  2025 󱁻 desktop.ini
```

Ditemukan:

```
$RE59JVC.png
$IE59JVC.png
```

📌 Struktur ini khas Windows:

-   `$Rxxxxx` → file asli
    
-   `$Ixxxxx` → metadata
    

* * *

## 🔍 Tahap 4 — Analisis Metadata

Cek `$I` file:

```bash
~/FGTE/foren/evaporated/forWU/chall/$RECYCLE.BIN/S-1-5-21-3056431194-2433350566-3139343528-1001
❯ xxd \$IE59JVC.png
00000000: 0200 0000 0000 0000 1f09 1900 0000 0000  ................
00000010: 40fa 27f4 7717 dc01 1900 0000 4500 3a00  @.'.w.......E.:.
00000020: 5c00 6c00 6f00 6700 6f00 2000 6e00 6f00  \.l.o.g.o. .n.o.
00000030: 6300 7400 7200 6100 2000 6c00 7500 7000  c.t.r.a. .l.u.p.
00000040: 7200 6100 2e00 7000 6e00 6700 0000       r.a...p.n.g...
```

Terlihat string UTF-16:

```
E:\logo noctra lupra.png
```

📌 Artinya:

-   File asli bernama **logo noctra lupra.png**
    
-   Telah dihapus (masuk Recycle Bin)
    

* * *

## 🔍 Tahap 5 — Analisis File PNG

Cek file utama:

```bash

~/FGTE/foren/evaporated/forWU/chall/$RECYCLE.BIN/S-1-5-21-3056431194-2433350566-3139343528-1001
❯ file \$RE59JVC.png
$RE59JVC.png: data
```

Tidak dikenali sebagai PNG normal.

Cek hex:

```bash
~/FGTE/foren/evaporated/forWU/chall/$RECYCLE.BIN/S-1-5-21-3056431194-2433350566-3139343528-1001
❯ xxd \$RE59JVC.png | head
00000000: 8950 4441 0d0a 1a0a 0000 000d 4e43 4c50  .PDA........NCLP
00000010: 0000 0400 0000 039a 0806 0000 0006 4720  ..............G
00000020: 2800 0000 0970 4859 7300 000e c400 000e  (....pHYs.......
00000030: c401 952b 0e1b 0000 04b1 6954 5874 584d  ...+......iTXtXM
00000040: 4c3a 636f 6d2e 6164 6f62 652e 786d 7000  L:com.adobe.xmp.
00000050: 0000 0000 3c3f 7870 6163 6b65 7420 6265  ....<?xpacket be
00000060: 6769 6e3d 27ef bbbf 2720 6964 3d27 5735  gin='...' id='W5
00000070: 4d30 4d70 4365 6869 487a 7265 537a 4e54  M0MpCehiHzreSzNT
00000080: 637a 6b63 3964 273f 3e0a 3c78 3a78 6d70  czkc9d'?>.<x:xmp
00000090: 6d65 7461 2078 6d6c 6e73 3a78 3d27 6164  meta xmlns:x='ad
```

Sudah keliatan jelas lah ya itu salahnya di mana :v.

Header:

```
89 50 44 41  → SALAH
```

Seharusnya:

```
89 50 4E 47  → PNG
```

📌 Kesimpulan:

> Header PNG telah dimodifikasi (obfuscation)

* * *

## 🔧 Tahap 6 — Perbaikan Header PNG

Kita bisa liat di website [ini](https://en.wikipedia.org/wiki/List_of_file_signatures): [https://en.wikipedia.org/wiki/List\_of\_file\_signatures](https://en.wikipedia.org/wiki/List_of_file_signatures)

Perbaiki signature:

```bash
~/FGTE/foren/evaporated/forWU
❯ printf '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A' | dd of=test.png bs=1 seek=0 count=8 conv=notrunc
8+0 records in
8+0 records out
8 bytes copied, 8.444e-05 s, 94.7 kB/s
```

Perbaiki chunk:

```bash
╭─   ~/FGTE/foren/evaporated/forWU ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  08:01:40
╰─❯ printf 'IHDR' | dd of=test.png bs=1 seek=12 count=4 conv=notrunc
4+0 records in
4+0 records out
4 bytes copied, 6.628e-05 s, 60.4 kB/s
```

Validasi:

```bash
╭─   ~/FGTE/foren/evaporated/forWU ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  08:01:48
╰─❯ pngcheck -v test.png
File: test.png (1640735 bytes)
  chunk IHDR at offset 0x0000c, length 13
    1024 x 922 image, 32-bit RGB+alpha, non-interlaced
  chunk pHYs at offset 0x00025, length 9: 3780x3780 pixels/meter (96 dpi)
  chunk iTXt at offset 0x0003a, length 1201, keyword: XML:com.adobe.xmp
    uncompressed, no language tag
    no translated keyword, 1180 bytes of UTF-8 text
  chunk IDAT at offset 0x004f7, length 1639444
    zlib: deflated, 32K window, default compression
  chunk IEND at offset 0x190917, length 0
No errors detected in test.png (5 chunks, 56.6% compression).
```

Hasil: PNG valid. Ini saya pakai printf aja biar sekalian bisa memahami 'dd'. Atau liat aja perbedaannya (gak bisa ngasih garis bawah):

![](/assets/uploads/writeup-inline-f4908d70-1e53-44a6-a034-0079ad282694.png)

![](/assets/uploads/writeup-inline-977a2f52-b927-41a2-a0de-04bddb285c54.png)

* * *

## 🔍 Tahap 7 — Deteksi Anomali

Saat dianalisis:

```
convert fixed.png → warning: IDAT too much image data
```

📌 Ini indikasi penting:

> Data gambar lebih banyak dari yang didefinisikan oleh IHDR

* * *

## 🧠 Tahap 8 — Analisis Raw Pixel

Ekstrak IDAT saya meminta AI untuk membuat codenya biar makin enak:

```python
╭─   ~/FGTE/foren/evaporated/forWU ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  1m 4s  kali  08:07:41
╰─❯ python3
Python 3.13.11 (main, Dec  8 2025, 11:43:54) [GCC 15.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import struct, zlib
...
... data = open("test.png","rb").read()
... pos = 8
... idat = b""
...
... while pos < len(data):
...     length = struct.unpack(">I", data[pos:pos+4])[0]
...     ctype = data[pos+4:pos+8]
...     chunk = data[pos+8:pos+8+length]
...
...     if ctype == b'IDAT':
...         idat += chunk
...import struct, zlib

data = open("fixed.png","rb").read()
pos = 8
idat = b""

while pos < len(data):
    length = struct.unpack(">I", data[pos:pos+4])[0]
    ctype = data[pos+4:pos+8]
    chunk = data[pos+8:pos+8+length]

    if ctype == b'IDAT':
        idat += chunk

    pos += 12 + length

raw = zlib.decompress(idat)
print(len(raw))

...     pos += 12 + length
...
... raw = zlib.decompress(idat)
... print(len(raw))
...
4195328
```

Hasil:

```
4195328 bytes
```

* * *

## 🧮 Tahap 9 — Hitung Baris Sebenarnya

Per baris:

```
1 (filter) + 1024 × 4 = 4097 byte
```

Total baris:

```
4195328 / 4097 ≈ 1024 baris
```

Sedangkan IHDR:

```
height = 922
```

📌 Artinya:

> Ada **102 baris tersembunyi**

* * *

## 🎯 Tahap 10 — Hex Editing

Cara lebih cepat tanpa Python:

### Ubah IHDR height

Dari:

```
00 00 03 9A  (922)
```

Menjadi:

```
00 00 04 00  (1024)
```

### Perbaiki CRC

![](/assets/uploads/writeup-inline-07846031-7d34-4dc7-9a40-db283d202c84.png)

[https://www.nayuki.io/page/png-file-chunk-inspector](https://www.nayuki.io/page/png-file-chunk-inspector) Saya pakai website ini biar aman sejahtera

Gunakan CRC baru:

```
7F 1D 2B 83
```

Saya gantinya pakai versi web aja biar enak ([https://hexed.it/](https://hexed.it/)):

Dari ini:

![](/assets/uploads/writeup-inline-34bab926-6f59-4d79-9d11-cceaeb5421e5.png)

Menjadi:

![](/assets/uploads/writeup-inline-4f139c3e-6f57-4770-9b9a-e537c935f7d1.png)

Validasi:

```bash
╭─   ~/FGTE/foren/evaporated/forWU ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  08:33:07
╰─❯ pngcheck -v test.png
File: test.png (1640735 bytes)
  chunk IHDR at offset 0x0000c, length 13
    1024 x 1024 image, 32-bit RGB+alpha, non-interlaced
  chunk pHYs at offset 0x00025, length 9: 3780x3780 pixels/meter (96 dpi)
  chunk iTXt at offset 0x0003a, length 1201, keyword: XML:com.adobe.xmp
    uncompressed, no language tag
    no translated keyword, 1180 bytes of UTF-8 text
  chunk IDAT at offset 0x004f7, length 1639444
    zlib: deflated, 32K window, default compression
  chunk IEND at offset 0x190917, length 0
No errors detected in test.png (5 chunks, 60.9% compression).
```

* * *

## 🖼️ Tahap 11 — Hasil Akhir

Setelah height diperbaiki:

-   Gambar terbuka normal
    
-   Bagian bawah muncul
    
-   Flag terlihat jelas
    

* * *

## 🏁 Flag

![](/assets/uploads/writeup-inline-8c26982d-4801-427c-804e-9346c2d0c83b.png)

* * *

## 🧠 Insight / Pembelajaran

-   PNG **mempercayai IHDR**, bukan jumlah data IDAT
    
-   Data bisa disembunyikan di luar batas height
    
-   Warning seperti:
    
    ```
    IDAT: too much image data
    ```
    
    adalah **indikasi penting**
    

📌 Teknik ini dikenal sebagai:

> **PNG Hidden Rows / Height Mismatch**
