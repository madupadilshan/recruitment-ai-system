# Recruitment AI System - EC2 Deployment Guide

Complete step-by-step deployment guide for AWS EC2 with Docker and HTTPS/SSL.

---

## Prerequisites

- AWS EC2 Instance (Ubuntu 24.04 LTS, t3.micro or higher)
- Domain name (e.g., recruitmentapp.live)
- MongoDB Atlas account
- Google Gemini API key

---

## 1. EC2 Instance Setup

### 1.1 Create EC2 Instance

1. **Launch EC2 Instance:**
   - AMI: Ubuntu Server 24.04 LTS
   - Instance Type: t3.micro (1 vCPU, 1GB RAM)
   - Storage: 30GB gp3
   - Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **Configure Security Group:**
   ```
   - Port 22 (SSH): 0.0.0.0/0
   - Port 80 (HTTP): 0.0.0.0/0
   - Port 443 (HTTPS): 0.0.0.0/0
   ```

3. **Download Key Pair:**
   - Save `.pem` file safely

### 1.2 Domain Configuration

1. **Add DNS A Records:**
   - Domain Provider (e.g., Namecheap, GoDaddy)
   - Create A record: `@` → EC2 Public IP
   - Create A record: `www` → EC2 Public IP
   - TTL: Automatic/300

---

## 2. Connect to EC2 Instance

### 2.1 SSH Connection

```bash
# Change key permissions (if on Linux/Mac)
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### 2.2 Update System

```bash
sudo apt update
sudo apt upgrade -y
```

---

## 3. Install Docker & Docker Compose

### 3.1 Install Docker

```bash
# Install Docker
sudo apt install -y docker.io

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Verify installation
docker --version
```

### 3.2 Install Docker Compose

```bash
# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Verify installation
docker compose version
```

---

## 4. Clone Repository

```bash
# Clone your project
git clone https://github.com/madupadilshan/recruitment-ai-system.git

# Navigate to project directory
cd recruitment-ai-system
```

---

## 5. Configuration Files

### 5.1 Create Environment File

```bash
nano .env
```

**Add the following:**

```env
# MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/recruitment?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# AI Service URL (internal)
AI_SERVICE_URL=http://ai-service:8000
```

Save: `Ctrl + O`, Enter, then `Ctrl + X`

### 5.2 Create Frontend Environment

```bash
nano frontend/.env
```

**Add:**

```env
REACT_APP_API_URL=https://www.recruitmentapp.live/api
```

Save and exit.

---

## 6. Docker Configuration Files

### 6.1 Backend Dockerfile

**File:** `backend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

### 6.2 Frontend Dockerfile

