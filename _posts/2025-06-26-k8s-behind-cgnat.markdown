---
layout: post
title:  "Running a Public-Facing Load-Balanced K8s App Behind CGNAT: My Approach"
date:   2025-06-26 01:00:00 -0500
categories: projects
---
When I moved into my new apartment, I brought my Raspberry Pi K8s cluster with me, planning to expose it publicly. Except I missed one small detail: the apartment didn't have a coaxial outlet. I had to get a wireless 5G router which uses **CGNAT (Carrier-Grade NAT)** -- a method used by ISPs to conserve public IPv4 addresses by making multiple customers share a single public IP. You can't assign an public IP to your load balancer if you don't have one to begin with. That wrecked my plan to expose my app via MetalLB and Traefik. Here's how I worked around it.<!--break-->

#### Tailscale Funnel

I racked my brain for workarounds. Public IPv6 address? Nope -- not allowed with this 5G wireless router. Set up a site-to-site VPN to a cloud provider and use a cloud load balancer? Maybe, but I wanted to keep everything bare-metal and easily reproducible. Not only that, but my primary motivation for doing this project on Raspberry Pis was to avoid ongoing costs of cloud infrastructure.

I had already been using a [Tailscale](https://tailscale.com/) private mesh network to connect my Raspberry Pis with my laptop, since I like to SSH to them remotely if I need to. This was actually a lifesaver for me, since I was using PiVPN (OpenVPN) with my old router which allowed port forwarding, but of course this new wireless 5G router does not. Anyway, there's a feature of Tailscale called Tailscale Funnel which lets you share local services publicly via HTTPS, even behind CGNAT -- no port forwarding required.

#### Necessary Modifications

app-service.yaml is going to need to be type: ClusterIP because we want that to remain internal. The Traefik Ingress Controller is going to be handling the routing and exist adjacent to Tailscale Funnel. 
 
1. I changged app-service.yaml from NodePort to ClusterIP and repackaged Helm. 
2. Tailscale Funnel requirement is HTTPS enabled. For each machine you are provisioning with a TLS certificate, run tailscale cert on the machine to obtain a certificate

TO BE CONT...