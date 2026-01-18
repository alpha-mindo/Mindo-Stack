# Deployment Guide

## Quick Start: Deploy to Free Services

### 1. Database (MongoDB Atlas)
```bash
# Sign up at https://www.mongodb.com/cloud/atlas
# Create a free cluster
# Get your connection string (looks like):
# mongodb+srv://username:password@cluster.mongodb.net/mindostack
```

### 2. Backend (Render.com)
1. Push your code to GitHub
2. Go to https://render.com
3. Create New → Web Service
4. Connect your GitHub repo
5. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `MONGODB_URI`: Your Atlas connection string
     - `PORT`: 5000
     - `NODE_ENV`: production

### 3. Frontend (Vercel)
1. Go to https://vercel.com
2. Import your GitHub repo
3. Settings:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Environment Variables**:
     - `VITE_API_URL`: Your Render backend URL (e.g., https://your-app.onrender.com)

## Alternative: Using ngrok for Testing

If you want people to access your local server:

```bash
# Terminal 1 - Start backend
cd server
npm start

# Terminal 2 - Start frontend  
cd client
npm run dev

# Terminal 3 - Expose backend
npx ngrok http 5000
# Copy the https URL (e.g., https://abc123.ngrok.io)

# Update client/.env with the ngrok URL
VITE_API_URL=https://abc123.ngrok.io

# Restart frontend
```

**Share the Vite URL** (http://your-ip:3000 or use another ngrok for frontend)

## Using Your Own Server/VPS

If you have a server with a public IP:

### Backend Setup
```bash
# On your server
cd server
npm install
npm install -g pm2

# Start with PM2 (keeps it running)
pm2 start server.js
pm2 save
pm2 startup
```

### Configure Firewall
```bash
# Allow ports 5000 (backend) and 3000 (frontend)
sudo ufw allow 5000
sudo ufw allow 3000
```

### Frontend Setup
```bash
# Update .env with your server IP
VITE_API_URL=http://your-server-ip:5000

# Build for production
npm run build

# Serve with nginx or use: npx serve -s dist -p 3000
```

### Using Nginx (Production)
```nginx
# Frontend (port 80)
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/client/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Domain Setup

If you have a domain:
1. Point domain to your server IP (A record)
2. Use SSL with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## Summary of Options

| Option | Cost | Difficulty | Best For |
|--------|------|------------|----------|
| MongoDB Atlas + Render + Vercel | Free | Easy | Production |
| ngrok | Free | Very Easy | Quick Testing |
| VPS (DigitalOcean/AWS) | ~$5/mo | Medium | Full Control |
| Your Local Server + ngrok | Free | Easy | Development |

## Recommended: Production Deployment

1. **MongoDB Atlas** (database) - Free tier
2. **Render** (backend) - Free tier
3. **Vercel** (frontend) - Free tier

Total cost: **$0/month** ✨

Just update the environment variables and deploy!
