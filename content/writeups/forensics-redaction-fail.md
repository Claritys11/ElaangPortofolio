---
slug: "forensics-redaction-fail"
title: "Redaction Fail"
competition: "FGTE"
category: "Forensics"
difficulty: "Easy"
date: "2026-03-02"
updated: "2026-07-06"
summary: "🏁 Kesimpulan Flag tidak benar-benar dihapus dari PDF Data tersembunyi dalam stream ter-encode Redaction gagal karena: hanya visual masking tidak menghapus data asli"
tags: ["FORENSIC","EASY","PDF"]
status: "published"
flag: "NCLPS1{teRny4ta_fl4g_d1_r3v1Si0n_z3Ro_iNcr3MenTal_uPddaTe_m3n1pu_m4ta_0dd31503e3}"
attachments: []
source: "https://claritys.web.id/writeups/forensics-redaction-fail"
---

# Redaction Fail

> 🏁 Kesimpulan Flag tidak benar-benar dihapus dari PDF Data tersembunyi dalam stream ter-encode Redaction gagal karena: hanya visual masking tidak menghapus data asli

## 🧩 Write-up: Redaction Fail (Forensic)

(half slop)

## 📌 Deskripsi Challenge

Diberikan sebuah file PDF bernama `redaction_fail.pdf`. Challenge ini menguji kemampuan analisis forensik terhadap dokumen PDF yang telah mengalami proses **redaction (penyensoran)**.

Tujuan: menemukan flag yang tersembunyi di dalam file.

* * *

## 🔍 Analisis Awal

Langkah pertama adalah melihat isi file secara kasar menggunakan `strings`:

