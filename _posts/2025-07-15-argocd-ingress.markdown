---
layout: post
title:  "How to Install ArgoCD and Configure with Traefik Ingress and cert-manager"
date:   2025-07-15 00:00:00 -0500
categories: projects
---
Install and configure ArgoCD when using Traefik Ingress and cert-manager to handle TLS.<!--break-->

The ArgoCD installation guide states:

```
This default installation will have a self-signed certificate and cannot be accessed without a bit of extra work. Do one of:

    - Follow the instructions to configure a certificate (and ensure that the client OS trusts it).
    - Configure the client OS to trust the self signed certificate.
    - Use the --insecure flag on all Argo CD CLI operations in this guide.
```

These instructions walk you through the **first option**: configuring your own certificate.

**Prerequisites:**
- Helm
- cert-manager with ClusterIssuer in place
- Traefik

# Step 1: Install ArgoCD via Helm

Add the Argo Helm repo:

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
```

Install with the following values.yaml:

```yaml
# Disable ArgoCD's default cert managemen
configs:
  params:
    server.insecure: "true"

# Expose service only internally over HTTP
server:
  service:
    type: ClusterIP
    ports:
      http: 80

  # Disable built-in ingress
  ingress:
    enabled: false
```

You should see that "server insecure" is true if you describe the argo configmap:

```bash
kubectl describe configmap -n argocd argocd-cmd-params-cm
```

# Step 2: Install ArgoCD CLI

```bash
VERSION=$(curl -L -s https://raw.githubusercontent.com/argoproj/argo-cd/stable/VERSION)
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/download/v$VERSION/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64
```

# Step 3: Create DNS record 
In your DNS provider, create a record (e.g., argocd.example.com) pointing to your ingress controller’s external IP on port 443.

# Step 4: Create Certificate
Create argocd-server-tls.yaml

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: argocd-server-tls
  namespace: argocd
spec:
  secretName: argocd-server-tls
  issuerRef:
    name: YOUR_CLUSTER_ISSUER # Replace this
    kind: ClusterIssuer
  dnsNames:
    - YOUR_DNS_RECORD # Replace this
```

Apply:
```bash
kubectl apply -f argocd-server-tls.yaml
```

# Step 5: Create IngressRoute
IngressRoutes are a Traefik CRD, but the same could be applied with a regular Ingress object.

```yaml
  apiVersion: traefik.io/v1alpha1
  kind: IngressRoute
  metadata:
    name: argocd-server
    namespace: argocd
  spec:
    entryPoints:
      - websecure 
    routes:
      - kind: Rule
        match: Host(`YOUR_DNS_RECORD`) # Replace this
        priority: 10
        services:
          - name: argocd-server
            port: 80
    tls:
      secretName: argocd-server-tls
```

Apply:
```bash
kubectl apply -f argocd-ingress.yaml
```

# Step 6: Log in to ArgoCD

```bash
# Retrieve password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Log in with admin user
argocd login <ARGOCD IP OR HOSTNAME> 

# Change default password and delete initial 
argocd account update-password
kubectl delete -n argocd secret argocd-initial-admin-secret
```