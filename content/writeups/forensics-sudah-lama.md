---
slug: "forensics-sudah-lama"
title: "Sudah lama"
competition: "BeeCTF 2026"
category: "Forensics"
difficulty: "Medium"
date: "2026-08-22"
updated: "2026-08-24"
summary: "Sudah lama tidak ketemu soal seperti ini, semoga memperbanyak ilmu kalian, cemungut BeeCTF. Author: wavess"
tags: ["FORENSIC","MEDIUM","USB","PCAP"]
status: "published"
flag: "BeeCTF{sud4h_l4ma_t1dak_bu4t_s0al_s3p3rti_1ni}"
attachments: []
source: "https://claritys.web.id/writeups/forensics-sudah-lama"
---

# Sudah lama

> Sudah lama tidak ketemu soal seperti ini, semoga memperbanyak ilmu kalian, cemungut BeeCTF. Author: wavess

![](/assets/uploads/08d4fafb-72b2-4f39-a6a5-0655133aed27-screenshot_2026-08-24_13-00-19.png)

* * *

Jadi kita diberikan file capture.pcap, ketika kita buka file tersebut di wireshark isinya hanya protocol USB.

![](/assets/uploads/6064dadb-2e28-4bfe-b25f-49b857817f80-image.png)Nah ketika aku searching itu rata rata challengenya pada **USB HID keyboard**, seperti writeups yang kutemui di internet.

