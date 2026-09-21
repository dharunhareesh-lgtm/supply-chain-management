# Dravix SCM Production Deployment Guide on AWS EC2 (Docker Compose)

This comprehensive guide details how to deploy the entire **Dravix Supply Chain Management** system on a fresh **AWS EC2 Ubuntu (22.04 or 24.04 LTS)** instance using **Docker Compose**.

---

## 1. System Architecture

```text
Internet (Users / Browsers)
      │
      ▼ (Port 80 HTTP)
AWS EC2 Instance
      │
      ▼
Docker Compose Network (dravix-network)
  ├── dravix-frontend (Port 80)
  │     ├── Serves React 19 Production Single-Page Application
  │     └── Nginx Reverse Proxy for all API routes & static uploads
  │           │
  │           ▼ (Internal HTTP: http://backend:8082)
  ├── dravix-backend (Spring Boot 3 + Java 17)
  │     ├── Automated 02:00 AM data.gov.in Mandi ETL & ML Forecaster
  │     ├── JWT Security & Role-Based Controllers
  │     └── Native Tesseract OCR & S3 Document Handlers
  │           │
  │           ▼ (Internal TCP: 3306)
  └── dravix-database (MySQL 8.0)
        ├── Initialized automatically via local_dump_clean.sql
        └── Persistent Named Volume: mysql_data
```

> **Security Note:** Port `8082` (Backend) and Port `3306` (MySQL) are strictly internal to the Docker bridge network. Only Port `80` (Nginx) and Port `22` (SSH) need to be open on your AWS Security Group.

---

## 2. AWS EC2 Instance Requirements

- **AMI:** Ubuntu 24.04 LTS or 22.04 LTS (64-bit x86)
- **Instance Type:** `t3.medium` (2 vCPU, 4 GiB RAM) recommended for smooth builds, or `t2.micro` (1 GiB RAM) with 2 GB Swap Memory enabled.
- **Storage:** 20 GB – 30 GB gp3 EBS Volume.
- **Security Group (Inbound Rules):**
  | Type | Protocol | Port Range | Source | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | **SSH** | TCP | `22` | `My IP` (or `0.0.0.0/0`) | Secure Terminal Access |
  | **HTTP** | TCP | `80` | `0.0.0.0/0` | Public Web Traffic (Nginx) |

---

## 3. Server Preparation & Docker Installation

SSH into your EC2 Ubuntu instance:
```bash
ssh -i /path/to/your-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

Update system packages and install the modern Docker engine + Compose plugin:
```bash
# 1. Update package index
sudo apt update && sudo apt upgrade -y

# 2. Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# 3. Add Docker official GPG key & repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Install Docker Engine and Docker Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Add ubuntu user to docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker $USER
newgrp docker

# 6. Verify installation
docker --version
docker compose version
```

### Optional (For 1GB RAM instances like `t2.micro`): Enable 2GB Swap Memory
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 4. Clone Project & Configure Environment

Clone the repository to the EC2 instance:
```bash
git clone <YOUR_GIT_REPOSITORY_URL> capstone
cd capstone
```

Copy the environment template:
```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` using nano:
```bash
nano .env.docker
```
Update values:
- `MYSQL_PASSWORD`: Set a secure database password.
- `MYSQL_ROOT_PASSWORD`: Set a secure root password.
- `SCMS_CORS_ALLOWED_ORIGINS`: Add your EC2 public IP or domain (e.g. `http://<YOUR_EC2_IP>,http://localhost:80`).
- Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

Make `deploy.sh` executable:
```bash
chmod +x deploy.sh
```

---

## 5. Deploy with Docker Compose

Run the deployment script:
```bash
./deploy.sh
```
*Or execute directly:*
```bash
docker compose --env-file .env.docker up -d --build
```

---

## 6. Verification & Health Monitoring

1. **Verify running containers:**
   ```bash
   docker compose ps
   ```
   You should see:
   - `dravix-database` (Up, healthy)
   - `dravix-backend` (Up, healthy)
   - `dravix-frontend` (Up, healthy)

2. **Inspect logs:**
   ```bash
   # All services
   docker compose logs -f

   # Specific services
   docker compose logs -f dravix-backend
   docker compose logs -f dravix-frontend
   docker compose logs -f dravix-database
   ```

3. **Browser Testing:**
   Open your browser and navigate to:
   ```text
   http://<YOUR_EC2_PUBLIC_IP>
   ```
   - Test login as Admin, Supplier, Warehouse, Logistics, or Customer.
   - Navigate to **Admin > System Monitoring** and **Market Data**.
   - Verify that refresh on sub-routes (`/admin`, `/warehouse`, `/supplier`) does not return 404.

---

## 7. Future Updates Workflow

When you commit new changes to Git in the future:
```bash
cd capstone
./deploy.sh
```
The script will pull the latest code, rebuild frontend/backend, and restart services without deleting the database volume.

---

## 8. Troubleshooting Guide

### Issue 1: Frontend loads but API calls fail
- **Symptom:** Browser shows dashboard frame, but widgets show network error or spinning loader.
- **Cause:** Nginx regex didn't route the URL or backend is still booting.
- **Check:**
  ```bash
  docker compose logs --tail=100 dravix-backend
  docker compose logs --tail=100 dravix-frontend
  ```
- **Fix:** Wait for backend healthcheck to turn `healthy` (`docker compose ps`). Check that your endpoint is covered in `supply-chain-system/nginx.conf`.

### Issue 2: MySQL initialization (`local_dump_clean.sql`) did not run
- **Symptom:** Tables are empty or missing.
- **Cause:** Docker only executes scripts in `/docker-entrypoint-initdb.d/` if the volume is freshly created.
- **Fix:** If and only if you are setting up for the first time and want to re-seed:
  ```bash
  docker compose down -v
  docker compose --env-file .env.docker up -d --build
  ```
  *(Warning: `down -v` deletes all existing container database records!)*

### Issue 3: Port 80 already in use
- **Symptom:** `bind: address already in use` error when starting `dravix-frontend`.
- **Cause:** Apache or another standalone Nginx is running directly on Ubuntu.
- **Check & Fix:**
  ```bash
  sudo systemctl stop apache2 nginx 2>/dev/null || true
  sudo systemctl disable apache2 nginx 2>/dev/null || true
  docker compose restart frontend
  ```

### Issue 4: Container keeps restarting
- **Symptom:** Status shows `Restarting (1)`.
- **Check:**
  ```bash
  docker compose logs dravix-backend
  ```
- **Fix:** Usually caused by incorrect database credentials in `.env.docker` or memory limit exceeded. Add swap memory if on `t2.micro`.
