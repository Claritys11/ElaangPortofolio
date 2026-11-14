---
slug: "forensics-the-silent-echo"
title: "The Silent Echo"
competition: "TraceBash CTF"
category: "Forensics"
difficulty: "Medium"
date: "2026-06-27"
updated: "2026-06-29"
summary: "Di challenge ini kita dikasih file challenge.pcap. Kalau cuma pakai strings, banyak clue yang kelihatan sengaja dilempar ke muka: ada base64, SSH banner, HTTP request, payload AAAA, sampai download ISO Ubuntu. Tapi flag aslinya bukan di payload biasa. Dia disembunyikan di metadata paket: bagian pertama di high byte IP ID paket ICMP echo request bagian kedua di TCP window size ACK client pada koneksi HTTP download palsu"
tags: ["FORENSIC","PCAP","NETWORK ANALYST","MEDIUM"]
status: "published"
flag: "TBCTF{h1dd3n_1n_w1nd0w_4nd_1p_1d!}"
attachments: []
source: "https://claritys.web.id/writeups/forensics-the-silent-echo"
---

# The Silent Echo

> Di challenge ini kita dikasih file challenge.pcap. Kalau cuma pakai strings, banyak clue yang kelihatan sengaja dilempar ke muka: ada base64, SSH banner, HTTP request, payload AAAA, sampai download ISO Ubuntu. Tapi flag aslinya bukan di payload biasa.  Dia disembunyikan di metadata paket: bagian pertama di high byte IP ID paket ICMP echo request bagian kedua di TCP window size ACK client pada koneksi HTTP download palsu

## The Silent Echo

![](/assets/uploads/writeup-inline-eaf120f0-fce5-4d89-bbc7-68c974e0345a.png)

## 1\. Buka PCAP dan Lihat Gambaran Besar

Pertama buka `challenge.pcap` di Wireshark. Dari **Statistics > Conversations**, kelihatan beberapa komunikasi:

![](/assets/uploads/writeup-inline-90720f29-9133-4c6b-843e-af5f5beb36f9.png)![](/assets/uploads/writeup-inline-653bc72b-b62f-4e2b-adaf-7e8b746c3035.png)![](/assets/uploads/writeup-inline-13484b9d-ed9d-4752-8641-0d95b200e855.png)

-   DNS query ke `8.8.8.8`
    
-   SSH kecil antara `192.168.1.101` dan `185.15.22.99`
    
-   HTTP request ke `10.0.0.80`
    
-   ICMP antara `192.168.1.111` dan `10.0.0.222`
    
-   HTTP download dari `10.0.0.88`
    

Dari sini aku belum langsung tahu flag-nya di mana. Jadi aku cek yang paling mencolok satu-satu.

## 2\. Trial Pertama - Base64 di SSH

Dari hasil `Follow TCP`, ada string ini:

```text
Tm90aGluZyBoZXJlLCBrZWVwIGxvb2tpbmcu
```

Di Wireshark, ini bisa dilihat dengan filter:

```text
tcp.port == 22
```

![](/assets/uploads/writeup-inline-7ebae386-0082-4cd9-89cb-db7a722b966b.png)

Lalu klik kanan salah satu paket SSH, pilih **Follow > TCP Stream**. Di stream itu ada SSH banner dan base64 tadi.

Kalau didecode:

```text
~/ctf/tracebash/forne/silent
❯ echo "Tm90aGluZyBoZXJlLCBrZWVwIGxvb2tpbmcu" | base64 -d                        󰥔 15:06:15
Nothing here, keep looking.⏎
```

Yaa, decoy lah. Berharapnya ketinggian si.

## 3\. Trial Kedua - DNS Query

Aku lanjut cek DNS dengan display filter:

```text
dns
```

![](/assets/uploads/writeup-inline-4f8c62e7-b219-4584-b255-6b503647f2bc.png)

Query-nya cuma domain normal:

```text
ubuntu.com
github.com
stackoverflow.com
microsoft.com
google.com
```

Aku sempat mikir angka IP source terakhir bisa jadi ASCII, atau urutan domain bisa encode sesuatu. Tapi setelah dilihat:

-   query name-nya generik
    
-   tidak ada subdomain aneh
    
-   `dns.id` terlihat `0x0000`
    
-   hasilnya tidak membentuk pola flag
    

Jadi DNS aku anggap noise dulu.

## 4\. Clue Penting dari HTTP Status

Paket HTTP ini menarik:

```http
GET /api/v1/status HTTP/1.1
Host: 10.0.0.80
User-Agent: Mozilla/5.0 ID-Check/1.0
X-Window-Trace: enabled
```

Di Wireshark bisa pakai filter:

```text
http
```

Atau lebih spesifik:

```text
http.request.uri == "/api/v1/status"
```

![](/assets/uploads/writeup-inline-e13d0202-8184-4c6f-8998-f7827abe4ed8.png)

Di sini ada dua hint yang menurutku penting:

-   `ID-Check` ngarah ke `IP ID`
    
-   `X-Window-Trace` ngarah ke TCP window size
    

Ini bikin asumsi awal: flag kemungkinan bukan disimpan di isi data, tapi di field header packet. Dan karena judulnya **The Silent Echo**, ICMP echo jadi kandidat kuat.

## 5\. Trial Ketiga - ICMP Echo dan IP ID

Aku filter ICMP:

```text
icmp
```

Kelihatan ada echo request dan echo reply antara:

```text
192.168.1.111 <-> 10.0.0.222
```

![](/assets/uploads/writeup-inline-08dba8a4-b648-4d97-b50a-dfcaf7862ce1.png)

