---
slug: "forensics-ghost-typist"
title: "Ghost Typist"
competition: "FGTE 0"
category: "Forensics"
difficulty: "Medium"
date: "2026-03-07"
updated: "2026-07-06"
summary: "🧩 Summary Flow Git commit → ghost.log (keylogger) → recover password → decrypt ghost.enc → dapat file octal → decode → env dump → ambil FLAG"
tags: ["MISC","MEDIUM","FIRST BLOOD"]
status: "published"
flag: "FGTE0{Gh0st_C0m1ts_K3yL0g5_4nd_3nv_Dump5}"
attachments: []
source: "https://claritys.web.id/writeups/forensics-ghost-typist"
---

# Ghost Typist

> 🧩 Summary Flow Git commit → ghost.log (keylogger)            → recover password            → decrypt ghost.enc            → dapat file octal            → decode → env dump            → ambil FLAG

## 🧠 Write-Up CTF – Ghost Commits & Keylogger Leak

(3/4 slop)

## 📜 Deskripsi Soal

Seorang developer tidak sengaja melakukan commit file sensitif ke GitHub, lalu menghapusnya dengan **force push**. Namun ternyata commit tersebut masih bisa diakses menggunakan **partial hash** `45`.

Petunjuk tambahan:

> “Sepertinya ada sesuatu yang berkaitan dengan aktivitas keyboard di commit tersebut.”

* * *

## 🔍 Step 1 – Mengakses Commit yang Terhapus

Walaupun sudah di-_force push_, commit masih bisa diakses dengan partial hash:

```
https://github.com/ariafatah999/ghosts/commit/45252d455310384010a5b43585bde42ab5d2ab4d
```

Dari commit tersebut, ditemukan 2 file penting:

-   `ghost.enc` → file terenkripsi (OpenSSL)
    
-   `ghost.log` → file binary (mencurigakan seperti log)
    

* * *

## 🔐 Step 2 – Identifikasi File Enkripsi

Cek tipe file:

```bash
~/FGTE/FGTE0/misc/ghost
❯ file ghost.enc
ghost.enc: openssl enc'd data with salted password
```

Output:

```
openssl enc'd data with salted password
```

Artinya file ini dienkripsi menggunakan **OpenSSL**.

* * *

## ⌨️ Step 3 – Analisis `ghost.log` (Keylogger)

Cek isi:

```bash
╭─   ~/FGTE/FGTE0/misc/ghost ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  37m 37s  kali  09:34:20
╰─❯ xxd ghost.log | head

00000000: 52f2 aa69 0000 0000 0000 0000 0000 0000  R..i............
00000010: 0100 2600 0100 0000 52f2 aa69 0000 0000  ..&.....R..i....
00000020: 0000 0000 0000 0000 0100 2600 0000 0000  ..........&.....
00000030: 52f2 aa69 0000 0000 0000 0000 0000 0000  R..i............
00000040: 0100 1f00 0100 0000 52f2 aa69 0000 0000  ........R..i....
00000050: 0000 0000 0000 0000 0100 1f00 0000 0000  ................
00000060: 52f2 aa69 0000 0000 0000 0000 0000 0000  R..i............
00000070: 0100 1c00 0100 0000 52f2 aa69 0000 0000  ........R..i....
00000080: 0000 0000 0000 0000 0100 1c00 0000 0000  ................
00000090: 52f2 aa69 0000 0000 0000 0000 0000 0000  R..i............

╭─  
```

Terlihat pola berulang seperti:

```
0100 XX 00 0100 ...
```

Ini sangat mirip dengan:  
➡️ **event input keyboard (key press / release)**

Apalagi, deskripsi soalnya ada bagian "Sepertinya ada sesuatu yang berkaitan dengan aktivitas keyboard di commit tersebut. Bisakah kamu menemukan apa yang bocor?"

Saya langsung tancap gas.

* * *

## 🧩 Step 4 – Decode Keylogger

Gunakan mapping keycode Linux:

```python
data=open("ghost.log","rb").read()

keymap={
16:'q',17:'w',18:'e',19:'r',20:'t',21:'y',22:'u',23:'i',24:'o',25:'p',
30:'a',31:'s',32:'d',33:'f',34:'g',35:'h',36:'j',37:'k',38:'l',
44:'z',45:'x',46:'c',47:'v',48:'b',49:'n',50:'m',
28:'\n',57:' '
}

keys=[]

for i in range(len(data)):
    if data[i:i+2]==b'\x01\x00':
        code=data[i+2]
        val=data[i+4]
        if val==1:  # key press
            keys.append(keymap.get(code,f"[{code}]"))

print("".join(keys))
```

Output:

