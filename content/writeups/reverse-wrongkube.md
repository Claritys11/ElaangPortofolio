---
slug: "reverse-wrongkube"
title: "WrongKube+"
competition: "JuniorCrypt"
category: "Reverse"
difficulty: "Hard"
date: "2026-07-12"
updated: "2026-07-18"
summary: "Desc: I stumbled upon a rather peculiar utility for visualizing Kubernetes clusters online, but I have a feeling there’s something hidden inside it. Flag format: grodno{}"
tags: ["REVERSE ENGINEERING","HARD","PYINSTXTRACTOR"]
status: "published"
flag: "grodno{5h4d0w_c0ntr0l_pl4n3_qu0rum_r3c0nc1l3d}"
attachments: []
source: "https://claritys.web.id/writeups/reverse-wrongkube"
---

# WrongKube+

> Desc: I stumbled upon a rather peculiar utility for visualizing Kubernetes clusters online, but I have a feeling there’s something hidden inside it. Flag format: grodno{}

## WrongKube+

(3/4 AI SLOP)

**Kategori:** Reverse Engineering

**Flag Format:** `grodno{...}`

* * *

## Daftar Isi

1.  First Look — “Ini apaan sih?”
    
2.  Identifikasi File
    
3.  Trial & Error: Coba Strings Dulu
    
4.  PyInstaller? Oh, Ini Python!
    
5.  Ekstraksi dengan pyinstxtractor
    
6.  Nemu DLL Mencurigakan
    
7.  Decompile DLL pakai Ghidra
    
8.  Analisis validate\_cluster()
    
9.  Nemu Encrypted Flag!
    
10.  Decrypt Manual
     
11.  Flag!
     
12.  Kesimpulan & Lessons Learned
     

* * *

## 1\. First Look

Oke jadi kita dikasih satu file: `WrongCube+.exe`. Nama challengenya **WrongKube+**, katanya ini semacam “utility untuk visualisasi Kubernetes cluster secara online”. Kedengarannya legit, tapi kan ini CTF — pasti ada sesuatu yang disembunyiin di dalamnya.

Sebelum ngapa-ngapain, gue baca deskripsi soalnya pelan-pelan:

> _“I stumbled upon a rather peculiar utility for visualizing Kubernetes clusters online, but I have a feeling there’s something hidden inside it.”_

Oke noted. Ada yang _hidden_. Dan format flagnya `grodno{...}`. Gas langsung.

* * *

## 2\. Identifikasi File

Hal pertama yang harus dilakuin waktu ketemu file EXE adalah **jangan langsung dijalankan**. Kita cek dulu filen1ya ini apaan.

```bash
$ file WrongCube+.exe
WrongCube+.exe: PE32+ executable for MS Windows 6.00 (GUI), x86-64, 7 sections
```

Oke, ini **Windows 64-bit PE executable**. Format GUI, jadi ini punya tampilan grafis. Masuk akal untuk “visualizer Kubernetes”. Size filenya gede banget: **~37 MB**. Itu gede banget untuk aplikasi biasa — ini suspicious, pasti ada yang dibundle di dalamnya.

> **Kenapa 37 MB mencurigakan?** Aplikasi Kubernetes visualizer sederhana nggak butuh 37 MB. Biasanya yang segede ini adalah aplikasi yang bundle runtime (Python, Electron, dll.) plus asset-asset ke dalam satu file.

* * *

## 3\. Trial & Error: Coba Strings Dulu

Gue mulai dari yang paling basic dulu: **strings**. Ini teknik paling klasik — kita dump semua printable string dari binary terus grep yang interesting.

**Attempt #1 — Cari flag langsung:**

```bash
$ strings WrongCube+.exe | grep -i "grodno"
# Nothing...
```

Hmm, flagnya nggak ada secara plaintext. Wajar sih, kalau segampang itu bukan challenge namanya. Okay, coba lain:

**Attempt #2 — Cari kata kunci umum:**

```bash
$ strings WrongCube+.exe | grep -i "flag\|ctf\|secret\|hidden\|kube\|cluster"
```

Output yang keluar:

```
PyMarshal_ReadObjectFromString
PyRun_SimpleStringFlags
pyi-python-flag          <-- bukan flag kita, ini parameter PyInstaller
hCTf
cTfR
KuBEN
assets\KubeFlagLogo.png
assets\WrongKube.ico
assets\WrongKube.jpg
assets\WrongKube.png
assets\demo.wkubeproj
assets\template_broken_control_plane.wkubeproj
assets\template_service_mesh.wkubeproj
assets\template_web_app.wkubeproj
build\wrongkube_validator.dll
```

