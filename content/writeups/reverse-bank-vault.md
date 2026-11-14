---
slug: "reverse-bank-vault"
title: "Bank Vault"
competition: "SCTF 2026"
category: "Reverse"
difficulty: "Medium"
date: "2026-07-04"
updated: "2026-07-06"
summary: "Deskripsi: An ATM simulation with a custom encryption algorithm for the PIN."
tags: ["REVERSE ENGINEERING","MEDIUM","KEYCHECK"]
status: "published"
flag: "SCTF26{w3lc0m3_t0_th3_v4ult_p1n_9147487905852048613}"
attachments: [{"url":"/assets/uploads/388f3f8d-7bee-494d-be8e-3b9b2e77271c-bank_vault.zip","name":"bank_vault.zip","contentType":"application/octet-stream"}]
source: "https://claritys.web.id/writeups/reverse-bank-vault"
---

# Bank Vault

> Deskripsi: An ATM simulation with a custom encryption algorithm for the PIN.

Link AI:

[https://chatgpt.com/share/6a487751-ee44-83ec-99fa-6b7e10a341d4](https://chatgpt.com/share/6a487751-ee44-83ec-99fa-6b7e10a341d4)

Awalnya, aku decompile ini menggunakan dogbolt.org, setelah itu aku baca dulu hasilnya.

```
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