```
╭─   ~/FGTE/FGTE0/misc/ghost ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  09:35:41
╰─❯ python3
Python 3.13.11 (main, Dec  8 2025, 11:43:54) [GCC 15.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> data=open("ghost.log","rb").read()
...
... keymap={
... 16:'q',17:'w',18:'e',19:'r',20:'t',21:'y',22:'u',23:'i',24:'o',25:'p',
... 30:'a',31:'s',32:'d',33:'f',34:'g',35:'h',36:'j',37:'k',38:'l',
... 44:'z',45:'x',46:'c',47:'v',48:'b',49:'n',50:'m',
... 28:'\n',57:' '
... }
...
... keys=[]
...
... for i in range(len(data)):
...     if data[i:i+2]==b'\x01\x00':
...         code=data[i+2]
...         val=data[i+4]
...         if val==1:  # key press
...             keys.append(keymap.get(code,f"[{code}]"))
...
... print("".join(keys))
...
ls
whoami
env [42][52] env[42][12]dump[52]txt
od env[42][12]dump[52]txt [42][52] ghost
openssl enc [12]aes[12][3][6][7][12]cbc [12]salt [12]pass pass[42][39][5][42][12][42]gh[11]st[42][12][42]typ[2]st[42][12][42]m[4][42][12][7][10] [12]in ghost [12]out ghost[52]enc

Setelah dirapikan:
ls
whoami
env > env_dump.txt
od env_dump.txt > ghost
openssl enc -aes-256-cbc -salt -pass pass:4_Gh0st_Typ1st_M3_69 ...
```

🔥 Dari sini didapat password asli:

```
4_Gh0st_Typ1st_M3_69
```

* * *

## 🔓 Step 5 – Decrypt File

```bash

╭─   ~/FGTE/FGTE0/misc/ghost ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  2m 6s  kali  09:39:07
╰─❯ openssl enc -d -aes-256-cbc -in ghost.enc -out ghost -pass pass:4_Gh0st_Typ1st_M3_69

*** WARNING : deprecated key derivation used.
Using -iter or -pbkdf2 would be better.
```

Hasil:

```
╭─   ~/FGTE/FGTE0/misc/ghost ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  09:39:08
╰─❯ file ghost
ghost: ASCII text
```

* * *

## 🔢 Step 6 – Decode File `ghost`

Isi file berupa output:

```bash
od env_dump.txt
```

Formatnya:  
➡️ **6 digit octal = 16-bit word**

* * *

## 🧪 Step 7 – Convert Octal ke ASCII

Gunakan Python:

```python
import re

data = open("ghost").read()
nums = re.findall(r'[0-7]{6}', data)

out = bytearray()

for n in nums:
    v = int(n, 8)
    out += v.to_bytes(2, "little")  # penting: little endian

clean = bytearray(b for b in out if 32 <= b <= 126 or b in (10,9))

open("env_real_fixed.txt","wb").write(clean)
```

* * *

## 📂 Step 8 – Analisis Environment Dump

```bash
╭─   ~/FGTE/FGTE0/misc/ghost ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  6s  kali  09:40:27
╰─❯ cat env_real_fixed.txt
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HOME=/home/de
v
USER=dev
LOGNAME=dev
SHELL=/bin/bash
PWD=/home/dev/project
LANG=en_US.UTF-8
TERM=xterm-256color
EDITOR=vim
DB_HOST=localhost
DB_PORT=5432
DB_USER=dev_app
DB_PASS=s upersecretpasswo"rd
AWS_ACCESS_K$EY_ID=AKIAIOSFOD&NN7EXAMPLE
AWS_(SECRET_ACCESS_KE*Y=wJalrXUtnFEMI/,K7MDENG/bPxRfiCY.EXAMPLEKEY
API_0KEY_INTERNAL=dev2_internal_api_1243
SESSION_SECRE6T=prod_session_s8ecret
FLAG=FGTE:0{Gh0st_C0m1ts_K<3yL0g5_4nd_3nv_D>ump5}
NODE_ENV=@production
PYTHBONPATH=/usr/lib/Dpython3
SSH_CLIFENT=192.168.1.50H 54232 22
SSH_CJONNECTION=192.16L8.1.50 54232 192N.168.1.10 22
O%
```

Hasil:

```
PATH=/usr/local/sbin:...
USER=dev
DB_PASS=supersecretpassword
AWS_ACCESS_KEY_ID=...
SESSION_SECRET=...
FLAG=FGTE0{Gh0st_C0m1ts_K3yL0g5_4nd_3nv_Dump5}🏁 Final Flag

FGTE0{Gh0st_C0m1ts_K3yL0g5_4nd_3nv_Dump5}
```

* * *

## 🧠 Insight & Pelajaran

### 🔥 1. Force Push ≠ Aman

Commit yang sudah dihapus masih bisa diakses via hash.

### ⌨️ 2. Keylogger Forensics

Log keyboard bisa digunakan untuk:

-   Recover password
    
-   Melihat aktivitas user
    

### 🔐 3. OpenSSL Weakness

Jika password bocor → enkripsi jadi tidak berguna.

### 🧾 4. Data Encoding Layered

Challenge ini punya banyak layer:

1.  Git leak
    
2.  Keylogger
    
3.  Encryption
    
4.  Octal encoding