**Okay ini udah mulai menarik!** Ada beberapa hal yang langsung nyolok mata:

1.  `pyi-python-flag` — kata `pyi` ini kepanjangan **PyInstaller**. Jadi ini Python app yang dibundle!
    
2.  `PyMarshal_ReadObjectFromString` — ini fungsi Python runtime, makin confirm itu Python
    
3.  `build\wrongkube_validator.dll` — **ada DLL yang dibundle!** Namanya `validator` — ini pasti yang ngecek sesuatu
    

> **Asumsi gue di sini:** Karena ada string `pyi-python-flag` dan `PyMarshal`, ini almost pasti **PyInstaller** bundle. PyInstaller adalah tool yang bisa bikin executable dari script Python, dengan cara bundle interpreter Python + semua dependency ke satu file EXE. Ini teknik yang umum banget di malware analysis dan CTF. Gue udah pernah ketemu sebelumnya jadi langsung kenal polanya.

* * *

## 4\. PyInstaller? Oh, Ini Python!

Gue confirm dugaan dengan ngecek signature PyInstaller secara manual. PyInstaller biasanya ninggalin marker `MEIPASS` di dalam binary (nama folder temp yang dibuat saat extract).

```python
import struct

with open('WrongCube+.exe', 'rb') as f:
    data = f.read()

print('File size:', len(data))  # 36,986,470 bytes

# Cek PyInstaller markers
for marker in [b'MEIPASS', b'python3', b'Python3', b'.pyc']:
    pos = data.find(marker)
    if pos != -1:
        print(f'Found{marker} at offset{pos}')
```

Output:

```
File size: 36986470
Found b'MEIPASS' at offset 193791   <-- MEIPASS = PyInstaller temp folder marker!
Found b'python3' at offset 36986160
```

**MEIPASS** itu adalah folder temporary yang dibuat PyInstaller waktu extract bundle-nya. Ketemu ini, 100% confirmed ini PyInstaller.

* * *

## 5\. Ekstraksi dengan pyinstxtractor

Untuk extract isi PyInstaller bundle, kita pakai tool yang namanya **pyinstxtractor**. Tool ini didesain khusus buat unpack PyInstaller EXE.

**Attempt #1 — Install via pip:**

```bash
$ pip3 install pyinstxtractor
ERROR: Could not find a version that satisfies the requirement pyinstxtractor
```

Nggak ada di pip. Okay fine, langsung download dari GitHub:

```bash
$ wget https://raw.githubusercontent.com/extremecoders-re/pyinstxtractor/master/pyinstxtractor.py
$ python3 pyinstxtractor.py WrongCube+.exe
```

Output:

```
[+] Processing WrongCube+.exe
[+] Pyinstaller version: 2.1+
[+] Python version: 3.12
[+] Length of package: 36611174 bytes
[+] Found 180 files in CArchive
[+] Beginning extraction...please standby
[+] Possible entry point: pyiboot01_bootstrap.pyc
[+] Possible entry point: pyi_rth_pyqt6.pyc
[+] Possible entry point: main.pyc
[!] Warning: This script is running in a different Python version than the one used to build the executable.
[!] Please run this script in Python 3.12 to prevent extraction errors during unmarshalling
[!] Skipping pyz extraction
[+] Successfully extracted pyinstaller archive: WrongCube+.exe
```

**180 files ketemu!** Ada warning soal Python version mismatch — sistem kita Python 3.14, bundle dibuild pakai Python 3.12. Ini bikin file `.pyc` dalam PYZ archive nggak bisa langsung diekstrak. Tapi nggak masalah karena file-file utamanya tetap ke-extract.

**Attempt #2 — Coba decompile main.pyc:**

Gue coba decompile `main.pyc` pakai `uncompyle6`:

```bash
$ pip3 install uncompyle6 --break-system-packages
$ python3 -m uncompyle6 main.pyc
```

Error:

```
ImportError: bad magic number in 'struct': b'\xcb\r\r\n'
```

Hmm, gagal juga. Itu karena Python 3.14 nggak kompatibel dengan bytecode 3.12.

**Attempt #3 — Coba dis.dis() manual:**

```python
import dis, marshal

with open('main.pyc', 'rb') as f:
    f.read(16)  # skip header
    code = marshal.loads(f.read())

dis.dis(code)
```

Error lagi:

```
IndexError: tuple index out of range
```

Opcode antara Python 3.12 dan 3.14 beda, jadi dis nggak bisa parse dengan benar.

