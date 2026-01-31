# 📦 Storage Drive - Personal Cloud Storage Application

A professional, secure, and full‑featured **personal cloud storage system** built using the **MERN stack** (MongoDB, Express, React, Node.js). Storage Drive provides users with a smooth, premium, and intuitive cloud experience—allowing effortless file uploads, folder navigation, sharing, permissions management, and real-time storage tracking.

---

## 🚀 Key Features

### 🔐 **Authentication & Security**
- **Multiple Login Methods:** Email/Password (OTP Verified), Google OAuth, and GitHub OAuth.
- **Secure Session Handling:** Redis-powered session store with signed cookies and **multi-device session limiting**.
- **Role-Based Access Control (RBAC):** Granular permissions with `Owner`, `Admin`, `Manager`, and `User` roles.
- **Advanced Sanitization:** Automated input sanitization using **DOMPurify** to eliminate XSS risks.
- **Reliable Validation:** Comprehensive schema validation using **Zod**.
- **Transaction Integrity:** Mongoose Transactions for atomic operations (e.g., user creation with root directory).

### 📂 **Cloud File Management**
- **AWS S3 Integration:** High-performance file storage with multipart upload support.
- **CloudFront Content Delivery:** Secure file access via **CloudFront Signed URLs** for low-latency streaming and downloads.
- **Intelligent Navigation:** Folder-based structure with breadcrumbs and nested directory support.
- **Optimistic Locking:** Prevent data corruption during simultaneous file renames.
- **Advanced Previews:** Seamless previewing for Images, PDFs, Videos, Audio, and Text files.

### 🤝 **Collaborative Sharing**
- **Role-Based Sharing:** Share files/folders with specific users as `Viewer` or `Editor`.
- **Public/Protected Share Links:** Generate temporary or permanent share links with configurable access levels.
- **Direct Access Management:** Real-time permission updates and access revocation for shared resources.

### 💳 **Storage & Subscriptions**
- **Flexible Plans:** Subscription-based storage tiers integrated with **Razorpay**.
- **Storage Quotas:** Real-time tracking of used space vs. plan limits.
- **Seamless Upgrades:** Direct integration for plan transitions and storage expansion.

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
- **Styling:** Vanilla CSS (Custom premium design system) / Tailwind CSS v4 support.
- **Routing:** React Router DOM
- **State Management:** Context API + Custom Hooks
- **Icons:** React Icons

### ⚡ **Backend (Server)**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Caching/Sessions:** Redis (Redis Cloud integration)
- **Cloud Services:** AWS S3 (Storage), AWS CloudFront (CDN)
- **Payments:** Razorpay

---

## ⚙️ Installation & Setup Guide

### 📌 Prerequisites
- Node.js v18+
- MongoDB (Atlas recommended)
- Redis Server (Redis Cloud recommended)
- AWS Account (S3 Bucket & CloudFront Distribution)
- Razorpay Account (for subscriptions)

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

##  Folder Structure
```
Storage-Drive/
├── client/                # React Frontend
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

---

## 📝 License
Licensed under the **ISC License**.

---

## 📞 Contact
**Varun Mendre** – Developer & Maintainer
Project Link: [https://github.com/VarunMendre/Personal-Cloud-Drive](https://github.com/VarunMendre/Personal-Cloud-Drive)