**File:** `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

### 6.3 AI Service Dockerfile

**File:** `ai-service/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "app:app"]
```

### 6.4 Frontend Nginx Configuration

**File:** `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name recruitmentapp.live www.recruitmentapp.live;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name recruitmentapp.live www.recruitmentapp.live;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/www.recruitmentapp.live/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.recruitmentapp.live/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    root /usr/share/nginx/html;
    index index.html;
    
    client_max_body_size 10M;
    
    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://recruitment-backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket proxy for Socket.io
    location /socket.io/ {
        proxy_pass http://recruitment-backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6.5 Docker Compose Configuration

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: recruitment-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - AI_SERVICE_URL=http://ai-service:8000
    volumes:
      - ./backend/uploads:/app/uploads
    networks:
      - app-network
    depends_on:
      - ai-service
    restart: unless-stopped

  ai-service:
    build: ./ai-service
    container_name: recruitment-ai
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    networks:
      - app-network
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: recruitment-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - app-network
    depends_on:
      - backend
    restart: unless-stopped

networks:
  app-network:
    driver: bridge
```

---

## 7. SSL Certificate Setup (Let's Encrypt)

### 7.1 Install Certbot

```bash
sudo apt install -y certbot
```

### 7.2 Stop Frontend Container (Temporarily)

```bash
# If containers are running
docker compose down
```

### 7.3 Generate SSL Certificate

```bash
sudo certbot certonly --standalone -d www.recruitmentapp.live -d recruitmentapp.live
```

**Follow prompts:**
- Email: your-email@gmail.com
- Accept Terms: Y
- Share email: N

**Certificate files saved at:**
- Certificate: `/etc/letsencrypt/live/www.recruitmentapp.live/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/www.recruitmentapp.live/privkey.pem`
- Expires: 90 days (auto-renewal configured)

---

## 8. Increase Swap Memory (for t3.micro)

**Required for React build on low-memory instances:**

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile

# Set correct permissions
sudo chmod 600 /swapfile

# Setup swap space
sudo mkswap /swapfile

# Enable swap
sudo swapon /swapfile

# Verify swap is active
free -h

# Make swap permanent (optional)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 9. Build and Deploy

### 9.1 Build All Services

```bash
# Build all Docker images
docker compose build --no-cache
```

**This will:**
- Build backend (Node.js Express)
- Build frontend (React with Nginx)
- Build AI service (Python Flask)

### 9.2 Start All Containers

```bash
# Start all services in detached mode
docker compose up -d
```

### 9.3 Verify Containers

```bash
# Check running containers
docker compose ps

# Should show:
# - recruitment-frontend (ports 80, 443)
# - recruitment-backend (port 5000)
# - recruitment-ai (port 8000)
```

---

## 10. Verification & Testing

### 10.1 Check Container Logs

```bash
# Frontend logs
docker compose logs frontend

# Backend logs
docker compose logs backend

# AI service logs
docker compose logs ai-service

# Follow logs (live)
docker compose logs -f
```

### 10.2 Test Endpoints

```bash
# Test backend health
curl http://localhost:5000/api/health

# Test AI service
curl http://localhost:8000/health
```

### 10.3 Browser Testing

1. **HTTP Redirect:**
   - Visit: http://www.recruitmentapp.live
   - Should redirect to: https://www.recruitmentapp.live

2. **HTTPS Access:**
   - Visit: https://www.recruitmentapp.live
   - Should show green padlock (valid SSL)

3. **Test Features:**
   - Sign Up
   - Login
   - Post Job
   - Upload CV (CV Analysis)
   - Messages
   - Interviews

---

## 11. Maintenance Commands

### 11.1 Stop Services

```bash
docker compose down
```

### 11.2 Restart Services

```bash
docker compose restart
```

### 11.3 Rebuild Specific Service

```bash
# Rebuild frontend only
docker compose build frontend --no-cache
docker compose up -d
```

### 11.4 View Logs

```bash
# All logs
docker compose logs

# Specific service
docker compose logs backend

# Last 50 lines
docker compose logs --tail=50

# Follow logs
docker compose logs -f
```

### 11.5 Update Code

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 12. SSL Certificate Renewal

### 12.1 Manual Renewal

```bash
# Stop frontend container
docker compose stop frontend

# Renew certificate
sudo certbot renew

# Start frontend container
docker compose start frontend
```

### 12.2 Automatic Renewal

Certbot automatically creates a systemd timer for renewal. Verify:

```bash
# Check renewal timer
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

---

## 13. Troubleshooting

### 13.1 Container Not Starting

```bash
# Check logs
docker compose logs [service-name]

# Check Docker status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker
```

### 13.2 Port Already in Use

```bash
# Check what's using port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service
sudo systemctl stop apache2  # if Apache is running
```

### 13.3 SSL Certificate Errors

```bash
# Verify certificate files exist
sudo ls -la /etc/letsencrypt/live/www.recruitmentapp.live/

# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal
```

### 13.4 Memory Issues

```bash
# Check memory usage
free -h

# Check swap
swapon --show

# Increase swap if needed
sudo fallocate -l 4G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2
```

### 13.5 MongoDB Connection Failed

```bash
# Check backend logs
docker compose logs backend

# Verify .env file
cat .env | grep MONGO_URI

# Test MongoDB connection
docker compose exec backend node -e "require('mongoose').connect(process.env.MONGO_URI).then(() => console.log('Connected')).catch(err => console.log(err))"
```

---

## 14. Security Recommendations

### 14.1 Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 14.2 Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose pull
docker compose up -d
```

### 14.3 Backup Strategy

```bash
# Backup uploads folder
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz backend/uploads/

# Backup environment file
cp .env .env.backup

# Backup MongoDB (if self-hosted)
docker compose exec mongodb mongodump --out /backup
```

---

## 15. Performance Optimization

### 15.1 Enable Gzip Compression

Add to `frontend/nginx.conf`:

```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 15.2 Increase Container Resources

Update `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

---

## 16. Monitoring

### 16.1 Container Stats

```bash
# Real-time stats
docker stats

# Disk usage
docker system df
```

### 16.2 Application Logs

```bash
# Backend access logs
docker compose logs backend | grep "GET\|POST"

# Error logs only
docker compose logs backend | grep "ERROR\|Error"
```

---

## Summary

Your application is now deployed with:

- ✅ HTTPS/SSL enabled (Let's Encrypt)
- ✅ Automatic HTTP → HTTPS redirect
- ✅ Docker containerization
- ✅ MongoDB Atlas connection
- ✅ Google Gemini AI integration
- ✅ Nginx reverse proxy
- ✅ Auto-restart on failure
- ✅ SSL auto-renewal configured

**Access your application:**
- Production: https://www.recruitmentapp.live
- Alternative: https://recruitmentapp.live

**Important URLs:**
- Frontend: https://www.recruitmentapp.live
- Backend API: https://www.recruitmentapp.live/api
- EC2 Instance: 54.89.157.88

---

## Quick Reference Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Rebuild
docker compose build --no-cache && docker compose up -d

# Check status
docker compose ps

# Update code
git pull && docker compose down && docker compose build --no-cache && docker compose up -d
```

---

**Deployment Date:** January 21, 2026  
**Server:** AWS EC2 (Ubuntu 24.04, t3.micro)  
**Domain:** www.recruitmentapp.live  
**SSL Provider:** Let's Encrypt