**Workaround:** Dari `co_names` yang berhasil kita baca, main.py cuma import `src.ui` dan panggil `launch()`. Artinya logika utamanya ada di modul lain — dan kita udah tau ada DLL `wrongkube_validator.dll`. **Kita skip decompile Python dan fokus ke DLL.**

Mari kita lihat isi foldernya:

```bash
WrongCube+.exe_extracted/
├── assets/
│   ├── demo.wkubeproj               <-- project demo cluster!
│   ├── template_broken_control_plane.wkubeproj
│   ├── template_service_mesh.wkubeproj
│   ├── template_web_app.wkubeproj
│   ├── KubeFlagLogo.png
│   └── easter/
├── build/
│   └── wrongkube_validator.dll      <-- TARGET UTAMA KITA
├── main.pyc
├── PyQt6/                           <-- GUI framework
└── [dll dan pyd lainnya]
```

* * *

## 6\. Nemu DLL Mencurigakan

Langsung gue fokus ke `wrongkube_validator.dll`. Nama “validator” itu sangat suggestif — ini pasti yang **ngecek** apakah cluster config kita valid, dan kemungkinan besar ini yang **generate flag**.

Gue cek dulu dengan `file` dan `strings`:

```bash
$ file wrongkube_validator.dll
wrongkube_validator.dll: PE32+ executable for MS Windows 6.00 (DLL), x86-64, 7 sections

$ strings wrongkube_validator.dll | grep -E "[a-zA-Z]{4,}"
```

Dan ketemu ini yang **super menarik**:

```
{"ok":%s,"score":%d,"signature":%d,"summary":"%s","flag":"%s","manifest":%d,"edges":%d,"meta":%d,"shadow":%d,"vm":%d,"vm2":%d,"vm3":%d}
validate_cluster
free_result
wrongkube_validator.dll
role
```

**JACKPOT!** Formatnya jelas banget — DLL ini punya fungsi `validate_cluster()` yang return JSON dengan field **“flag”** di dalamnya! Sekarang tinggal figuring out gimana cara kita dapet flag-nya.

Liat juga string-string status message yang ada di binary:

```
Shadow control plane reconciled. Triple witness accepted.
Visible topology converges, but shadow quorum derivation still drifts.
Control plane is almost stable. Northbound and audit lanes still disagree.
Manifest is close, but service lineage or attachment ownership remains incomplete.
Shadow control plane unstable. Canonical derivation is incomplete.
```

Ini kayaknya **pesan status** dari validator dengan berbagai level kepuasan. Level paling tinggi: _“Shadow control plane reconciled. Triple witness accepted.”_ Ini pasti state yang unlocks flag.

Gue juga cek fungsi-fungsi yang ada di DLL pakai radare2:

```bash
$ r2 -A -q -c "afl" wrongkube_validator.dll
```

Output (fungsi-fungsi penting):

```
0x180001000  validate_cluster    <-- fungsi utama (17,798 bytes!)
0x1800056f0  free_result
0x180005900  [helper]
0x180005b00  [helper]
0x180010990  [massive function, 27,451 bytes]
```

Fungsi `validate_cluster` itu ukurannya **17.798 bytes** — itu gede banget. Dan ada satu fungsi lain yang bahkan lebih gede: 27.451 bytes. Ini kompleks, kita butuh decompiler yang lebih canggih.

* * *

## 7\. Decompile DLL pakai Ghidra

Gue pake **Ghidra** (free RE tool dari NSA, open source) untuk decompile DLL-nya. Karena bisa dipakai headless (tanpa GUI, via command line), gue buat Ghidra script Java untuk auto-decompile fungsi yang kita mau.

**Attempt #1 — Import ke Ghidra:**

```bash
$ /opt/ghidra/support/analyzeHeadless \
    /home/claritys/ctf/juniorcrypt/rev/wrongkube+ WrongKubeProject \
    -import wrongkube_validator.dll
```

Error:

```
ERROR: Path element contains invalid character: '+'
```

Karena nama foldernya ada `+`\-nya, Ghidra nggak mau. Fix: pindah ke temp folder:

```bash
$ /opt/ghidra/support/analyzeHeadless /tmp/ghidra_wk WrongKubeProject \
    -import wrongkube_validator.dll
```

Berhasil! Analisis memakan waktu ~20 detik.

**Attempt #2 — Buat script decompile:**

Script Java buat auto-decompile fungsi-fungsi penting:

