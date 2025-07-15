# Backend Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Render (Recommended - Free Tier Available)

1. **Sign up** at [render.com](https://render.com)
2. **Connect your GitHub** repository
3. **Create a new Web Service**
4. **Configure settings:**
   - **Name**: `codeintervu-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

### Option 2: Railway

1. **Sign up** at [railway.app](https://railway.app)
2. **Connect your GitHub** repository
3. **Deploy automatically** - Railway detects Node.js projects

### Option 3: Heroku

1. **Sign up** at [heroku.com](https://heroku.com)
2. **Install Heroku CLI**
3. **Deploy using CLI** or connect GitHub

## 🔧 Environment Variables Setup

### Required Environment Variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codeintervu?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server Configuration
PORT=5000
NODE_ENV=production
```

### How to Set Environment Variables:

#### Render:

1. Go to your service dashboard
2. Click on **Environment**
3. Add each variable one by one

#### Railway:

1. Go to your project dashboard
2. Click on **Variables**
3. Add each variable

#### Heroku:

```bash
heroku config:set MONGODB_URI="your_mongodb_uri"
heroku config:set JWT_SECRET="your_jwt_secret"
# ... repeat for all variables
```

## 📊 Testing Your Deployment

### 1. Health Check

```bash
curl https://your-backend-url.onrender.com/health
```

Expected response:

```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. Root Endpoint

```bash
curl https://your-backend-url.onrender.com/
```

Expected response:

```json
{
  "message": "CodeIntervu Backend API",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Admin Test Endpoint

```bash
curl https://your-backend-url.onrender.com/api/admin/test
```

### 4. API Endpoints Test

```bash
# Get categories
curl https://your-backend-url.onrender.com/api/categories

# Get quiz categories
curl https://your-backend-url.onrender.com/api/quiz/categories
```

## 🔍 Troubleshooting

### Common Issues:

1. **MongoDB Connection Failed**

   - Check if MONGODB_URI is correct
   - Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0
   - Verify database user credentials

2. **CORS Errors**

   - Check if your frontend domain is in allowedOrigins
   - Verify the origin is exactly matching

3. **Environment Variables Not Loading**

   - Double-check variable names (case-sensitive)
   - Ensure no extra spaces or quotes
   - Redeploy after adding variables

4. **Build Failures**
   - Check if all dependencies are in package.json
   - Verify Node.js version compatibility
   - Check build logs for specific errors

### Debug Commands:

```bash
# Check if server is running
curl -I https://your-backend-url.onrender.com/health

# Test specific endpoint
curl -X GET https://your-backend-url.onrender.com/api/categories

# Check with verbose output
curl -v https://your-backend-url.onrender.com/health
```

## 📈 Monitoring

### Logs:

- **Render**: View logs in the dashboard
- **Railway**: Check logs in the project dashboard
- **Heroku**: `heroku logs --tail`

### Performance:

- Monitor response times
- Check memory usage
- Watch for database connection issues

## 🔄 Updating Deployment

### Automatic Updates (Recommended):

- Connect your GitHub repository
- Enable automatic deployments
- Push to main branch triggers deployment

### Manual Updates:

```bash
# Render/Railway: Push to GitHub
git add .
git commit -m "Update backend"
git push origin main

# Heroku: Deploy manually
git push heroku main
```

## 🛡️ Security Checklist

- [ ] JWT_SECRET is a strong random string
- [ ] MONGODB_URI uses environment variables
- [ ] CORS is properly configured
- [ ] No sensitive data in code
- [ ] Environment variables are set
- [ ] Database user has minimal required permissions

## 📞 Support

If you encounter issues:

1. Check the logs in your hosting platform
2. Verify all environment variables are set
3. Test endpoints locally first
4. Check MongoDB Atlas connection
5. Review CORS configuration

## 🎯 Next Steps

After successful backend deployment:

1. Update frontend API configuration
2. Update admin panel API configuration
3. Test all features end-to-end
4. Deploy frontend and admin panel
5. Set up monitoring and alerts
