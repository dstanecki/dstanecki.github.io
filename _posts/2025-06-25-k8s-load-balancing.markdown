---
layout: post
title:  "Managing K8s Bare-metal Load Balancing Without Access to Router Controls"
date:   2025-06-25 21:46:57 -0500
categories: projects
---
When deciding between buying Raspberry Pis or using GKE or cloud VMs for my kubernetes cluster, I carefully weighed the cost of each. The Pis had a higher upfront cost but there was also a peace of mind knowing that there wouldn't be expensive running costs. So, with that mindset in place, I chose to set up load balancing all on my bare-metal cluster -- with no dependency on cloud infrastructure. I plan to eventually expose this app publicly under my custom DNS domain so I had to keep all of that in mind while working around my major limitation: dumbed down router controls.<!--break-->

My internet router is a wireless 5G router that doesn't allow advanced DHCP config, port forwarding, etc. I'll be tracking my progress at seeing if I can use Metal LB despite those limitations.

```bash
k apply -f metalLBconfig.yaml 

Error from server (InternalError): error when creating "metalLBconfig.yaml": Internal error occurred: failed calling webhook "ipaddresspoolvalidationwebhook.metallb.io": failed to call webhook: Post "https://metallb-webhook-service.metallb-system.svc:443/validate-metallb-io-v1beta1-ipaddresspool?timeout=10s": context deadline exceeded
```

Debug CNI
```bash
k debug -n kube-system node/raspberrypi1 -it --image=nicolaka/netshoot

curl -m 10 -k https://<webhook-service-ip>:443/
```

Need to try a different installation method of Metal LB as suggested by github discussions... 