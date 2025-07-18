---
layout: post
title:  "K3s (SQLite): Promoting a Node to the Control Plane"
date:   2025-07-17 00:00:00 -0500
categories: projects
---
K3s is a lightweight Kubernetes distribution in which the core components are packaged into a single binary. The only way to accomplish a Control Plane promotion in K3s is by doing a backup & restore of the embedded SQLite datastore.<!--break-->

These instructions are intended for administrators using the default embedded SQLite. There will be some downtime (~15 min). A zero downtime promotion is possible but would require an external DB. 

### Why I Needed to Make A Different Node the Control Plane
I was running my cluster on 2 Raspberry Pi's with MicroSD cards. For those unaware, Kubernetes is relatively write-heavy and even the high-endurance SD cards will give out after a year or so. I was running my cluster on a ticking time bomb and an unexpected SD card failure would mean a total rebuild. 

To avoid this, I decided to add a new SSD-backed node to serve as my control plane. As a result, I'm less worred about my SD cards giving out because it's a lot easier to remediate a broken worker node than a control plane node. 

### ✅ Requirements

- Existing K3s cluster using the default **embedded SQLite** datastore

# Step 1: Take Backups

**On the existing control plane server:**

  ```bash
  # Stop k3s before taking backup
  sudo systemctl stop k3s

  # Backup the SQLite datastore
  sudo cp /var/lib/rancher/k3s/server/db/state.db ~/k3s_backup/

  # Backup the server token
  sudo cp /var/lib/rancher/k3s/server/token ~/k3s_backup/
  ```

# Step 2: Wipe K3s from all nodes

Run on all nodes (control plane and workers)

  ```bash
  sudo k3s-killall.sh 
  sudo rm -rf /etc/rancher/k3s /var/lib/rancher/k3s
  ```

# Step 3: Prepare the NEW control plane node

- SCP the state.db and token from the old control plane to the new one (any temp directory is fine for now)
- On Raspberry Pis, add the following args **to the end** of the single line in /boot/firmware/cmdline.txt (without these, the k3s install will fail)

  ```bash
  cgroup_enable=memory cgroup_memory=1 systemd.unified_cgroup_hierarchy=1
  ```

- Then reboot:

  ```bash
  sudo reboot
  ```

# Step 4: Install K3s on new control plane node
  
Run k3s installation script from https://docs.k3s.io/quick-start 

  ```bash
  curl -sfL https://get.k3s.io | sh -
  ```
  
Then: 

  ```bash
  sudo systemctl stop k3s
  
  # Restore backups
  sudo cp state.db /var/lib/rancher/k3s/server/db/state.db
  sudo cp token /var/lib/rancher/k3s/server/token

  # Clean up conflicting data - these will be regenerated
  sudo rm -rf /var/lib/rancher/k3s/server/tls 
  sudo rm -f /etc/rancher/k3s/k3s.yaml
  sudo rm -f /var/lib/rancher/k3s/server/cred/*

  sudo systemctl start k3s
  ```

# Step 5: Remove old control plane metadata

  ```bash
  sudo kubectl get nodes -o wide
  # Delete the original control plane node before rejoining it as a worker
  sudo kubectl delete node {OLD_CONTROLPLANE}
  ```

# Step 6: Join all worker nodes to the new control plane 

Retrieve Node Token from new control plane node:

  ```bash
  sudo cat /var/lib/rancher/k3s/server/node-token
  ```

On each worker node:

  ```bash
  curl -sfL https://get.k3s.io | K3S_URL=https://{CONTROL_PLANE_IP}:6443 K3S_TOKEN={TOKEN} sh -s - agent
  ```

# Step 7: Confirm all nodes are in ready state

  ```bash
  sudo kubectl get nodes -o wide
  ```

# Extras

### Allow your non-root user privilege to use kubectl 

  ```bash
  sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
  sudo chown $(id -u):$(id -g) ~/.kube/config
  chmod 600 ~/.kube/config  # Or 644 if multiple users need read access
  export KUBECONFIG=~/.kube/config # Add this to bashrc too
  ```

### Enable autocompletion

  ```bash
  # Add all of the below to ~/.bashrc 
  echo 'source <(kubectl completion bash)' >>~/.bashrc
  echo 'alias k=kubectl' >>~/.bashrc
  echo 'complete -o default -F __start_kubectl k' >>~/.bashrc
  ```

  ```bash
  source ~/.bashrc
  ```
  
### Other

- Reinstall helm
- Reinstall docker 
- Take care to clean up old PVCs 