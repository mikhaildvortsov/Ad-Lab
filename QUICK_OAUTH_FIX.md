# 🚨 QUICK FIX: Google OAuth Error

## **Problem**: "Ошибка авторизации через Google" 

Your Google OAuth is failing because of environment variable and redirect URI issues.

## **✅ IMMEDIATE FIXES NEEDED**

### **1. Fix Vercel Environment Variables**

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Set these for **Production** environment:

```env
GOOGLE_CLIENT_ID=38102037146-ikecsi9jgp6e3pdsan4dl88t0qsrbjdi.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXTAUTH_URL=https://ad-lab.vercel.app
NEXTAUTH_SECRET=20aa9c6d279bf2f25489f06eb7ac6382
JWT_SECRET=lCge2+hcSycRAISvyXvmqLQNYlLpVcTIO/IuG4NYnBw=
```

### **2. Update Google Cloud Console**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. In **Authorized redirect URIs**, add:
   ```
   https://ad-lab.vercel.app/api/auth/google
   ```
5. Click **Save**

### **3. Redeploy**

After setting environment variables:
1. Go to **Vercel Dashboard** → **Deployments**
2. Click **Redeploy** on the latest deployment

## **🔧 DEBUG ENDPOINT**

I've created a debug endpoint to verify your configuration:

**For Development:**
```
http://localhost:3000/api/auth/debug
```

**For Production (add this header):**
```
curl -H "x-debug-auth: true" https://ad-lab.vercel.app/api/auth/debug
```

## **📋 CHECKLIST**

- [ ] Set GOOGLE_CLIENT_ID in Vercel
- [ ] Set GOOGLE_CLIENT_SECRET in Vercel  
- [ ] Set NEXTAUTH_URL to https://ad-lab.vercel.app
- [ ] Set NEXTAUTH_SECRET in Vercel
- [ ] Set JWT_SECRET in Vercel
- [ ] Add redirect URI in Google Console
- [ ] Redeploy on Vercel
- [ ] Test OAuth login

## **🎯 MOST LIKELY ISSUES**

1. **NEXTAUTH_URL** is still set to `localhost:3000` instead of `https://ad-lab.vercel.app`
2. **Missing redirect URI** in Google Console for production domain
3. **Environment variables not set** in Vercel production environment

Fix these 3 issues and OAuth will work! 🚀 