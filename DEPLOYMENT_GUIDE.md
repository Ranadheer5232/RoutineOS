# 🚀 RoutineOS - Production Deployment Guide

Deploy **RoutineOS** completely **FREE** using:
- **Backend (Node.js/Express + MongoDB Atlas)**: on [Render](https://render.com) (or Railway)
- **Frontend (React + Vite PWA)**: on [Vercel](https://vercel.com) (or Netlify)

---

## 📋 Prerequisites Checklist

1. [x] **MongoDB Atlas**: Cloud Database cluster is created and running.
2. [ ] **GitHub Repository**: Push your RoutineOS project to GitHub.
3. [ ] **Render Account**: [https://render.com](https://render.com) (Free tier)
4. [ ] **Vercel Account**: [https://vercel.com](https://vercel.com) (Free tier)

---

## 🗄️ Step 1: Ensure MongoDB Atlas Network Access

Before deploying, ensure Render's servers can connect to your MongoDB Atlas cluster:
1. Open [MongoDB Atlas](https://cloud.mongodb.com/).
2. In the left sidebar, navigate to **Security** ➔ **Network Access**.
3. Check if `0.0.0.0/0` (Allow Access from Anywhere) is listed.
4. If not, click **+ Add IP Address** ➔ Select **Allow Access From Anywhere (`0.0.0.0/0`)** ➔ Click **Confirm**.

---

## ⚙️ Step 2: Deploy Backend to Render

1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** ➔ Select **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Name**: `routineos-backend` (or any custom name)
   - **Region**: Choose closest to you (e.g., Singapore, Oregon, Frankfurt)
   - **Root Directory**: `RoutineOS/backend` *(or `backend` if repo root)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `PORT` | `5000` |
   | `MONGO_URI` | `Your MongoDB Connection String from backend/.env` |
   | `JWT_SECRET` | `Your JWT Secret Key` |
   | `CLIENT_URL` | `*` (or your Vercel URL once created in Step 3) |
6. Click **Create Web Service**.
7. Wait 1-2 minutes for the build to finish. Once live, copy your backend URL:
   > 📌 Example: `https://routineos-backend.onrender.com`

---

## 🌐 Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository.
4. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `RoutineOS/frontend` *(or `frontend`)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://routineos-backend.onrender.com` *(Your Render backend URL from Step 2)* |
6. Click **Deploy**.
7. Vercel will build and deploy your app in ~30 seconds!
8. Click the generated live URL to open your production **RoutineOS** app! 🎉

---

## 🔄 Step 4: Final Link (Optional Best Practice)

Once you have your live Vercel URL (e.g., `https://routine-os.vercel.app`):
1. Go back to your Render backend dashboard ➔ **Environment**.
2. Update `CLIENT_URL` to `https://routine-os.vercel.app`.
3. Save changes (Render will automatically re-deploy in seconds).

---

## 🛠️ Alternative Deployment (Netlify)

If you prefer **Netlify** instead of Vercel:
1. In Netlify, click **Add new site** ➔ **Import an existing project**.
2. Select your repository.
3. Base directory: `RoutineOS/frontend`
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Environment variable: `VITE_API_URL` = `https://your-backend-url.onrender.com`
7. Click **Deploy**. *(The included `_redirects` file handles client-side routing automatically)*.
