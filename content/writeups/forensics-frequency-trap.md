---
slug: "forensics-frequency-trap"
title: "Frequency Trap"
competition: "TraceBash CTF"
category: "Forensics"
difficulty: "Medium"
date: "2026-06-26"
updated: "2026-06-29"
summary: "Challenge ini ngasih file PNG bernama frequency_trap.png. Dari tampilannya sih cuma gambar biasa, tapi metadata-nya langsung ngasih clue kalau ada steganography di domain frekuensi: Image Description : Method: YCbCr_DCT_8x8_coeff3x3 Jadi intinya: ambil password dari EXIF, ubah gambar ke YCbCr, pecah per blok 8×8, lalu cek tanda (positif/negatif) dari koefisien DCT. Ada jebakan kecil juga: satu koefisien ngasih flag yang kelihatan valid, tapi ternyata decoy."
tags: ["FORENSIC","DCT","EASY-MEDIUM"]
status: "published"
flag: "TBCTF{frequency_trap_successful}"
attachments: []
source: "https://claritys.web.id/writeups/forensics-frequency-trap"
---

# Frequency Trap

> Challenge ini ngasih file PNG bernama frequency_trap.png. Dari tampilannya sih cuma gambar biasa, tapi metadata-nya langsung ngasih clue kalau ada steganography di domain frekuensi: Image Description : Method: YCbCr_DCT_8x8_coeff3x3 Jadi intinya: ambil password dari EXIF, ubah gambar ke YCbCr, pecah per blok 8×8, lalu cek tanda (positif/negatif) dari koefisien DCT. Ada jebakan kecil juga: satu koefisien ngasih flag yang kelihatan valid, tapi ternyata decoy.

## **Frequency Trap**

![](/assets/uploads/writeup-inline-24f77616-ee44-42b7-8129-cd2587219b98.png)

## **Triage awal dan bukti**

Hash file yang dianalisis:

```text
eccf044f99586cb881f566d33dd34b84c50b79f3ad470473b08491e3d90f5071  frequency_trap.png
```

Mulai dari cek file dan metadata dulu:

```bash
file frequency_trap.png
exiftool frequency_trap.png
```

Bagian output yang penting:

```text

~/ctf/tracebash/forne
vol3 ❯ file frequency_trap.png                                                                                                                                                   󰥔 17:51:21
frequency_trap.png: PNG image data, 2500 x 1996, 8-bit/color RGB, non-interlaced

~/ctf/tracebash/forne
vol3 ❯ exiftool frequency_trap.png                                                                                                                                               󰥔 17:53:11
ExifTool Version Number         : 13.55
File Name                       : frequency_trap.png
Directory                       : .
File Size                       : 1169 kB
File Modification Date/Time     : 2026:06:23 22:36:32+07:00
File Access Date/Time           : 2026:06:25 15:28:19+07:00
File Inode Change Date/Time     : 2026:06:26 17:25:25+07:00
File Permissions                : -rw-rw-rw-
File Type                       : PNG
File Type Extension             : png
MIME Type                       : image/png
Image Width                     : 2500
Image Height                    : 1996
Bit Depth                       : 8
Color Type                      : RGB
Compression                     : Deflate/Inflate
Filter                          : Adaptive
Interlace                       : Noninterlaced
Exif Byte Order                 : Big-endian (Motorola, MM)
Image Description               : Method: YCbCr_DCT_8x8_coeff3x3
Lens Model                      : ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++.++++++++++++.-------------.++++++++++++.++++.----------------.+++++++++.-----------.++++++++++++++++++++++.---------.---------------.++++++++++++++++++..
Image Size                      : 2500x1996
Megapixels                      : 5.0
```

Dari `Image Description`, kita dapat roadmap-nya:

1.  convert gambar ke **YCbCr**;
    
2.  bagi jadi blok **8×8**;
    
3.  hitung **2D DCT** untuk tiap blok;
    
4.  ambil data dari koefisien DCT, bukan dari pixel yang kelihatan.
    