![](/assets/uploads/70e39a2e-e4eb-4a3f-b00e-24786d3a8cc7-image-1.png)[https://infosecwriteups.com/keystroke-forensics-101-extracting-secrets-from-usb-traffic-7fdd4797d1a9](https://infosecwriteups.com/keystroke-forensics-101-extracting-secrets-from-usb-traffic-7fdd4797d1a9)

[https://res260.medium.com/usb-pcap-forensics-graphics-tablet-nsec-ctf-2021-writeup-part-2-3-9c6265ca4c40](https://res260.medium.com/usb-pcap-forensics-graphics-tablet-nsec-ctf-2021-writeup-part-2-3-9c6265ca4c40)

Nah, pas aku liat di packet kita ternyata di leftover capture data yang buat USB HID keyboard ini, jadi aku tinggal search cari cara bagaimana cara export packetnya.

Dan aku nemu caranya seperti ini

```
tshark -r capture.pcap -Y "usb.capdata" -T fields -e usb.capdata
```

Nanti outputnya seperti ini

```bash
~/ctf/beectf/foren/sudahlama
❯ tshark -r capture.pcap -Y "usb.capdata" -T fields -e usb.capdata               󰥔 09:37:18
0200050000000000
0000000000000000
0000080000000000
0000000000000000
0000080000000000
0000000000000000
0200060000000000
0000000000000000
0200170000000000
0000000000000000
0200090000000000
0000000000000000
02002f0000000000
0000000000000000
0000160000000000
0000000000000000
0000180000000000
0000000000000000
0000070000000000
0000000000000000
0000210000000000
0000000000000000
00000b0000000000
0000000000000000
02002d0000000000
0000000000000000
00000f0000000000
0000000000000000
0000210000000000
0000000000000000
0000100000000000
0000000000000000
0000040000000000
0000000000000000
02002d0000000000
0000000000000000
0000170000000000
0000000000000000
00001e0000000000
0000000000000000
0000070000000000
0000000000000000
0000040000000000
0000000000000000
00000e0000000000
0000000000000000
02002d0000000000
0000000000000000
0000050000000000
0000000000000000
0000180000000000
0000000000000000
0000210000000000
0000000000000000
0000170000000000
0000000000000000
02002d0000000000
0000000000000000
0000160000000000
0000000000000000
0000270000000000
0000000000000000
0000040000000000
0000000000000000
00000f0000000000
0000000000000000
02002d0000000000
0000000000000000
0000160000000000
0000000000000000
0000200000000000
0000000000000000
0000130000000000
0000000000000000
0000200000000000
0000000000000000
0000150000000000
0000000000000000
0000170000000000
0000000000000000
00000c0000000000
0000000000000000
02002d0000000000
0000000000000000
00001e0000000000
0000000000000000
0000110000000000
0000000000000000
00000c0000000000
0000000000000000
0200300000000000
0000000000000000
```

Nah aku tinggal cari cara buat decode deh, terus searching dan nemu writeup ini

![](/assets/uploads/324a3b3d-30c2-4e8e-9496-b656b2c56447-image-2.png) [https://medium.com/@\_\_sudocoder\_\_/the-few-chosen-ctf-write-up-19dbb3ca8e50](https://medium.com/@__sudocoder__/the-few-chosen-ctf-write-up-19dbb3ca8e50)

Dikarenakan aku ngga nemu caranya untuk ngedecode itu dicyberchef ternyata harus pake script. Aku ambil solver dari dia sebagai dasar.

![](/assets/uploads/9f553bdf-2a0b-4a5f-86b6-612f930eeb06-image-3.png)Cuman karena sebelumnya aku udah cari cara biar ngambil si USB HID keyboard itunya aja, `0` nya hilang dicyberchef. Jadi aku langsung ambil solvernya aja dari writeup tersebut terus aku sesuaikan.

![](/assets/uploads/7e8dedad-73d5-4e0a-a9a6-830105b08c60-image-4.png)Solver:

```
newmap = {
2: "PostFail",
4: 'a',
5: 'b',
6: 'c',
7: 'd',
8: 'e',
9: 'f',
10: 'g',
11: 'h',
12: 'i',
13: 'j',
14: 'k',
15: 'l',
16: 'm',
17: 'n',
18: 'o',
19: 'p',
20: 'q',
21: 'r',
22: 's',
23: 't',
24: 'u',
25: 'v',
26: 'w',
27: 'x',
28: 'y',
29: 'z',
30: '1',
31: '2',
32: '3',
33: '4',
34: '5',
35: '6',
36: '7',
37: '8',
38: '9',
39: '0',
40: 'Enter',
41: 'esc',
42: 'del',
43: 'tab',
44: 'space',
45: '-',
47: '[',
48: ']',
56: '/',
57: 'CapsLock',
79: 'RightArrow',
80: 'LeftArrow'
}
ch=""
myKeys = open('hexdump.txt')
i = 1
for line in myKeys:
    bytesArray = bytearray.fromhex(line.strip())
    #print "Line Number: " + str(i)
    for byte in bytesArray:
        if byte != 0:
            keyVal = int(byte)

        if keyVal in newmap:
            print(newmap[keyVal])
            ch=ch+newmap[keyVal]
        else:
            print("No map found for this value: " + str(keyVal))

            print(format(byte, '02X'))
            i+=1
            print(ch)
```

Outputnya lumayan berserakan.

```bash
~/ctf/beectf/foren/sudahlama
❯ python3 solve.py                                                               󰥔 09:42:02
b
b
e
e
e
e
c
c
t
t
f
f
[
[
s
s
u
u
d
d
4
4
h
h
-
-
l
l
4
4
m
m
a
a
-
-
t
t
1
1
d
d
a
a
k
k
-
-
b
b
u
u
4
4
t
t
-
-
s
s
0
0
a
a
l
l
-
-
s
s
3
3
p
p
3
3
r
r
t
t
i
i
-
-
1
1
n
n
i
i
]
]
```

Terus aku coba jadiin oneliner, terus aku sesuaikan dengan format flag deh.

![](/assets/uploads/945a7ccc-1d99-445d-8782-38ddb52dce33-image-5.png)Terus aku lihat dari si medium tadi itu kalau ada `02` berarti dia ini uppercase, akhirnya kita bisa menyesuaikannya deh.

![](/assets/uploads/1e03f4da-398f-41ea-8dc4-3ae75059319e-image-6.png)
