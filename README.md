# 📦 CloudVault (Storage Drive) - Personal Cloud Storage Application

A professional, secure, and full‑featured **personal cloud storage system** built using the **MERN stack** (MongoDB, Express, React, Node.js). CloudVault (Storage Drive) provides users with a smooth, premium, and intuitive cloud experience—allowing effortless file uploads, folder navigation, sharing, permissions management, real-time storage tracking, and seamless external imports.

---

## 🚀 Key Features

### 🔐 **Authentication & Security**
- **Multi-Method Login:** Support for traditional Email/Password, Google OAuth, and GitHub OAuth.
- **Secure Registration:** 2-step registration process with mandatory **Email OTP Verification**.
- **Password Security:** Built-in password strength indicator to ensure robust user credentials.
- **Secure Session Handling:** Redis-powered session store with signed cookies.
- **Multi-Device Session Management:** Intelligent eviction logic that notifies users and logs them out if they log in from another device (based on subscription limits).
- **Role-Based Access Control (RBAC):** Granular permissions with `Owner`, `Admin`, `Manager`, and `User` roles.
- **Advanced Sanitization:** Automated input sanitization using **DOMPurify** to eliminate XSS risks.
- **Reliable Validation:** Comprehensive schema validation using **Zod**.
- **Transaction Integrity:** Mongoose Transactions for atomic operations (e.g., user creation with root directory).

### 📂 **Intelligent File Management**
- **High-Performance Uploads:** AWS S3 Integration with multipart/direct upload support, progress tracking, multiple file selections, and cancellation.
- **External Imports:** Seamlessly import files directly from **Google Drive** using the integrated Google Picker.
- **CloudFront Content Delivery:** Secure file access via **CloudFront Signed URLs** for low-latency streaming and downloads.
- **Intelligent Navigation:** Folder-based structure with breadcrumbs and nested directory support.
- **Smart Actions:** Rename (with automated extension protection), Delete (safely remove), View/Download.
- **Optimistic Locking:** Prevent data corruption during simultaneous file renames.
- **Advanced Previews:** Seamless previewing for Images, PDFs, Videos, Audio, and Text files.
- **View Modes:** Toggle between **List View** and **Grid View** based on user preference.
- **Smart Search & Sort:** Efficiently find files with real-time search and sorting by name, date, or size.

### 🤝 **Collaborative Sharing**
- **Public & Private Share Links:** Generate temporary or permanent share links with configurable access levels.
- **Granular Permissions:** Control access by assigning **Viewer** or **Editor** roles to collaborators.
- **Collaboration Dashboard:** Dedicated "Shared with Me" and "Shared by Me" views to track all shared resources.
- **Management Center:** Centralized page to manage and revoke permissions for any shared item, with real-time permission updates.

### 💳 **Storage & Subscriptions**
- **Tiered Plans:** Flexible plans (Free, Standard, Premium) with varying storage limits and device access.
- **Razorpay Integration:** Fully integrated payment gateway for secure monthly or yearly subscription renewals.
- **Storage Quotas:** Real-time tracking of used space vs. plan limits.
- **Restriction Logic:** Graceful handling of "Paused", "Expired", or "Halted" subscriptions, limiting actions like uploads, downloads, and deletions.
- **Smooth Redirects:** Visual countdown and status polling during subscription activation.

---

## 📸 Visual Tour & Features

### 🏠 Home & Dashboard
Experience a clean and intuitive dashboard for all your cloud storage needs.

| ![Home Screen 1](Screenshots/home/1.png) | ![Home Screen 2](Screenshots/home/2.png) |
| :---: | :---: |
| ![Home Screen 3](Screenshots/home/3.png) | ![Home Screen 4](Screenshots/home/4.png) |

---

### 🤝 Collaborative Sharing & Security
Manage file sharing and permissions with ease.

| ![Sharing 1](Screenshots/sharing/5.png) | ![Sharing 2](Screenshots/sharing/6.png) |
| :---: | :---: |
| ![Sharing 3](Screenshots/sharing/7.png) | ![Sharing 4](Screenshots/sharing/8.png) |
| ![Sharing 5](Screenshots/sharing/9.png) | ![Sharing 6](Screenshots/sharing/10.png) |
| ![Sharing 7](Screenshots/sharing/11.png) | ![Sharing 8](Screenshots/sharing/12.png) |
| ![Sharing 9](Screenshots/sharing/13.png) | ![Sharing 10](Screenshots/sharing/14.png) |

---

### 🔐 Role-Based Access Control (RBAC)
Granular access control for teams and individuals.

| ![RBAC 1](Screenshots/RBAC/15.png) | ![RBAC 2](Screenshots/RBAC/16.png) |
| :---: | :---: |
| ![RBAC 3](Screenshots/RBAC/17.png) | ![RBAC 4](Screenshots/RBAC/18.png) |
| ![RBAC 5](Screenshots/RBAC/19.png) | |

---

### 💳 Subscription & Payments
Flexible plans integrated with Razorpay for seamless storage upgrades.

| ![Subscription 1](Screenshots/Subscription/23.png) | ![Subscription 2](Screenshots/Subscription/24.png) |
| :---: | :---: |
| ![Subscription 3](Screenshots/Subscription/25.png) | ![Subscription 4](Screenshots/Subscription/26.png) |
| ![Subscription 5](Screenshots/Subscription/27.png) | ![Subscription 6](Screenshots/Subscription/28.png) |