Payload-nya cuma `AAAAAAAA...`, jadi kalau fokus ke data, nggak ada apa-apa. Tapi karena ada clue `ID-Check`, aku cek field `Identification` di bagian IPv4 header.

Di Wireshark:

1.  Klik paket ICMP echo request.
    
2.  Expand **Internet Protocol Version 4**.
    
3.  Lihat field **Identification**.
    
4.  Fokus ke paket `icmp.type == 8`, yaitu echo request.
    

Display filter yang dipakai:

```text
icmp.type == 8
```

![](/assets/uploads/writeup-inline-19e52a9d-7dc3-4ada-99e6-31fdef271442.png)Di sini, biar cepat kita langsung cari tau biar cepet.

![](/assets/uploads/writeup-inline-8aa2d82e-7b39-4445-bd6e-c4e8e2c19f17.png)

Nilai `IP ID` echo request:

```text
~/ctf/tracebash/forne/silent
❯ tshark -r challenge.pcap -Y "icmp.type == 8" -T fields -e ip.id                󰥔 15:33:56

0x5468
0x4298
0x434a
0x54e7
0x4668
0x7ba1
0x68c6
0x313a
0x6444
0x64a3
0x33f8
0x6e0f
0x5f24
0x3136
0x6ea6
0x5f13
```

Awalnya aku coba lihat full 2 byte-nya, tapi karakter ASCII yang masuk akal justru ada di byte pertama / high byte:

```text
0x54 = T
0x42 = B
0x43 = C
0x54 = T
0x46 = F
```

Ini langsung valid banget, karena membentuk prefix flag:

```text
TBCTF
```

Kalau semua high byte dari `IP ID` echo request diambil berurutan, hasilnya:

```text
TBCTF{h1dd3n_1n_
```

Kenapa aku yakin bagian ini benar?

-   `TBCTF{` adalah format flag yang valid.
    
-   Urutannya cocok dengan sequence ICMP.
    
-   Field yang dipakai cocok dengan hint `ID-Check`.
    
-   Judul challenge cocok dengan ICMP echo.
    

Tapi flag belum selesai, jadi lanjut ke hint satunya: window.

## 6\. Trial Keempat - HTTP Download dan TCP Window Size

Ada koneksi HTTP download:

```http
GET /downloads/ubuntu-22.04.iso HTTP/1.1
Host: 10.0.0.88
```

Di Wireshark pakai filter:

```text
tcp.stream == 2
```

Atau:

```text
ip.addr == 10.0.0.88 && tcp.port == 80
```

Kalau **Follow > TCP Stream**, isi response-nya kelihatan seperti file palsu karena payload dari server isinya byte `00` semua. Jadi payload HTTP bukan tempat flag.

Karena ada hint `X-Window-Trace`, aku cek kolom TCP window size.

Di Wireshark biar enak:

1.  Klik paket TCP di stream download.
    
2.  Expand **Transmission Control Protocol**.
    
3.  Cari field **Window** atau **Calculated window size**.
    
4.  ![](/assets/uploads/writeup-inline-5928a8dc-bac1-47c9-a7ba-44c855d99e07.png)Klik kanan field itu, pilih **Apply as Column**.
    
5.  ![](/assets/uploads/writeup-inline-fde5f2f6-c921-4950-80d9-97cc300fd0a5.png)Tinggal cek di wiresharknya
    
6.  ![](/assets/uploads/writeup-inline-fcceaff4-4db1-4d60-b182-6beed52d5e6b.png)Sekarang muncul Window sebagai Column
    

Setelah jadi kolom, kelihatan pola menarik:

```text
8192
8192
8192
8311
8241
8302
8292
8240
...
```

![](/assets/uploads/writeup-inline-ecab0686-2343-4f1f-a850-2e79fa4c9eee.png)Kita coba pakai tshark agar bisa langsung dicopy.

```text
~/ctf/tracebash/forne/silent
❯ tshark -r challenge.pcap -Y "tcp.stream eq 2" -T fields -e tcp.window_size     󰥔 15:34:47

8192
65535
8192
8192
65535
65535
8311
65535
8241
65535
8302
65535
8292
65535
8240
65535
8311
65535
8287
65535
8244
65535
8302
65535
8292
65535
8287
65535
8241
65535
8304
65535
8287
65535
8241
65535
8292
65535
8225
65535
8317
```

Paket awal client di koneksi ini punya window size normal:

```text
8192
```

Contohnya:

-   SYN dari client: window size `8192`
    
-   ACK setelah SYN/ACK: window size `8192`
    
-   HTTP GET dari client: window size `8192`
    

Nah, setelah server mulai ngirim potongan data palsu, ACK dari client berubah jadi angka sekitar `82xx` sampai `83xx`. Ini mencurigakan karena semuanya dekat banget dengan baseline `8192`.

Jadi dari mana angka `8192` didapat?

Angka `8192` diambil dari nilai window size normal/baseline milik client pada koneksi TCP itu sendiri. Bukan nebak random. Di awal stream download, sebelum data palsu dikirim, client selalu memakai TCP window size `8192`. Setelah itu, ACK client berubah menjadi `8192 + nilai ASCII`.

Contoh:

```text
8311 - 8192 = 119 = w
8241 - 8192 = 49  = 1
8302 - 8192 = 110 = n
8292 - 8192 = 100 = d
8240 - 8192 = 48  = 0
```

Hasil awalnya:

```text
w1nd0
```

Ini pas banget dengan hint `Window`, jadi asumsi makin kuat.

Kalau semua ACK client yang window size-nya lebih dari `8192` diambil dan dikurangi `8192`, hasilnya:

```text
w1nd0w_4nd_1p_1d!}

```
