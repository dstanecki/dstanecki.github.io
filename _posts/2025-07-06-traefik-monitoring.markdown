---
layout: post
title:  "Monitor Traefik in Kubernetes with Prometheus and Grafana"
date:   2025-07-06 00:00:00 -0500
categories: projects
---
Traefik<!--break-->

## **Step 1: Add "metrics" port to Traefik service**

```bash
kubectl edit service -n kube-system traefik
```

Manually add "metrics" port using the Traefik metrics port (in most cases 9100, you can verify this by describing the Traefik deployment)
```yaml
  - name: metrics                
    nodePort: 30310      
    port: 9100           
    protocol: TCP        
    targetPort: 9100 
```

## **Step 2: Create a ServiceMonitor**

**Must be in the same namespace as Traefik service, usually kube-system

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

## **Step 3: Verify target health in Prometheus Dashboard


- Edit traefik svc to add port metrics 
- Create servicemonitor on traefik svc 
- Next: Helmify it