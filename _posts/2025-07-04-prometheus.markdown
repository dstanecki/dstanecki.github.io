---
layout: post
title:  "Prometheus"
date:   2025-07-04 00:00:00 -0500
categories: projects
---
TARGET THIS POST TOWARDS SETTING UP FLASK METRICS<!--break-->

### **Installation**

kubectl create ns monitoring
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring

sudo ufw allow 3000
sudo ufw allow 9090

kubectl port-forward svc/prometheus-operated 9090:9090 -n monitoring (don't miss namespace)
curl http://localhost:9090/metrics (confirm)

Now, kubectl port-forward command only binds to 127.0.0.1. To expose prometheus externally I need to change the svc from ClusterIP to NodePort. Easy way to do it: 
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --set prometheus.service.type=NodePort --set prometheus.service.nodePort=30090 --set grafana.service.type=NodePort --set grafana.service.nodePort=30030

Now I can access port 30090 for Prometheus and 30030 for Grafana. Ideally you might change this back to ClusterIP when finished, using "helm upgrade" command. NodePort is not secure so need to keep in mind some security concerns. 

The helm upgrade command needs to have all --set commands each time you do it or else it will overwrite previous set variables. 

Configure Grafana source to be http://<node IP>:30090 -- sike there's already existing prom source based on DNS?

Setting up scraping at the app level /metrics:
  - IF FLASK IS IN DEBUG MODE IT WILL GIVE PROMETHEUS A 404

NOTES:
Get Grafana 'admin' user password by running:

  kubectl --namespace monitoring get secrets prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 -d ; echo

Access Grafana local instance:

  export POD_NAME=$(kubectl --namespace monitoring get pod -l "app.kubernetes.io/name=grafana,app.kubernetes.io/instance=prometheus" -oname)
  kubectl --namespace monitoring port-forward $POD_NAME 3000

Prometheus annotations are for vanilla Prometheus (no ServiceMonitor)

