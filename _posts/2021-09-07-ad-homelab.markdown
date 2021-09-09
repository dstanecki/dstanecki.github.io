---
layout: post
title:  "Virtual Homelab Running Active Directory"
date:   2021-09-07 21:46:57 -0500
categories: projects
---
This homelab utilizes VirtualBox to connect a Windows 2019 Server Domain Controller to a Windows 10 client machine. I followed [Josh Madakor's tutorial](https://www.youtube.com/watch?v=MHsI8hJmggI) on YouTube to set this up. He also provides a randomly generated list of ~1,000 users to add via PowerShell.<!--break-->

The foundation for this homelab is shown in this diagram: ![AD Diagram](/assets/AD-Diagram.png)

Here's what Active Directory showed after I added myself to the admin group: ![AdminList](/assets/adminList.png)

Here's what the server showed after I ran the PowerShell script provided by [Josh Madakor](https://www.youtube.com/channel/UC7L59ITupqEbdE_Wq47woVg): ![PowerShellScript](/assets/PowerShellScript.png)

Here's my client machine showing after it was connected to my domain: ![clientMachine](/assets/clientMachine.png)

I ran into an issue where the client machine was successfully connected to the server domain, but it did not have internet access. I'm still trying to figure this out.

The main things I learned from this project were:
1) How to install Windows Server 2019
2) How to set up Active Directory on the machine
3) How to install Routing and Remote Access on a domain controller (supposed to allow internal clients to connect to the Internet using one public IP)
4) How to install and configure DHCP on the server
5) How to run PowerShell scripts on the server
6) What organizational units are and how they are different from containers (Group Policy Objects can only be applied to organizational units. Examples of a GPO are password complexity enforcement and blocking certain software from being installed on machines) 

I also found this resource to be quite helpful: https://www.serveracademy.com/tutorials/active-directory-tutorial-for-beginners/
