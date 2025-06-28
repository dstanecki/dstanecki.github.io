---
layout: post
title:  "Running a Public-Facing Load-Balanced K8s App Behind CGNAT: My Approach"
date:   2025-06-27 01:00:00 -0500
categories: projects
---
When I moved into my new apartment, I brought my Raspberry Pi K8s cluster with me, planning to expose it publicly. Except I missed one small detail: the apartment didn't have a coaxial outlet. I had to get a wireless 5G router which uses **CGNAT (Carrier-Grade NAT)** -- a method used by ISPs to conserve public IPv4 addresses by having multiple customers share a single public IP. You can't assign an public IP to your load balancer if you don't have your own to begin with. That wrecked my plan to expose my app via MetalLB and Traefik. Here's how I worked around it.<!--break-->

### **What Doesn't Work**

I racked my brain for workarounds. Public IPv6 address? Nope -- not allowed with this 5G wireless router. Set up a site-to-site VPN to a cloud provider and use a cloud load balancer? Maybe, but I wanted to keep everything bare-metal and easily reproducible. Not only that, but my primary motivation for doing this project on Raspberry Pis was to avoid ongoing costs of cloud infrastructure.

I had already been using a [Tailscale](https://tailscale.com/) private mesh network to connect my Raspberry Pis with my laptop, since I like to SSH to them remotely if I need to. This was actually a lifesaver for me, since I was using PiVPN (OpenVPN) with my old router which allowed port forwarding, but of course this new wireless 5G router does not. **While Tailscale does offer a service called Funnel, which can expose your private service to the internet, it restricts you to using a subdomain.ts.net and is not compatible with CNAME. It will throw an SSL error.** The feature is relatively new and in Beta testing, so this is not readily apparent. Yes, I found this out the hard way.

Now luckily, there are two other services that allow you to get past CGNAT restrictions **and** let you use your own domain name: Ngrok and CloudFlare Tunnel.

### **Ngrok vs CloudFlare Tunnel**

**CNAME Support**
- CloudFlare Tunnel is free and supports custom CNAME records (caveat is that you must transfer your domain to CloudFlare)
- Ngrok has a free-tier but custom CNAME support will run you about $10/month (but no domain transfer required)
---
**TLS Certificate Options**
- Ngrok requires paid plan for both Ngrok-managed certs for your CNAME and for using self-managed certs (e.g. Let'sEncrypt) to achieve TLS passthrough
- CloudFlare Tunnel will manage the TLS certificate for any domain proxied through CloudFlare as long as the domain is managed in CloudFlare DNS. Meaning, you can use their cert or your own, free of charge either way
---
**End-to-End TLS Encryption**
- Ngrok supports end-to-end encryption if you configure it that way
- CloudFlare Tunnel doesn't support it and terminates TLS at their servers
---
**Security Features**
- CloudFlare Tunnel has built-in DDoS protection and web application firewall 
- Ngrok does not
---
#### **FINAL VERDICT**
For my use case, I would prefer to stay free tier and I also want CNAME support, so I'm going to choose **CloudFlare Tunnel**. The main drawback is that I don't want to transfer my domain there as I like having it in AWS Route 53, but that's the sacrifice I have to make. The other drawback is I don't get to have end-to-end TLS encryption. That being said, I might not stay with the CloudFlare solution so I'm going to lay out **both options** in this post. 

**Option A)** Ngrok with self-managed TLS cert via Let's Encrypt to achieve end-to-end TLS encryption

**Option B)** CloudFlare Tunnel with CloudFlare-managed TLS cert

### **Option A: Ngrok**

![/assets/k8s-ingress-letsencrypt.drawio.png](/assets/k8s-ingress-letsencrypt.drawio.png)
 
Prerequisites: 
- Traefik installed
- cert-manager installed (kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.18.0/cert-manager.yaml)
- Ngrok account set up
- Domain in Route 53, CNAME record pointing to the auto-generated <random-subdomain>.ngrok.io

1. Internal app-service needs to be ClusterIP (as opposed to NodePort which is what I was using to expose my app internally. I'm going to make this configurable via Helm)
2. Note down or edit the Traefik Websecure NodePort (This is the port that will be exposed to Ngrok later on)
```bash
kubectl -n kube-system edit svc traefik
```
3. Create a Route 53 service account (will be used with the DNS01 Challenge)
4. Create kubectl secret 
```bash
kubectl create secret generic route53-credentials-secret \
  --from-literal=access-key-id=<access-key> \
  --from-literal=secret-access-key=<secret-access-key> \
  --namespace cert-manager
```
5. Create a ClusterIssuer
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: <YOUR_EMAIL>
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - dns01:
        route53:
          region: us-east-1
          hostedZoneID: <OPTIONAL BUT RECOMMENDED>
          accessKeyIDSecretRef:
            name: route53-credentials-secret
            key: access-key-id
          secretAccessKeySecretRef:
            name: route53-credentials-secret
            key: secret-access-key
```
6. Create Traefik Middleware object
```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: redirect-https
spec:
  redirectScheme:
    scheme: https
    permanent: true
```
7. Create an Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: zhf-tls-ingress
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    spec.ingressClassName: traefik
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  rules:
    - host: zhf.danielstanecki.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app
                port:
                  number: 5000
  tls:
    - secretName: zhf-tls
      hosts:
        - zhf.danielstanecki.com
```
8. Apply the objects and the cert will be issued automatically and begin DNS01 Challenge which can take a few minutes. 
```bash
watch kubectl get challenges -n kube-system
```
9. Expose the Traefik Websecure NodePort from step 2 to Ngrok
10. Test public access from another machine and see that your application is now being served with HTTPS!

### **Option B: CloudFlare**

TO BE CONT...
Understand when the expiry will happen and have instructions written up here. 