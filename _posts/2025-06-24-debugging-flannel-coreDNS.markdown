---
layout: post
title:  "Debugging Flannel and CoreDNS after adding a second K8s node"
date:   2025-06-24 00:00:00 -0500
categories: projects
---
I had been running my Zillow Housing Forecast application on a single Kubernetes node and I decided to add a second Raspberry Pi to the cluster. Both nodes were running and in a "Ready" state, however I noticed two problems. 

1. The frontend app on the second node could be accessed via NodePort, but it couldn’t connect to the database—queries were timing out. The database pod also couldn’t curl a file from GitHub, and nslookup confirmed that DNS resolution was failing, indicating a CoreDNS issue.
2. What's more is I realized that despite the nodes being able to communicate just fine, cross-node pod communication was failing.<!--break-->

#### **Overview**

I was facing a myriad of issues. The end goal I needed to reach was fixing DNS on the second node and fixing cross-node pod communication. I figured that my frontend couldn't communicate to the database because of the same DNS issue that wasn't allowing the pods on Node 2 to perform nslookups. But I also couldn't ping my Node 1 machine IP from a Node 2 pod which was a separate issue entirely, since that was purely IP-based routing. 

#### **Cross-Node Pod Communication**

After more troubleshooting than I would like to admit--disabling my Tailscale mesh network, rebooting my nodes, and testing connectivity in both directions--I realized that I had overlooked a crucial requirement: the Node firewall ports. **I had missed opening port 8472/UDP for Flannel VXLAN** which is mentioned in the k3s installation docs: [https://docs.k3s.io/installation/requirements](https://docs.k3s.io/installation/requirements). After opening this, I was able to ping my nodes from within a pod. 

#### **CoreDNS Debugging**

I fixed the Flannel connection but I was still experiencing timeouts when my frontend app queried my database. I confirmed that CoreDNS was unreachable from both nodes by running a pod on each node and performing an nslookup. 

```bash
kubectl run -i --tty busybox --image=busybox --restart=Never -- sh
nslookup kubernetes.default.svc.cluster.local

connection timed out; no servers could be reached
```

I made sure that the CoreDNS pod was running and appeared healthy.
```bash 
kubectl get pods -n kube-system -l k8s-app=kube-dns -o wide
```
I added log capabilities to CoreDNS Corefile: 
```bash 
kubectl -n kube-system edit configmap coredns
```

I checked the pod logs and describe cmd on the pod and things appeared to check out. 

Maybe there was still a bug in my cross-node connectivity? I scaled my coreDNS deployment from 1 to 3 to check this:
```bash
kubectl scale deploy coredns --replicas=3 -n kube-system
```

But DNS resolution was still flaky. I noticed an odd pattern: running the frontend on Node 1, the first query succeeded, the second timed out, and this would repeat seemingly at random. Only successful queries were logged by the database pod.

I went through the entire kubernetes DNS debug document to no avail [https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/](https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/)

#### **The Root of the Problem: A Zombie CoreDNS Pod**

Eventually, I learned something critical: when you have multiple CoreDNS replicas, traffic is load-balanced across them, **regardless of which nodes they run on**.

One of my three CoreDNS pods was secretly unhealthy—it had failed in a silent way, not restarting or logging errors. It was a zombie. Because DNS requests were being routed to it randomly, they were failing intermittently from all nodes. 

#### **Final Thoughts**
I'm still not sure what caused the pod to break in that fashion. Maybe I had accidentally overloaded it with requests and it didn't have enough resources allocated. In any case, I've learned that having only 1 replica of CoreDNS is bad practice. A normal K8s distribution has **2 replicas by default**, but my K3s distribution came with just one. I guess that makes sense as K3s is trying to be as lightweight as possible, but it's something I'm going to be aware of moving forward. 

Moving forward, I plan to implement the following: 
- Add anti-affinity so both CoreDNS pods don’t land on the same node.
- Add a liveness/readiness probe to catch zombie pods sooner.
- Monitor CoreDNS with Prometheus for recurring issues.