---
layout: post
title:  "SRE: Metrics"
date:   
categories: projects
---
One of the most common questions I get asked in interviews is which metrics should you monitor and why?<!--break-->

1. External uptime and latency
I'm using Upptime which uses CI/CD to ping an HTTP path. 

## % of requests succeeded 

2. http_request_duration_seconds
  - monitor error rate (4xx or 5xx)

sum(rate(flask_http_request_total[5m]))
  - Shows HTTP request total averaged over 5 minutes and summed over all flask instances

3. Traefik Ingress Metrics

traefik_service_requests_total
traefik_entrypoint_request_duration_seconds
TLS handshake failures
404s/5xx returned by Traefik

4. Pod Restarts, liveness failures
kube_pod_container_status_restarts_total
kube_pod_status_condition
kube_deployment_status_conditionkube_deployment_status_condition

5. Node exporter stuff

6. API server health

(Somewhere) Measure database call success/failure rate