```bash
╭─   ~/FGTE/foren/redactionfail ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  22:17:08
╰─❯ strings redaction_fail.pdf
%PDF-1.3
 ReportLab Generated PDF document http://www.reportlab.com
1 0 obj
/F1 2 0 R
endobj
2 0 obj
/BaseFont /Helvetica /Encoding /WinAnsiEncoding /Name /F1 /Subtype /Type1 /Type /Font
endobj
3 0 obj
/Contents 7 0 R /MediaBox [ 0 0 595.2756 841.8898 ] /Parent 6 0 R /Resources <<
/Font 1 0 R /ProcSet [ /PDF /Text /ImageB /ImageC /ImageI ]
>> /Rotate 0 /Trans <<
  /Type /Page
endobj
4 0 obj
/PageMode /UseNone /Pages 6 0 R /Type /Catalog
endobj
5 0 obj
/Author (PT Nusantara Teknologi) /CreationDate (D:20250908045635+07'00') /Creator (ReportLab PDF Library - www.reportlab.com) /Keywords (internal; nota; arsip) /ModDate (D:20250908045635+07'00') /Producer (ReportLab PDF Library - www.reportlab.com)
  /Subject (Nota Internal) /Title (Nota Internal Pemeriksaan Vendor) /Trapped /False
endobj
6 0 obj
/Count 1 /Kids [ 3 0 R ] /Type /Pages
endobj
7 0 obj
/Filter [ /ASCII85Decode /FlateDecode ] /Length 860
stream
GatU0gMY_1&:N^lk,CtI5eOh#2k$OWPa!<Cp*l.^_$b)G?)(t*8uqr<a5@Xj%;hgHamt.,R56YB^nDk)?De.g4bp?S%%%EM#0cQ3^i/.oGC#)No8\RHL"MH4ELau*#7S6VN.BSQa.^gT@"/OoHZ9.bpT2c!#p0@54BHJYi\7H7W%Anj/ok55j]ii/IfOrG?sbb_N71SrSASPpJ?'j.*"N9502OZ5.ec`5\i@01DHNpeoP:J0laXd!P;mR6@D>`)J_fB)R\QJ#Z06fR_aH&X;"qgl:%U2,Xj5Q?IpLu)c=B[Ont<*=)@PcG(`2fO>9jpTA()C;gCYh>>]9XE^uR@E&jm@'m/S^*V+3iY,P)YEL+bl+V)_XK'X@ZF+pqL>Ib)s@iEB4!6dkGE#i0$%j"T>*c,5?B05CHje8pM2335EZ_L*Y<]e'AQ7[?MI>X:iO+#&&;JsYO42`-r6G?Du[g.Ig@'\7/g=<Lki[3Um'P=l(3.[0R-TRS,->"uN$rZD&NR'_HWGK3Ef?pe'_-<J&b&!_f?gFB+Ib`mKXEq>aJ_PkufQag`OA3C3@3C`'r;k?encni(oVA1\Mh0>O.!qca:AbjZ8_]X65GVF"\BQ+qMEL?(f5o9WoBp_FA@A'id#^8eVo:+-\ICE[e2nm7Q<qu8CA#]"LCa'mjIe1Qj.Ygs_I1huYO]J5.6S;9uBst*@<MQ'8o2spq_Y\=sI+Y@SlM!;M8SRnWU<G,61t=%kapdm=mS)KtS5r`Z/mq7LQpX`El+QJ7,?Ze1<W#r;73UimjCsO*4WOOHX`rZ>mU![%N:$BF7`*5C;$u3*E[K`tP(aT+\GRhRQ'H+c\$MKmMY9UBSY&f5[0Z~>endstream
endobj
xref
0000000000 65535 f
0000000073 00000 n
0000000104 00000 n
0000000211 00000 n
0000000414 00000 n
0000000482 00000 n
0000000838 00000 n
0000000897 00000 n
trailer
/ID
[<da187fe3b7888c2c485b0f6a7b759a1a><da187fe3b7888c2c485b0f6a7b759a1a>]
% ReportLab generated PDF document -- digest (http://www.reportlab.com)
/Info 5 0 R
/Root 4 0 R
/Size 8
startxref
1847
%%EOF
8 0 obj
<< /Length 567 /Filter /FlateDecode >>
stream
s2k^
$x=x
Smxf
p{H4
endstream
endobj
3 0 obj
/Contents 8 0 R /MediaBox [ 0 0 595.2756 841.8898 ] /Parent 6 0 R /Resources <<
/Font 1 0 R /ProcSet [ /PDF /Text /ImageB /ImageC /ImageI ]
>> /Rotate 0 /Trans <<
  /Type /Page
endobj
xref
0000000000 65535 f
0000002877 00000 n
0000002232 00000 n
trailer
<< /Size 9 /Root 4 0 R /Prev 1847 >>
startxref
3081
%%EOF
9 0 obj
<< /Length 42 /Filter /FlateDecode >>
stream
t^.s#
endstream
endobj
3 0 obj
/Contents [ 8 0 R 9 0 R ] /MediaBox [ 0 0 595.2756 841.8898 ] /Parent 6 0 R /Resources <<
/Font 1 0 R /ProcSet [ /PDF /Text /ImageB /ImageC /ImageI ]
>> /Rotate 0 /Trans <<
  /Type /Page
endobj
10 0 obj
<< /Keywords (PT Nusantara Teknologi; nota; NCLPS1{FAKE_FLAG215635}) /Creator (PT Nusantara Teknologi) /Producer (Office Suite 7.4.2) /Traces (rev2 overlay + noise) /ModDate (D:20250907215635+00'00) >>
endobj
11 0 obj
<< /Length 30 /Filter /FlateDecode >>
stream
endstream
endobj
xref
0000000000 65535 f
0000003355 00000 n
0000003236 00000 n
10 1
0000003569 00000 n
11 1
0000003790 00000 n
trailer
<< /Size 12 /Root 4 0 R /Info 10 0 R /Prev 3081 >>
startxref
3898
%%EOF
```

Hasil menunjukkan beberapa hal menarik:

-   Ada struktur PDF normal (`obj`, `stream`, dll)
    
-   Terdapat beberapa objek stream:
    
    -   Object 7 → `/ASCII85Decode /FlateDecode`
        
    -   Object 8 → `/FlateDecode`
        
    -   Object 9 → `/FlateDecode`
        
    -   Object 11 → `/FlateDecode`
        
-   Ada **flag palsu (decoy)**:
    

```text
NCLPS1{FAKE_FLAG215635}
```

👉 Ini indikasi kuat bahwa challenge ini **multi-layer + decoy**

* * *

## 🧠 Insight Penting

Dalam PDF:

-   Data teks biasanya disimpan di dalam **stream**
    
-   Stream sering di-encode (compressed / encoded)
    
-   Filter yang digunakan:
    
    -   `/FlateDecode` → zlib
        
    -   `/ASCII85Decode` → encoding tambahan (base85)
        

➡️ Artinya: kita harus decode stream untuk melihat isi sebenarnya

* * *

## 🔧 Ekstraksi Object dengan `pdf-parser`

Tool utama yang digunakan:

```bash
╭─   ~/FGTE/foren/redactionfail ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  22:19:47
╰─❯ pdf-parser --help
This program has not been tested with this version of Python (3.13.11)
Should you encounter problems, please use Python version 3.12.2
Usage: pdf-parser [options] pdf-file|zip-file|url
pdf-parser, use it to parse a PDF document

Options:
  --version             show program's version number and exit
  -h, --help            show this help message and exit
  -m, --man             Print manual
  -s SEARCH, --search=SEARCH
                        string to search in indirect objects (except streams)
  -f, --filter          pass stream object through filters (FlateDecode,
                        ASCIIHexDecode, ASCII85Decode, LZWDecode and
                        RunLengthDecode only)
  -o OBJECT, --object=OBJECT
                        id(s) of indirect object(s) to select, use comma (,)
                        to separate ids (version independent)
  -r REFERENCE, --reference=REFERENCE
                        id of indirect object being referenced (version
                        independent)
  -e ELEMENTS, --elements=ELEMENTS
                        type of elements to select (cxtsi)
  -w, --raw             raw output for data and filters
  -a, --stats           display stats for pdf document
  -t TYPE, --type=TYPE  type of indirect object to select
  -O, --objstm          parse stream of /ObjStm objects
  -v, --verbose         display malformed PDF elements
  -x EXTRACT, --extract=EXTRACT
                        filename to extract malformed content to
  -H, --hash            display hash of objects
  -n, --nocanonicalizedoutput
                        do not canonicalize the output
  -d DUMP, --dump=DUMP  filename to dump stream content to
  -D, --debug           display debug info
  -c, --content         display the content for objects without streams or
                        with streams without filters
  --searchstream=SEARCHSTREAM
                        string to search in streams
  --unfiltered          search in unfiltered streams
  --casesensitive       case sensitive search in streams
  --regex               use regex to search in streams
  --overridingfilters=OVERRIDINGFILTERS
                        override filters with given filters (use raw for the
                        raw stream content)
  -g, --generate        generate a Python program that creates the parsed PDF
                        file
  --generateembedded=GENERATEEMBEDDED
                        generate a Python program that embeds the selected
                        indirect object as a file
  -y YARA, --yara=YARA  YARA rule (or directory or @file) to check streams
                        (can be used with option --unfiltered)
  --yarastrings         Print YARA strings
  --decoders=DECODERS   decoders to load (separate decoders with a comma , ;
                        @file supported)
  --decoderoptions=DECODEROPTIONS
                        options for the decoder
  -k KEY, --key=KEY     key to search in dictionaries
  -j, --jsonoutput      produce json output
```

Kenapa pakai ini?

-   Bisa parsing object PDF
    
-   Bisa decode stream otomatis (`--filter`)
    

* * *

## 🔎 Mencari Stream Menarik

Gunakan pencarian:

```bash
╭─   ~/FGTE/foren/redactionfail ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  22:19:01
╰─❯ pdf-parser --searchstream NCLPS1 redaction_fail.pdf
This program has not been tested with this version of Python (3.13.11)
Should you encounter problems, please use Python version 3.12.2
obj 7 0
 Type:
 Referencing:
 Contains stream

  <<
    /Filter [ /ASCII85Decode /FlateDecode ]
    /Length 860
  >>


obj 11 0
 Type:
 Referencing:
 Contains stream

  <<
    /Length 30
    /Filter /FlateDecode
  >>
```

Hasil:

-   Object 7
    
-   Object 11
    

👉 Fokus ke **object 7** karena:

-   Ukuran besar (860 bytes)
    
-   Pakai multi-filter (`ASCII85 + Flate`)
    
-   Biasanya ini tempat data utama
    

* * *

## 💥 Decode Object 11

Command penting:

```bash
╭─   ~/FGTE/foren/redactionfail ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  22:18:30
╰─❯ pdf-parser -o 11 -f -d obj11.txt redaction_fail.pdf
This program has not been tested with this version of Python (3.13.11)
Should you encounter problems, please use Python version 3.12.2
obj 11 0
 Type:
 Referencing:
 Contains stream

  <<
    /Length 30
    /Filter /FlateDecode
  >>



╭─   ~/FGTE/foren/redactionfail ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  22:18:41
╰─❯ cat obj11.txt
NCLPS1{INI_DECOY_SAJA}%
```

Kenapa ini bekerja?

-   `--object 11` → pilih object 11
    
-   `--filter` → otomatis decode:
    
    -   ASCII85Decode
        
    -   lalu FlateDecode
        

* * *

## 💥 Decode Object 7

Command penting:

```bash
╭─   ~/FGTE/foren/redactionfail ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  22:19:32
╰─❯ pdf-parser -o 7 -f -d obj7.txt redaction_fail.pdf
This program has not been tested with this version of Python (3.13.11)
Should you encounter problems, please use Python version 3.12.2
obj 7 0
 Type:
 Referencing:
 Contains stream

  <<
    /Filter [ /ASCII85Decode /FlateDecode ]
    /Length 860
  >>
```

Kenapa ini bekerja?

-   `--object 7` → pilih object 7
    
-   `--filter` → otomatis decode:
    
    -   ASCII85Decode
        
    -   lalu FlateDecode
        

* * *

## 📜 Hasil Decode

Output:

```text
╭─   ~/FGTE/foren/redactionfail ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  kali  22:19:43
╰─❯ cat obj7.txt
1 0 0 1 0 0 cm  BT /F1 12 Tf 14.4 TL ET
.93 g
n 72 847.8898 451 36 re f*
0 g
BT /F1 14 Tf 16.8 TL ET
BT 1 0 0 1 82 865.8898 Tm (PT Nusantara Teknologi) Tj T* ET
BT /F1 12 Tf 14.4 TL ET
BT 1 0 0 1 82 849.8898 Tm (NOTA INTERNAL) Tj T* ET
BT /F1 10 Tf 12 TL ET
BT 1 0 0 1 72 825.8898 Tm (Nomor: INT-2025/0908-01) Tj T* ET
BT 1 0 0 1 292 825.8898 Tm (Tanggal: 08 September 2025) Tj T* ET
BT 1 0 0 1 72 811.8898 Tm (Klasifikasi: Internal - Rahasia) Tj T* ET
.8 w
n 72 803.8898 m 523 803.8898 l S
BT /F1 12 Tf 14.4 TL ET
BT 1 0 0 1 72 787.8898 Tm (Nota Internal Pemeriksaan Vendor) Tj T* ET
BT 1 0 0 1 72 771.8898 Tm (Tanggal: 08 September 2025) Tj T* ET
BT 1 0 0 1 72 755.8898 Tm (Unit: Keuangan & Pengadaan) Tj T* ET
BT 1 0 0 1 72 739.8898 Tm (Perihal: Ringkasan transaksi vendor prioritas dan jadwal pembayaran.) Tj T* ET
BT 1 0 0 1 72 723.8898 Tm (Penerima: Kepala Divisi dan Tim Audit Internal.) Tj T* ET
BT 1 0 0 1 72 707.8898 Tm (Isi:) Tj T* ET
BT 1 0 0 1 72 691.8898 Tm (1\) Vendor yang disetujui untuk percepatan pembayaran.) Tj T* ET
BT 1 0 0 1 72 675.8898 Tm (2\) Nominal dan rekening tujuan bersifat rahasia, hanya untuk internal.) Tj T* ET
BT 1 0 0 1 72 659.8898 Tm (Nomor Rekening: 002901234567 a/n Siti Amalia \(NCLPS1{teRny4ta_fl4g_d1_r3v1Si0n_z3Ro_iNcr3MenTal_uPddaTe_m3n1pu_m4ta_0dd31503e3}\)) Tj T* ET
BT 1 0 0 1 72 643.8898 Tm (Catatan: Dokumen ini tidak untuk dibagikan ke pihak luar.) Tj T* ET
BT /F1 12 Tf 14.4 TL ET
BT 1 0 0 1 72 150 Tm (Hormat kami,) Tj T* ET
1 w
n 72 128 m 272 128 l S
BT /F1 12 Tf 14.4 TL ET
BT 1 0 0 1 72 110 Tm (Ari Pratama) Tj T* ET
BT /F1 10 Tf 12 TL ET
BT 1 0 0 1 72 96 Tm (Chief Executive Officer) Tj T* ET

```

🎯 **FLAG DITEMUKAN:**

```
NCLPS1{teRny4ta_fl4g_d1_r3v1Si0n_z3Ro_iNcr3MenTal_uPddaTe_m3n1pu_m4ta_0dd31503e3}
```

* * *

## ⚠️ Kenapa Bisa Terlewat?

Ini bagian paling penting (insight forensik):

### 1\. Redaction Tidak Menghapus Data

PDF hanya:

-   Menutupi teks secara visual
    
-   Tapi **data asli masih ada di stream**
    

* * *

### 2\. Incremental Update

Dari `strings` terlihat:

```
/Prev 1847
/Prev 3081
```

Artinya:

-   PDF mengalami **revisi**
    
-   Data lama masih tersimpan
    

👉 Flag ada di **versi lama (object 7)**

* * *

### 3\. Decoy Strategy

Challenge sengaja menaruh:

-   Fake flag di metadata
    
-   Fake flag di object kecil
    

👉 Supaya solver berhenti terlalu cepat

* * *

## 🧠 Kenapa Kita Bisa Tahu Pakai `pdf-parser`?

Karena pola umum forensic PDF:

1.  `strings` → lihat struktur
    
2.  Cari:
    
    -   `stream`
        
    -   `Filter`
        
3.  Kalau ada:
    
    -   `/FlateDecode`
        
    -   `/ASCII85Decode`
        

➡️ Langsung kepikiran:

> "ini harus decode pakai pdf-parser / tools serupa"

* * *

## 🏁 Kesimpulan

-   Flag tidak benar-benar dihapus dari PDF
    
-   Data tersembunyi dalam stream ter-encode
    
-   Redaction gagal karena:
    
    -   hanya visual masking
        
    -   tidak menghapus data asli
        

* * *

## 🔥 Lessons Learned

-   Jangan percaya redaction PDF
    
-   Selalu cek:
    
    -   stream
        
    -   filter
        
    -   incremental update
        
-   Decoy itu umum di CTF
