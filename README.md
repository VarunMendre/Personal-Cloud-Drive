# 📦 Storage Drive - Personal Cloud Storage Application

A professional, secure, and full‑featured **personal cloud storage system** built using the **MERN stack** (MongoDB, Express, React, Node.js). Storage Drive provides users with a smooth, premium, and intuitive cloud experience—allowing effortless file uploads, folder navigation, sharing, permissions management, and real-time storage tracking.

---

## 🚀 Key Features

### 🔐 **Authentication & Security**

- **Multiple Login Methods:** Email/Password, Google OAuth, GitHub OAuth.
- **Secure Session Handling:** Redis-powered session store with signed cookies.
- **Role-Based Access Control (RBAC):** Includes `Owner`, `Admin`, `Manager`, and `User` roles.
- **Advanced Security Headers:** Implemented via Helmet with custom CSP for iframe safety.
- **Input Validation & Sanitization:** Using **Zod** and **DOMPurify** to eliminate XSS and injection risks.
- **Rate Limiting:** Prevents brute-force and abusive requests.

---

### 📂 **File & Directory Management**

- **Clean & Intuitive UI:** Folder navigation, breadcrumbs, and smooth transitions.
- **File Operations:** Upload, rename, delete, and preview (Images, PDFs, Videos, Audio, Text).
- **Directory Management:** Create, rename, and navigate nested folder structures.
- **Context Menu Support:** Right-click for quick file/folder actions.
- **Storage Usage Indicator:** Real-time progress bar showing used vs. allocated space.

---

### 🤝 **Sharing & Collaboration**

- **Direct Sharing:** Share files/folders with any registered user via email.
- **Public Links:** Generate shareable links with `Viewer` or `Editor` permissions.
- **Permission Control:** Update, revoke, or modify roles for shared users.
- **Shared With Me:** Dedicated section for files and folders shared by others.

---

### 🛠️ **Admin Dashboard**

- **User Management:** View all users, update roles, soft delete, or restore accounts.
- **System File Overview:** Owners can view and manage all stored files.
- **Deletion Controls:** Soft and hard delete workflows for safer user handling.

---

## 🏗️ Tech Stack Overview

### 🎨 **Frontend (Client)**

- **Framework:** React (Vite)
- **Styling:** Tailwind CSS v4
- **Routing:** React Router DOM
- **State Management:** React Hooks
- **Icons:** React Icons

### ⚡ **Backend (Server)**

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Caching/Sessions:** Redis
- **Validation:** Zod + DOMPurify
- **Security:** Helmet, CORS, BCrypt, Cookie-Parser

---

## ⚙️ Installation & Setup Guide

### 📌 Prerequisites

- Node.js v18+
- MongoDB (Local or Atlas)
- Redis Server

---

### **1. Clone the Repository**

```bash
git clone <repository-url>
cd Storage-Drive
```

---

### **2. Setup Backend**

```bash
cd server
npm install
```

Create a `.env` file inside `server`:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/storage-drive
REDIS_URL=redis://localhost:6379
MY_SECRET_KEY=your_super_secret_key
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
RESEND_API_KEY=...
```

Run database initialization:

```bash
npm run setup
```

Start the backend:

```bash
npm run dev
```

---

### **3. Setup Frontend**

```bash
cd client
npm install
```

Create a `.env` file inside `client`:

```env
VITE_BASE_URL=http://localhost:4000
```

Start the React app:

```bash
npm run dev
```

---

## 🛡️ Security Highlights

- **Strict MongoDB Schema Validation:** Ensures all stored data matches the expected structure.
- **Custom CSP Policies:** Secure iframe embedding and restricted resource loading.
- **Secure Cookies:** HttpOnly, Signed, SameSite cookies safeguard against CSRF and XSS.

---

## 📝 License

Licensed under the **ISC License**.

---

## 📁 Folder Structure

```
Storage-Drive/
├── client/                # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── utils/
├── server/                # Node.js Backend
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── models/
│   ├── utils/
│   └── config/
├── scripts/               # Setup scripts
└── README.md
```

---

## 📘 API Documentation

### **Auth Routes**

- `POST /auth/register` – Create user account
- `POST /auth/login` – Login with email/password
- `GET /auth/google` – Google OAuth
- `GET /auth/github` – GitHub OAuth

### **File Routes**

- `POST /files/upload` – Upload file
- `GET /files/:id` – Fetch file metadata
- `DELETE /files/:id` – Delete file
- `PATCH /files/:id` – Rename file

### **Directory Routes**

- `POST /folders/create` – Create folder
- `GET /folders/:id` – Fetch folder contents

### **Sharing Routes**

- `POST /share` – Share file/folder
- `PATCH /share/permissions` – Modify permissions

> Full API documentation will be added soon.

---

## 🤝 Contribution Guidelines

We welcome contributions! Follow these steps:

1. **Fork** the repository
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Added new feature"
   ```
4. Push and create a **Pull Request**

### Code Style

- Use meaningful commit messages
- Follow existing linting & formatting rules
- Keep components small and reusable

### Reporting Issues

Feel free to open an issue for:

- Bugs
- Feature requests
- Security concerns

---

## 🛠️ Roadmap (Upcoming Enhancements)

- **AWS S3 Bucket Integration** – Move file storage to scalable cloud storage.
- **Payment Integration** – Add subscription plans using Razorpay / Stripe.
- **Deployments** – Production deployment guides for Render, Vercel, AWS EC2.

---

## 📞 Contact

For any support or collaboration opportunities: **Varun Mendre** – Developer & Maintainer For any support or collaboration opportunities: **Varun Mendre** – Developer & Maintainer

