# 🚗 Parkify Smart Parking Management System (MongoDB Stack)

A modern full-stack **Smart Parking & Vehicle Service Platform** designed to simplify parking discovery, reservation, payments, and management through a **web + mobile ecosystem** powered by **Node.js, Express, MongoDB, and React Native**.

---

# 📌 Project Overview

Parkify is a scalable **smart parking management system** that enables users to find parking spaces, make reservations, manage parking facilities, and access vehicle-related services in real time.

The system is built using a modern MERN-style architecture:

* 🖥️ Backend: Node.js + Express
* 🗄️ Database: MongoDB (Mongoose ODM)
* 📱 Mobile App: React Native (Expo)
* 🌐 Web/Admin UI: HTML, CSS, JavaScript (optional extension)

---

# 👥 User Roles

| Role             | Description                                      |
| ---------------- | ------------------------------------------------ |
| 🚗 Driver        | Searches and books parking spaces                |
| 🏢 Parking Owner | Manages parking slots and facilities             |
| 🛡️ Super Admin  | Controls approvals, users, and system monitoring |

---

# 🧩 System Modules

* User Management (Auth + Profiles)
* Parking Place Management
* Reservation Management
* Payment Management
* Vehicle Service Center Management
* Inventory Management
* AI Assistant Module

---

# 🛠️ Technology Stack

## 💻 Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* bcryptjs (Password hashing)

## 📱 Mobile App

* React Native (Expo)
* React Navigation
* Axios (API Integration)
* Functional Components & Hooks

## 🌐 Optional Web UI

* HTML
* CSS
* JavaScript

## 🗺️ Maps Integration

* Google Maps (Navigation & Location Services)

## 🔧 Tools

* Git & GitHub
* Postman (API Testing)
* MongoDB Compass

---

# 🚀 Key Features

## 🚗 Driver Features

* Search available parking spaces
* Book parking slots
* View reservation history
* Make payments
* Get navigation via Google Maps

## 🏢 Parking Owner Features

* Register parking locations
* Manage parking slots
* View reservations
* Track earnings
* Update availability

## 🛡️ Admin Features

* Approve/reject parking owners
* Manage users
* Monitor system activity
* Generate reports

---

# 📱 Mobile App Features (React Native)

* Secure login & registration (JWT Auth)
* Real-time API data fetching
* Fully dynamic UI (no hardcoded data)
* Form validation for better UX
* Smooth navigation between modules
* AI Assistant integration (chat support)

---

# 🏗️ Backend Architecture (Node.js)

```
backend/
 ├── models/        → Mongoose schemas
 ├── routes/        → API endpoints
 ├── controllers/   → Business logic
 ├── middleware/    → Auth & validation
 └── config/        → DB connection
```

---

# 🗄️ Database (MongoDB)

## Example Connection

```js
mongoose.connect("mongodb://localhost:27017/parkify");
```

## Example User Schema

```js
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
});
```

---

# 🔐 Authentication Flow

* User Registration → Password hashed using bcryptjs
* Login → JWT token generated
* Protected routes → JWT middleware validation

---

# 📦 Mobile App Setup (React Native)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/parkify.git
cd parkify
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Run App

```bash
npx expo start
```

➡️ Scan QR code using **Expo Go**

---

# ⚙️ Backend Setup (Node.js)

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Start Server

```bash
npm run dev
```

Server runs on:

```
http://localhost:5000
```

---

# 👨‍💻 Team Members & Responsibilities

| Registration Number | Name                        | Module                            |
| ------------------- | --------------------------- | --------------------------------- |
| IT24101654          | HASARINDA W.D.Y.L. (Leader) | User Management + AI Assistant    |
| IT24102636          | DISSANAYAKE R.P.Y.R.        | Parking Place Management          |
| IT24101671          | MUNTHAS F.M.                | Reservation Management            |
| IT24101820          | VIKIRUTHAN P.               | Payment Management                |
| IT24100902          | CHANDANAYAKE M.W.H.A.       | Inventory Management              |
| IT24100036          | SURENTHIRAN K.              | Vehicle Service Center Management |

---

# 🤖 AI Assistant Module

* AI-powered chat assistant
* Handles parking queries
* Suggests parking availability
* Integrated via backend API (`/api/ai/chat`)

---

# 📊 Future Enhancements

* 📱 Native Android/iOS build
* 🔔 Real-time notifications
* 📡 Live parking slot tracking
* 🤖 AI-based parking prediction system
* 💳 Stripe / online payment gateway
* 📷 Camera-based slot detection

---

# 🎓 Academic Information

**Faculty:** Faculty of Computing - SLIIT 2026

---

# ⭐ Support

If you like this project:

* ⭐ Star the repository
* 🍴 Fork it

---

# 📄 License

This project is developed for **academic purposes only**.