```java
// ~/ghidra_scripts/decompile_script.java
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.program.model.listing.*;
import java.io.*;

public class decompile_script extends GhidraScript {
    @Override
    public void run() throws Exception {
        DecompInterface decompiler = new DecompInterface();
        decompiler.openProgram(currentProgram);

        PrintWriter pw = new PrintWriter(new FileWriter("/tmp/decompiled_output.c"));

        for (Function f : currentProgram.getFunctionManager().getFunctions(true)) {
            String name = f.getName();
            if (name.contains("validate_cluster") ||
                name.contains("fcn.180010990") ||
                name.contains("fcn.18001ff80")) {
                pw.println("// === Function: " + name + " @ " + f.getEntryPoint() + " ===");
                DecompileResults result = decompiler.decompileFunction(f, 60, null);
                if (result.decompileCompleted()) {
                    pw.println(result.getDecompiledFunction().getC());
                }
                pw.println();
            }
        }
        pw.close();
        println("Done!");
    }
}
```

**Attempt #2a — Script di /tmp/ nggak jalan:**

```bash
$ /opt/ghidra/support/analyzeHeadless /tmp/ghidra_wk WrongKubeProject \
    -process wrongkube_validator.dll \
    -postScript /tmp/decompile_script.java \
    -noanalysis
```

Error:

```
ERROR Failed to find script in any script directory: /tmp/decompile_script.java
```

Ghidra nggak mau load script dari arbitrary path. Fix: taruh di home directory dan gunakan flag `-scriptPath`:

```bash
$ mkdir ~/ghidra_scripts
$ cp /tmp/decompile_script.java ~/ghidra_scripts/
$ /opt/ghidra/support/analyzeHeadless /tmp/ghidra_wk WrongKubeProject \
    -process wrongkube_validator.dll \
    -postScript decompile_script.java \
    -scriptPath ~/ghidra_scripts \
    -noanalysis
```

Output:

```
INFO  SCRIPT: decompile_script.java
INFO  decompile_script.java> Done! Output in /tmp/decompiled_output.c
```

Hasilnya: file `decompiled_output.c` dengan **2.795 baris** kode C hasil decompilasi.

* * *

## 8\. Analisis validate\_cluster()

Fungsi utamanya adalah `validate_cluster(char *param_1)`. Input-nya adalah **string JSON** yang merepresentasikan cluster Kubernetes.

### 8.1 Parsing JSON Cluster

Fungsi ini nge-parse JSON yang masuk dengan cara yang cukup primitif — pakai `strstr()` dan `strchr()` buat cari field-field tertentu, bukan pakai library JSON. Dari file `demo.wkubeproj` yang ikut ke-extract, kita bisa lihat format JSON yang diharapkan:

```json
{
  "nodes": [
    {
      "id": "ns-core",
      "resource_type": "Namespace",
      "name": "core-plane",
      "props": {
        "namespace": "core-plane",
        "labels": "tier=infra",
        "replicas": 1,
        "port": 0
      }
    }
  ],
  "edges": [
    {
      "id": "e0",
      "source_id": "ns-core",
      "target_id": "dep-rec",
      "binding": "contains",
      "role": "deployment"
    }
  ]
}
```

Dari kode hasil decompile, DLL menyimpan tiap node dalam struct dengan field:

-   `id` (offset 0x0, max 64 bytes)
    
-   `type` (offset 0x40, max 32 bytes)
    
-   `name` (offset 0x60, max 64 bytes)
    
-   `namespace` (offset 0xa0, max 64 bytes)
    
-   `labels` (offset 0xe0, max 128 bytes)
    
-   `selector` (offset 0x160, max 128 bytes)
    
-   `mount` (offset 0x1e0, max 64 bytes)
    
-   `replicas` (offset 0x220, int)
    
-   `port` (offset 0x224, int)
    

Total per node: **0x228 = 552 bytes**. Maksimum 128 nodes (`0x80`).

### 8.2 FNV-1a Hashing

Setelah parsing, DLL ngitung **FNV-1a hash** untuk tiap node. Ini algorithm hash yang sederhana dan cukup umum dipakai. Gue langsung kenal ini karena polanya sangat distinctive:

```c
// Pattern FNV-1a yang ketemu di decompile:
uVar30 = 0x811c9dc5;  // FNV offset basis (32-bit)
do {
    uVar7 = tolower((uint)bVar52);
    iVar6 = isalnum((uint)bVar52);
    uVar25 = (uVar7 & 0xff ^ uVar30) * 0x1000193;  // FNV prime!
    if ((uVar7 & 0xff) == 0x5f) uVar30 = uVar25;   // underscore '_'
    if ((uVar7 & 0xef) == 0x2d) uVar30 = uVar25;   // dash '-'
    if (iVar6 != 0) uVar30 = uVar25;               // alphanumeric
    bVar52 = *pbVar31++;
} while (bVar52 != 0);
uVar30 &= 0x7fffffff;
```

