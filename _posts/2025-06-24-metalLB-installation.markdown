---
layout: post
title:  "K8s setting up load balancing on multi-node bare-metal cluster"
date:   2025-06-25 00:00:00 -0500
categories: projects
---
blahhhhh<!--break-->

#### **Overview**

```bash
k apply -f metalLBconfig.yaml 

Error from server (InternalError): error when creating "metalLBconfig.yaml": Internal error occurred: failed calling webhook "ipaddresspoolvalidationwebhook.metallb.io": failed to call webhook: Post "https://metallb-webhook-service.metallb-system.svc:443/validate-metallb-io-v1beta1-ipaddresspool?timeout=10s": context deadline exceeded
```

Debug CNI
```bash
k debug -n kube-system node/raspberrypi1 -it --image=nicolaka/netshoot

curl -m 10 -k https://<webhook-service-ip>:443/
```

Come to find out that unfortunately my wireless 5G internet does not allow ARP for MetalLB Layer 2 mode, and furthermore does not allow BGP for Layer 3 mode.