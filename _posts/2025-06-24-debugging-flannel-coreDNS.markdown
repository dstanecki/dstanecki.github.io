---
layout: post
title:  "Debugging Flannel and CoreDNS when adding a second K8s node"
date:   2025-06-25 00:00:00 -0500
categories: projects
---
I had been running my Zillow Housing Forecast application on a single Kubernetes node and I decided to add a second Raspberry Pi to the cluster. Both nodes were running and in a "Ready" state, however I noticed two problems. The first and most obvious was that when I deployed my app on the second node, I could access the frontend via NodePort but the frontend wasn't communicating with the database (queries simply timed out). After investigating I also realized that the database pod couldn't curl from my GitHub repository (confirmed with nslookup, indicating CoreDNS problem). What's more is I realized that despite the nodes being able to communicate just fine, cross-node pod communication was failing.<!--break-->

#### **Overview**

I was facing a myriad of issues. The end goal I needed to reach was fixing DNS on the second node and fixing cross-node pod communication. I figured that my frontend couldn't communicate to the database because of the same DNS issue that wasn't allowing the pods on Node 2 to perform nslookups. But I also couldn't ping my Node 1 machine IP from a Node 2 pod which was a separate issue entirely, since that was purely IP-based routing. 

#### **Flannel VXLAN port**

After more troubleshooting than I would like to admit, I realized that I had overlooked a crucial requirement when I had installed k3s originally: the Node firewall ports. I had missed port 8472 for Flannel VXLAN which is mentioned in the docs: https://docs.k3s.io/installation/requirements. A hard-learned lesson to be sure. 







THE WHOLE TIME MY SECOND NODE CANNOT REACH CORE DNS
 kubectl run -i --tty busybox --image=busybox --restart=Never -- sh
nslookup kubernetes.default.svc.cluster.local
connection timed out; no servers could be reached

I ruled out inter-node connectivity because I scaled out coredns to have a pod running on my 2nd node and I still couldn't connect
daniel@raspberrypi1:~/zillow-housing-forecast/deployments/k8s $ k scale deploy coredns --replicas=3 -n kube-system
deployment.apps/coredns scaled
daniel@raspberrypi1:~/zillow-housing-forecast/deployments/k8s $ kubectl get pods -n kube-system -l k8s-app=kube-dns -o wide

OPENING PORT 8472 on ufw on both nodes fixed it. 

The issue is for sure with Flannel. And tailscale may be interfering with it. Check UDP Port 8472 Is Open

Flannel uses UDP port 8472 for VXLAN.

Check on both nodes:Check Pod CIDRs Are Not Overlapping or Conflicting

Get node pod CIDRs:

kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name} {.spec.podCIDR}{"\n"}{end}'

NEXT PROBLEM: dns resolution repeated tests gave me alternating failures/successes
Tailscale? No. 
Let's check https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/

Added log to CoreDNS Corefile (can cause slowdowns): kubectl -n kube-system edit configmap coredns
Only seeing successful queries in the log.

Deleting the oldest (5d) CoreDNS pod worked. 

Spread CoreDNS pods across nodes:
Add anti-affinity so both don’t land on the same node.

Add a liveness/readiness probe (if missing) to catch "zombie" pods sooner.

Monitor CoreDNS with Prometheus or logs for recurring issues.

So, when you come back:
1) Write about 8472 and Flannel VXLAN
2) Write about Intermittent CoreDNS resolution solved by deleting 
3) Take logs off if it's all good now (kubectl -n kube-system edit configmap coredns)
4) Write about prevention in the future and contemplate what caused it (I had been fucking with firewalls and stuff, it happened right around the time that I built my custom mariadb and set that up and tried to deploy it to both nodes). I had 2-3 coredns pods and I think that they were randomly load-balanced resulting in intermittent failing.
5) NOW start scaling up the deployments across nodes and see how it goes. 