> **Kenapa gue tau ini FNV-1a?** Karena konstanta `0x811c9dc5` itu adalah **FNV offset basis** untuk FNV-1a 32-bit, dan `0x1000193` adalah **FNV prime**. Dua angka ini signature banget — kalau liat dua konstanta ini dalam loop yang XOR sama multiply, langsung gue curiga FNV. Plus ada khas lain: hashing dilakukan per byte (bukan per word), dan ada case khusus untuk underscore dan dash (karena Kubernetes resource names sering pake kedua karakter itu).

Hash ini dihitung untuk beberapa field tiap node:

-   Hash dari `id` → dipakai untuk signature node
    
-   Hash dari `type`/`resource_type` → dipakai untuk kategorisasi
    
-   Hash dari `name`, `namespace` → dipakai untuk perhitungan skor
    

### 8.3 Type Counting via Hash Comparison

Bagian yang bikin gue “OH!” adalah bagian ini dari kode:

```c
// Ngitung jumlah node per tipe (berdasarkan hash dari resource_type string)
if (iVar6 < 0x45334cec) {
    if (iVar6 < 0x251b4cfe) {
        if (iVar6 == 0x133c1bd8) count_Namespace++;
        else if (iVar6 == 0x2047d5a7) count_Secret++;
    }
    else if (iVar6 == 0x251b4cfe) count_Service++;
    else if (iVar6 == 0x31c14e0d) count_Pod++;
}
else {
    if (iVar6 < 0x56dfde64) {
        if (iVar6 == 0x45334cec) count_Deployment++;
        else if (iVar6 == 0x4ace7aa0) count_ConfigMap++;
    }
    else if (iVar6 == 0x56dfde64) count_Ingress++;
    else if (iVar6 == 0x667c6911) count_Node++;
}
```

Setiap angka hex di sana adalah **FNV-1a hash dari nama resource type** Kubernetes. DLL nggak compare string langsung, tapi compare hashnya. Kita bisa verify:

```python
def fnv1a(s):
    h = 0x811c9dc5
    for c in s.lower():
        if c.isalnum() or c in '-_':
            h = ((ord(c) ^ h) * 0x1000193) & 0xffffffff
    return h & 0x7fffffff

print(hex(fnv1a("Namespace")))   # = 0x133c1bd8 ✓
print(hex(fnv1a("Deployment")))  # = 0x45334cec ✓
print(hex(fnv1a("Service")))     # = 0x251b4cfe ✓
print(hex(fnv1a("Pod")))         # = 0x31c14e0d ✓
print(hex(fnv1a("Ingress")))     # = 0x56dfde64 ✓
print(hex(fnv1a("Node")))        # = 0x667c6911 ✓
print(hex(fnv1a("Secret")))      # = 0x2047d5a7 ✓
print(hex(fnv1a("ConfigMap")))   # = 0x4ace7aa0 ✓
```

Semua cocok.

### 8.4 Kondisi Unlock Flag — The Big Gate!

Nah ini dia bagian paling penting. Di bagian akhir fungsi (sekitar baris 2576 dari hasil decompile), ada **kondisi besar** yang harus terpenuhi sebelum flag di-decrypt:

```c
if (((iVar11 == 0x15) && (iVar12 == 0x28)) &&
   ((iVar6 == 0x12 &&
    ((((iVar9 == 0xc && (iVar48 == 8)) && (iVar10 == 7)) &&
     ((iVar50 == 6 &&
      (((val_A << 7 | val_A >> 0x19) ^
         val_B ^
        (val_C << 0xd | val_C >> 0x13))
       == 0x9d3daf88)))))))) {

    if (uVar30 == 0x2f8f6) {
        // DECRYPT FLAG DAN RETURN "true"!
```

Dalam desimal, kondisinya adalah:

VariableNilaiArtinya`iVar11`21 (0x15)Jumlah Namespace`iVar12`40 (0x28)Jumlah Deployment`iVar6`18 (0x12)Jumlah Service`iVar9`12 (0x0c)Jumlah Pod`iVar48`8Jumlah Node`iVar10`7Jumlah Ingress`iVar50`6Jumlah Secretchecksum0x9d3daf88Hash gabungan dari beberapa field`uVar30`194,806 (0x2f8f6)Signature akhir dari semua edge relationships

