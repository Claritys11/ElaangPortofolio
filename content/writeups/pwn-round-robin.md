---
slug: "pwn-round-robin"
title: "Round Robin"
competition: "SCTF 2026"
category: "Pwn"
difficulty: "Medium"
date: "2026-07-04"
updated: "2026-07-06"
summary: "Deskripsi: Seorang SysAdmin pemula di perusahaan rintisan mencoba memamerkan kejeniusannya dengan merancang sistem penjadwalan OS (Scheduler) kustom dari nol. Dia sesumbar bahwa pembagian kerjanya sempurna dan mustahil disusupi. Buktikan bahwa dia salah. Eksploitasi antrean prosesnya, ambil alih kendali tertinggi, dan jadilah raja di sistem itu!\\n\\nnc 103.127.98.249 5003"
tags: ["PWN","MEDIUM","GOT OVERWRITE"]
status: "published"
flag: "SCTF26{r0und_r0b1n_scheduler_n1ghtm4re_72918403a}"
attachments: [{"url":"/assets/uploads/788c0054-2f0c-4e0e-a0e3-1273cc785ba2-round_robin.zip","name":"round_robin.zip","contentType":"application/octet-stream"}]
source: "https://claritys.web.id/writeups/pwn-round-robin"
---

# Round Robin

> Deskripsi: Seorang SysAdmin pemula di perusahaan rintisan mencoba memamerkan kejeniusannya dengan merancang sistem penjadwalan OS (Scheduler) kustom dari nol. Dia sesumbar bahwa pembagian kerjanya sempurna dan mustahil disusupi. Buktikan bahwa dia salah. Eksploitasi antrean prosesnya, ambil alih kendali tertinggi, dan jadilah raja di sistem itu!\n\nnc 103.127.98.249 5003

Link AI:  
[https://chatgpt.com/share/6a4790ab-aa04-83ec-993a-685400edbec4](https://chatgpt.com/share/6a4790ab-aa04-83ec-993a-685400edbec4)

Aku mulai dari checksec:

```
checksec file chall
```

Hasil:

```bash

~/ctf/sctf/pwnrobin
❯ checksec chall
[*] '/home/claritys/ctf/sctf/pwnrobin/chall'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
```

Ini lumayan ngasih arah. Karena `Partial RELRO`, GOT masih writable. Karena `PIE disabled`, alamat fungsi di binary stabil, tidak random. Jadi kalau ada bug arbitrary write atau out-of-bounds write, target enak banget: overwrite GOT ke fungsi win.

Di sini aku belum langsung yakin ada GOT overwrite. Tapi kombinasi `Partial RELRO + No PIE` bikin aku kepikiran: "kalau ada write primitive, ini bisa jadi gampang."

Ketemu fungsi di `0x401399` hasil dari decompile (GHIDRA) :

```
void FUN_00401399(void)

{
  puts("\n[!!!] ANOMALI DITERIMA. SYSTEM OVERRIDE SUCCESS.");
  system("cat flag.txt");
                    // WARNING: Subroutine does not return
  exit(0);
}
```

Fungsi ini nge-print pesan anomaly, lalu menjalankan:

```
cat flag.txt
```

Jadi asumsi berikutnya: `0x401399` adalah win function.

Kenapa yakin? Karena fungsi ini:

1.  Tidak dipanggil dari menu normal.
    

2.  Memanggil `system("cat flag.txt")`.
    

Itu udah cukup kuat buat jadi target exploit nanti.

Karena aku gak tau lanjutannya gimana, alhasil aku tanya bro ChatGPT biar ngebantu. Turns out, ternyata aku salah kasih hasil decompilenya.. tapi aku ngasih objdumpnya 🥹

Tapi ya ternyata bugnya itu ada di address 401291 (IDA):

```
int sub_401291()
{
  int v1; // [rsp+Ch] [rbp-4h] BYREF

  printf("Pilih index proses (0-9) untuk di-edit: ");
  __isoc23_scanf("%d", &v1);
  printf("Set New Burst Time (long long): ");
  __isoc23_scanf("%lld", (char *)&unk_4040A0 + 24 * v1 + 8);
  printf("Set Status (0=Wait, 1=Finished): ");
  __isoc23_scanf("%d", (char *)&unk_4040A0 + 24 * v1 + 16);
  re
```

Karena dia ini tidak dicek, jadinya bisa pakai index negatif biar bisa ngeoverwrite ke GOT.

![](/assets/uploads/48985555-4b52-44cf-b821-aff0f3126777-image-21.png)

Yang di mana, 4199321 itu adalah decimal dari address win.

```
>>> hex(4199321)
'0x401399'
```