---

### ⚙️ Account Settings
Customize your profile and manage account security.

| ![Settings 1](Screenshots/Settings/20.png) | ![Settings 2](Screenshots/Settings/21.png) |
| :---: | :---: |
| ![Settings 3](Screenshots/Settings/22.png) | |

---

## 🏗️ Tech Stack Overview

### 🎨 **Frontend (Client)**
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS v4 & Vanilla CSS (Custom premium design system)
- **Routing:** React Router v7
- **State Management:** Context API + Custom Hooks
- **Icons:** Lucide-React & React-Icons
- **Security & Utilities:** DOMPurify, Input-OTP, Tailwind-Merge, Clsx

### ⚡ **Backend (Server)**
- **Runtime:** Node.js (v22.x)
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Caching/Sessions:** Redis (Redis Cloud integration)
- **Cloud Services:** AWS S3 (Storage), AWS CloudFront (CDN)
- **Payments:** Razorpay
- **Emails:** Resend
- **Other:** Serverless deployment support

---

## ⚙️ Local Installation & Setup Guide

### 📌 Prerequisites
- Node.js v18+ (v22.x recommended)
- MongoDB (Atlas recommended)
- Redis Server (Redis Cloud recommended)
- AWS Account (S3 Bucket & CloudFront Distribution)
- Razorpay Account (for subscriptions)
- Resend Account (for Email OTPs)

---

### **1. Clone the Repository**
```bash
git clone <repository-url>
cd Storage-Drive
```

### **2. Setup Backend**
```bash
cd server
npm install
```

Create a `.env` file inside `server`:
```env
PORT=4000
MONGO_URI=your_mongodb_uri
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
MY_SECRET_KEY=your_session_secret
CLIENT_ORIGIN=http://localhost:5173

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
S3_BUCKET_NAME=...
CLOUDFRONT_DOMAIN=...
CLOUDFRONT_PRIVATE_KEY=...
CLOUDFRONT_KEY_PAIR_ID=...

# OAuth
GOOGLE_OAUTH_CLIENT_ID=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Payments
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### **3. Setup Frontend**
```bash
cd client
npm install
```
Start the application:
```bash
npm run dev
```

---

## ☁️ Production Deployment Guide (AWS EC2 + PM2)

Step-by-step instructions to launch an Ubuntu EC2 instance, deploy this backend, and keep it running with PM2.

### **1. Server Setup**
- Launch an Ubuntu 22.04/24.04 EC2 instance (t2.micro or larger).
- Assign an Elastic IP and open ports 80 (HTTP), 443 (HTTPS), 22 (SSH), and 4000 (Custom API Port).
- SSH into the server: `ssh -i "your-key.pem" ubuntu@<Elastic-IP>`

### **2. Install Dependencies**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential
# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### **3. Install PM2 and Start App**
```bash
sudo npm install -g pm2
git clone <your-repo-url>
cd Storage-Drive/server
npm install
# Configure your .env
nano .env 

pm2 start node --name "StorageApp" -- --env-file=.env app.js
pm2 save
pm2 startup
```

---

##  Folder Structure
```text
Storage-Drive/
├── client/                # React Frontend (Vite)
│   ├── src/
│   │   ├── apis/          # API & OAuth integration
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # State management
│   │   ├── lib/           # Utility functions
│   │   └── main.jsx       # App root & routing
├── server/                # Node.js Backend
│   ├── config/            # Database & Cloud service configs
│   ├── controllers/       # Business logic (Refactored/Standardized)
│   ├── models/            # Mongoose Schemas
│   ├── routes/            # API Endpoints
│   ├── services/          # External API integrations (AWS, OAuth, Razorpay)
│   ├── utils/             # Reusable Helpers (Response, Validation, Transactions)
│   └── validators/        # Zod Validation Schemas
└── README.md
```

---

## 📘 API Documentation Highlights

### **Authentication**
- `POST /auth/register` – OTP-based registration
- `POST /auth/login` – Traditional login
- `POST /auth/google-login` – Google OAuth sync
- `POST /auth/github-login` – GitHub OAuth sync
- `GET /auth/logout` – Session termination

### **File Operations**
- `POST /files/initiate-upload` – Prepare S3 multipart upload
- `POST /files/complete-upload` – Finalize file storage and metadata
- `PATCH /files/rename/:fileId` – Secure file renaming
- `DELETE /files/delete/:fileId` – File removal (S3 + DB)

### **Directory Management**
- `POST /directories/create` – Create new directory
- `GET /directories/get/:dirId` – List directory contents
- `DELETE /directories/delete/:dirId` – Recursive directory deletion

---

## 🛡️ Security & Reliability
- **Optimistic Locking:** Ensures data consistency during concurrent updates.
- **Signed CloudFront URLs:** Direct, secure file streaming without exposing S3 buckets.
- **Standardized Responses:** Unified `successResponse` and `errorResponse` helpers for predictable API behavior.
- **Redis Resilience:** Robust reconnection strategy and keep-alive heartbeats for cloud stability.
- **XSS Protection:** Automatic sanitization of all inputs using `DOMPurify`.

---

## 📝 License
Licensed under the **ISC License**.

---

## 📞 Contact
**Varun Mendre** – Developer & Maintainer
Project Link: [https://github.com/VarunMendre/Personal-Cloud-Drive](https://github.com/VarunMendre/Personal-Cloud-Drive)