Ukuran gambarnya 2500×1996. Jadi jumlah blok 8×8 yang utuh adalah `floor(1996 / 8) × floor(2500 / 8) = 249 × 312 = 77.688` blok. Sisa pixel yang tidak cukup membentuk blok 8×8 tinggal di-skip saja.

## **Ambil key dari EXIF**

`Lens Model` jelas bukan nama lensa. Isinya cuma karakter Brainfuck seperti `+`, `-`, dan `.`. Kalau dijalankan sebagai Brainfuck, kita langsung cek di [Brainfuck Language - Online Decoder, Translator, Interpreter](https://www.dcode.fr/brainfuck-language) hasilnya:

```text
frequencypass
```

![](/assets/uploads/writeup-inline-b817def9-612a-42c0-90f9-53a7bf94763e.png)

Nah, ini adalah key untuk repeating XOR nanti.

## **Ekstraksi DCT**

Untuk setiap blok 8×8 yang utuh di channel **Y** (luminance):

1.  kurangi semua nilai pixel dengan 128 supaya terpusat di nol;
    
2.  hitung normalized 2D DCT;
    
3.  ambil tanda koefisien **AC(3,3)**;
    
4.  positif jadi bit `1`, negatif atau nol jadi bit `0`;
    
5.  baca blok dari kiri ke kanan, lalu atas ke bawah;
    
6.  gabungkan tiap delapan bit menjadi satu byte, MSB dulu;
    
7.  XOR hasil byte dengan key berulang `frequencypass`.
    

Catatan kecil tapi penting: indexing Python itu mulai dari nol. Jadi `dct_block[3, 3]` artinya baris keempat dan kolom keempat dari matriks DCT 8×8.

## **Kenapa flag pertama salah?**

Awalnya, kalau memakai koefisien `AC(1,1)`, mapping kebalik (`positif → 0`, `negatif → 1`), lalu di-XOR dengan key yang sama, hasilnya:

```text

# sebelumnya, decoy:
ac_11 = dct_block[1, 1]
bits.append(0 if ac_11 > 0 else 1)

# seharusnya, valid:
ac_33 = dct_block[3, 3]
bits.append(1 if ac_33 > 0 else 0)

# hasil decoy: TBCTF{gRequency_trap_successful}
```

Kelihatannya meyakinkan banget, kan? Tapi flag ini memang jebakan. Huruf `R` besar di `gRequency` bukan typo random; itu petunjuk kalau kita belum ada di stream yang benar. Submit flag ini juga ditolak.

Clue `coeff3x3` mengarah ke koefisien `(3,3)`. Dengan posisi itu dan polaritas yang benar (`positif → 1`), hasilnya bersih: `frequency` semuanya huruf kecil. Jadi ya, jangan ketipu flag cakep yang terlalu cepat muncul.

## **Solver**

Bagian inti ekstraksinya:

```python
img = cv2.imread("frequency_trap.png")
y_channel = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)[:, :, 0]

bits = []
for row in range(y_channel.shape[0] // 8):
    for col in range(y_channel.shape[1] // 8):
        block = y_channel[row * 8:(row + 1) * 8,
                          col * 8:(col + 1) * 8].astype(float) - 128.0
        coeffs = dct(dct(block.T, norm="ortho").T, norm="ortho")
        bits.append(1 if coeffs[3, 3] > 0 else 0)

data = bytearray(
    sum(bit << (7 - offset) for offset, bit in enumerate(bits[index:index + 8]))
    for index in range(0, len(bits) - len(bits) % 8, 8)
)

key = b"frequencypass"
plaintext = bytes(value ^ key[index % len(key)] for index, value in enumerate(data))
print(plaintext.split(b"}", 1)[0].decode() + "}")
```

## **Verifikasi**

Saat script dijalankan, output-nya:

```text
[+] Decrypted Flag Found:
TBCTF{frequency_trap_successful}
```

![](/assets/uploads/writeup-inline-a6926340-9886-4f18-90c5-ebef233b00b9.png)