Kalau **semua kondisi ini terpenuhi**, baru flag di-decrypt dan dikembalikan dalam JSON response.

* * *

## 9\. Nemu Encrypted Flag!

Di dalam blok `if (uVar30 == 0x2f8f6)`, ada loop yang men-decrypt flag. Ini bagian krusialnya:

```c
// Nilai-nilai initial state PRNG (hardcoded!)
iVar11 = -0x8cbb611;   // = 0xF73449EF unsigned
bVar52 = 0x49;         // starting byte key = 'I'
iVar50 = 0x47502943;
lVar19 = 1;            // loop index, mulai dari 1
iVar12 = 0x47502932;
iVar48 = 0x3c6ef35f;
uVar30 = 0;

do {
    // Hitung byte ganjil (index 1, 3, 5, ...)
    iVar13 = iVar11 * 0x19660d + iVar48;
    flag[lVar19] = UNK_18002beff[lVar19]           // encrypted data
                   ^ ((bVar52 + 0xb7) & 0xff)       // XOR key bagian 1
                   ^ ((uint32_t)iVar13 >> 16)        // XOR key bagian 2
                   ^ ((uint32_t)iVar13 & 0xff);      // XOR key bagian 3

    // Hitung byte genap (index 2, 4, 6, ...)
    iVar13_2 = iVar11 * 0x17385ca9;
    // Update iVar11 DULU sebelum iVar13_2 dipakai untuk byte genap
    iVar11_next = uVar30+1 + (uVar30|1)*0x10 + iVar12 + iVar13_2;
    iVar13_2 = iVar13_2 + iVar50;  // baru tambah iVar50

    flag[lVar19+1] = DAT_18002bf00[lVar19]          // encrypted data (berbeda!)
                     ^ bVar52                         // XOR key bagian 1
                     ^ ((uint32_t)iVar13_2 >> 16)    // XOR key bagian 2
                     ^ ((uint32_t)iVar13_2 & 0xff);  // XOR key bagian 3

    // Update semua state untuk iterasi berikutnya
    uVar30 += 2;
    bVar52 = (bVar52 + 0x92) & 0xff;
    iVar50 += 0x35f8ddc;
    lVar19 += 2;
    iVar12 += 0x35f8dba;
    iVar48 += 0x22;
    iVar11 = iVar11_next;

} while (lVar19 != 0x2f);  // Stop saat index = 47, artinya 46 byte = flag
```

**Key insight:** Flag ini di-enkripsi dengan custom PRNG (kombinasi LCG — Linear Congruential Generator) + XOR dengan data hardcoded di section `.rdata` binary. Data encrypted-nya ada di dua lokasi:

-   `0x18002beff` → RVA `0x2beff` → file offset `0x2a4ff`
    
-   `0x18002bf00` → RVA `0x2bf00` → file offset `0x2a500`
    

> **Kenapa langsung coba decrypt tanpa fulfill kondisinya?** Karena kondisinya super kompleks (butuh bikin cluster dengan jumlah node yang sangat spesifik plus checksum yang pas), dan kita tau semua nilai **initial state PRNG-nya hardcoded** di binary. Jadi kita bisa langsung **simulasi PRNG-nya di Python** dan decrypt flag tanpa perlu jalankan programnya! Ini adalah trik klasik dalam RE — kalau kunci enkripsinya hardcoded, kita bisa extract dan simulasi sendiri.

* * *

## 10\. Decrypt Manual

Gue extract byte-byte encrypted dari binary dan simulasikan PRNG-nya di Python.

**Attempt #1 — Salah hitung file offset:**

Waktu pertama gue coba, gue pakai offset `0x2beff` langsung tanpa memperhitungkan bahwa ini adalah RVA (Relative Virtual Address) yang perlu di-map ke file offset melalui section table PE. Hasilnya XOR data yang salah → flag garbled.

```python
# SALAH - ini asumsi langsung RVA = file offset
data[0x2beff:0x2beff+50]  # Nggak valid!
```

**Fix:** Parse PE header untuk mapping yang benar:

```python
# Benar - parse PE sections
# .rdata section: VA=0x2b000, file offset=0x29600
# RVA 0x2beff → .rdata offset = 0x2beff - 0x2b000 = 0xeff
# File offset = 0x29600 + 0xeff = 0x2a4ff
file1 = 0x2a4ff  # UNK_18002beff
file2 = 0x2a500  # DAT_18002bf00
```

**Attempt #2 — Salah urutan update PRNG:**

