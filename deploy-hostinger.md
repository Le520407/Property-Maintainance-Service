# Hostinger VPS Deployment Guide

## Prerequisites
- Hostinger VPS account
- MongoDB Atlas account (free)
- Domain name (optional)

## Step 1: VPS Setup
```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install nginx
apt install nginx -y

# Install PM2 globally
npm install -g pm2
```

## Step 2: Upload Your Code
```bash
# Option A: Git (Recommended)
git clone <your-repo-url>
cd Property-Maintainance-Service

# Option B: Upload via FTP/SCP
# Upload your project files to /var/www/property-maintenance/
```

## Step 3: Environment Setup
```bash
# Backend environment
cd backend
cp .env.example .env
nano .env
```

Update `.env` with:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/property-maintenance
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://your-domain.com
PORT=5000
```

## Step 4: Install Dependencies & Build
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies & build
cd ../
npm install
npm run build
```

## Step 5: Configure Nginx
```bash
# Create nginx config
nano /etc/nginx/sites-available/property-maintenance
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve React build files
    location / {
        root /var/www/property-maintenance/build;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploads
    location /uploads/ {
        root /var/www/property-maintenance/backend;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/property-maintenance /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

## Step 6: Start Application
```bash
cd /var/www/property-maintenance/backend
pm2 start server.js --name property-maintenance
pm2 startup
pm2 save
```

## Step 7: SSL Certificate (Optional)
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com
```

## Alternative: Hostinger Shared Hosting
For shared hosting, you'd need to:
1. Build React app: `npm run build`
2. Upload `build/` folder to public_html
3. Use external API service (Railway, Heroku) for backend