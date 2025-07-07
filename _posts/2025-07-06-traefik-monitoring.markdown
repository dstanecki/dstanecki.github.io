---
layout: post
title:  "Monitor Traefik Ingress Controller in Kubernetes with Prometheus and Grafana"
date:   2025-07-07 00:00:00 -0500
categories: projects
---
Simple step-by-step guide to configure Traefik monitoring in Kubernetes using Prometheus and Grafana.<!--break-->

**Prerequisites:**
Ensure the following are already installed and running in your cluster:
- Traefik
- Prometheus
- Grafana

## **Step 1: Verify that Prometheus scraping is enabled and verify the port**

Inspect your Traefik deployment and locate the annotations section:

```bash
kubectl describe -n kube-system deployment traefik
```

```yaml
Pod Template:
  Labels:           app.kubernetes.io/instance=traefik-kube-system
                    app.kubernetes.io/managed-by=Helm
                    app.kubernetes.io/name=traefik
                    helm.sh/chart=traefik-27.0.201_up27.0.2
  Annotations:      kubectl.kubernetes.io/restartedAt: 2025-07-02T17:11:38-05:00
                    prometheus.io/path: /metrics
                    prometheus.io/port: 9100
                    prometheus.io/scrape: true
```

This confirms that Prometheus is set up to scrape metrics from Traefik on port 9100 at the /metrics path—typically the default for most Traefik Helm deployments.

## **Step 2: Add "metrics" port to Traefik service**

Edit the Traefik service: 

```bash
kubectl edit service -n kube-system traefik
```

Add "metrics" port definition to the service spec:

```yaml
  - name: metrics                
    nodePort: 30310      
    port: 9100           
    protocol: TCP        
    targetPort: 9100 
```

## **Step 3: Create a ServiceMonitor**

This step assumes you're using the PrometheusOperator which is included in the prometheus-kube-stack Helm chart. The ServiceMonitor must exist in the same namespace as your Traefik service (usually kube-system): 

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: traefik
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: traefik
  endpoints:
    - port: metrics
      path: /metrics
      interval: 15s
```

## **Step 4: Verify target health in Prometheus Dashboard**

Open the Prometheus dashboard and check Status > Targets to confirm that the Traefik target is up and healthy:

![/assets/traefikPromTarget.png](/assets/traefikPromTarget.png)

## **Step 5: Set up a Grafana dashboard**

For general use cases, a good place to start is the [Traefik Official Standalone Dashboard](https://grafana.com/grafana/dashboards/17346-traefik-official-standalone-dashboard/).

It's downloadable as a JSON file. In Grafana, navigate to Dashboards > New > Import. Then upload the file. This is how it looks for me after adjusting some of the Prom queries:

![/assets/traefikGrafana.png](/assets/traefikGrafana.png)