Di iterasi pertama gue nulis kode decryptnya, gue salah urutan: gue update `iVar11` terlalu cepat (sebelum ngitung byte genap). Hasilnya byte-byte genap salah semua.

```python
# SALAH - iVar11 di-update sebelum byte genap dihitung
iVar13_2 = s32(iVar11 * 0x17385ca9)
iVar11 = s32(uVar30 + 1 + ...)  # update terlalu cepat!
iVar13_2 = s32(iVar13_2 + iVar50)
b2 = data[file2 + lVar19] ^ ...  # pakai iVar11 baru, SALAH
```

**Fix:** Simpan `iVar11_next` dulu, baru update setelah byte genap selesai dihitung:

```python
# BENAR - simpan next value dulu
iVar13_2 = s32(iVar11 * 0x17385ca9)
iVar11_next = s32(uVar30 + 1 + (uVar30 | 1) * 0x10 + iVar12 + iVar13_2)
iVar13_2 = s32(iVar13_2 + iVar50)  # pakai iVar11 lama
b2 = ...  # byte genap dihitung dengan state yang benar
# Baru setelah itu update:
iVar11 = iVar11_next
```

**Attempt #3 — Python integer overflow:**

Python nggak punya signed 32-bit integer natively. Kalau gue nulis `iVar11 * 0x19660d`, Python akan kasih integer gede yang nggak wrap-around. Gue harus manual implement signed 32-bit arithmetic.

```python
# SALAH - Python integer biasa, nggak overflow
iVar13 = iVar11 * 0x19660d + iVar48  # bisa jadi angka ratusan digit!

# BENAR - signed 32-bit
def s32(x):
    x = x & 0xffffffff
    if x >= 0x80000000:
        return x - 0x100000000
    return x

iVar13 = s32(iVar11 * 0x19660d + iVar48)  # wrap di 32-bit ✓
```

**Final working decrypt script:**

```python
with open('wrongkube_validator.dll', 'rb') as f:
    data = f.read()

# File offsets (setelah PE section parsing)
file1 = 0x2a4ff  # UNK_18002beff
file2 = 0x2a500  # DAT_18002bf00

def s32(x):
    x = x & 0xffffffff
    if x >= 0x80000000:
        return x - 0x100000000
    return x

def u32(x):
    return x & 0xffffffff

# State awal dari kode (hardcoded!)
iVar11 = s32(-0x8cbb611)   # = s32(0xF73449EF)
iVar50 = s32(0x47502943)
bVar52 = 0x49
iVar12 = s32(0x47502932)
iVar48 = s32(0x3c6ef35f)
uVar30 = 0

flag_chars = []
lVar19 = 1

while lVar19 != 0x2f:
    # Byte ganjil
    iVar13 = s32(iVar11 * 0x19660d + iVar48)
    b1 = (data[file1 + lVar19]
          ^ ((bVar52 + 0xb7) & 0xff)
          ^ ((u32(iVar13) >> 0x10) & 0xff)
          ^ (u32(iVar13) & 0xff)) & 0xff
    flag_chars.append(b1)

    # Byte genap (iVar11 belum di-update!)
    iVar13_2 = s32(iVar11 * 0x17385ca9)
    iVar11_next = s32(uVar30 + 1 + (uVar30 | 1) * 0x10 + iVar12 + iVar13_2)
    iVar13_2 = s32(iVar13_2 + iVar50)

    b2 = ((u32(iVar13_2) >> 0x10) & 0xff
          ^ bVar52
          ^ (data[file2 + lVar19] & 0xff)
          ^ (u32(iVar13_2) & 0xff)) & 0xff
    flag_chars.append(b2)

    # Update state
    uVar30 += 2
    bVar52 = (bVar52 + 0x92) & 0xff
    iVar50 = s32(iVar50 + 0x35f8ddc)
    lVar19 += 2
    iVar12 = s32(iVar12 + 0x35f8dba)
    iVar48 = s32(iVar48 + 0x22)
    iVar11 = iVar11_next  # baru update di sini

result = bytes(flag_chars)
print('Flag:', result.decode('ascii'))
```

Output:

```
Flag: grodno{5h4d0w_c0ntr0l_pl4n3_qu0rum_r3c0nc1l3d}
```

**YESSSSS!** Flagnya keluar bersih! 🎉

* * *

## 11\. Kesimpulan & Lessons Learned

### Ringkasan Alur Solve

```bash
WrongCube+.exe (37MB)
    │
    ├─[file + strings]─► Deteksi PyInstaller + DLL mencurigakan
    │
    ├─[pyinstxtractor]─► Extract 180 files
    │                        ├── main.pyc (gagal decompile)
    │                        └── wrongkube_validator.dll ◄── TARGET
    │
    ├─[strings + r2]─► Format JSON output + fungsi validate_cluster
    │
    ├─[Ghidra headless]─► 2795 baris kode C decompilasi
    │
    ├─[manual analysis]─► FNV-1a hash, type counting, flag conditions
    │                        └── Encrypted flag + hardcoded PRNG state
    │
    └─[Python script]─► DECRYPT → grodno{5h4d0w_c0ntr0l_pl4n3_qu0rum_r3c0nc1l3d}
```

### Key Takeaways

**1\. File besar = ada yang dibundle.** Kalau EXE ukurannya gila-gilaan, curiga ada packer. PyInstaller, cx\_Freeze, Electron, dll. Langsung cek strings untuk signature mereka. `MEIPASS` = PyInstaller, `NWJS` = NW.js, `Squirrel` = Electron, dll.

**2\.** `strings` **+ grep itu masih selalu berguna.** Bahkan tanpa decode/decompile apapun, kita udah bisa tau ada `wrongkube_validator.dll` dan format output JSON-nya hanya dari strings dump.

**3\. FNV-1a itu mudah dikenali.** Konstanta `0x811c9dc5` (offset basis) dan `0x1000193` (prime) adalah signature yang sangat khas. Kalau liat dua angka ini dalam loop yang XOR sama multiply, langsung curiga FNV.

**4\. Nggak perlu solve semua kondisi untuk dapat flag.** Kalau kondisi unlock adalah “buat cluster yang valid dengan jumlah node yang spesifik”, tapi state dekripsi PRNG-nya hardcoded di binary, kita bisa langsung decrypt tanpa perlu fulfill kondisinya. Ini adalah trick “just decrypt it” yang sering works di CTF.

**5\. Ghidra headless itu power tool.** Banyak yang belum tau Ghidra bisa dipakai tanpa GUI via `analyzeHeadless`. Untuk CTF, sangat berguna karena bisa auto-decompile via Java script, bahkan batch process banyak binary sekaligus.

**6\. Signed integer overflow itu krusial saat simulasi PRNG.** Waktu simulasi PRNG native C di Python, harus pake signed 32-bit arithmetic karena C overflow di 32-bit tapi Python nggak. Helper function `s32()` yang simpel bisa menyelamatkan berjam-jam debugging.

**7\. Baca urutan operasi dengan teliti.** Satu kesalahan kecil dalam urutan update state PRNG bisa bikin semua byte flag salah. Harus baca decompilasi baris per baris, jangan skip-skip.

* * *

## Appendix A: Encrypted Data Raw

Bytes hardcoded di binary yang di-XOR untuk menghasilkan flag:

```
Offset 0x2a4ff (UNK_18002beff):
00 07 9f 08 64 d3 e9 f9 60 d8 6c 37 a9 d4 18 5d
53 d6 42 fe 3a 6c ac 57 f8 1d 4a 04 55 ca 6f ea
13 a8 c2 00 88 02 d7 20 31 7b 5b 74 91 31 3e 00

Offset 0x2a500 (DAT_18002bf00):
07 9f 08 64 d3 e9 f9 60 d8 6c 37 a9 d4 18 5d 53
d6 42 fe 3a 6c ac 57 f8 1d 4a 04 55 ca 6f ea 13
a8 c2 00 88 02 d7 20 31 7b 5b 74 91 31 3e 00 00
```

## Appendix B: Initial PRNG State

```
iVar11 = 0xF73449EF  (= -0x8cbb611 signed)
iVar50 = 0x47502943
bVar52 = 0x49        (= 'I')
iVar12 = 0x47502932
iVar48 = 0x3c6ef35f

PRNG multipliers:
  0x19660d   (LCG multiplier untuk byte ganjil)
  0x17385ca9 (LCG multiplier untuk byte genap)
```

## Appendix C: Hash Lookup Table

FNV-1a hash dari setiap Kubernetes resource type yang dipakai validator:

```
0x133c1bd8 = FNV("Namespace")
0x2047d5a7 = FNV("Secret")
0x251b4cfe = FNV("Service")
0x31c14e0d = FNV("Pod")
0x45334cec = FNV("Deployment")
0x4ace7aa0 = FNV("ConfigMap")
0x56dfde64 = FNV("Ingress")
0x667c6911 = FNV("Node")
```

* * *

gomen ai slopnya kental :sob:
