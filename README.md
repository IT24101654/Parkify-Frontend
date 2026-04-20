# 🚗 Parkify Smart Parking Management System

A modern full-stack **Smart Parking & Vehicle Service Platform** designed to simplify parking discovery, reservation, payments, and management through a web and mobile ecosystem.

---

# 📌 Project Overview

Parkify is a **web + mobile-based smart parking solution** that enables users to find parking spaces, make reservations, manage parking facilities, and access vehicle-related services in real time.

It supports both **web application (Spring Boot)** and **mobile application (React Native)**.

---

# 👥 User Roles

| Role             | Description                                      |
| ---------------- | ------------------------------------------------ |
| 🚗 Driver        | Searches and books parking spaces                |
| 🏢 Parking Owner | Manages parking slots and facilities             |
| 🛡️ Super Admin  | Controls approvals, users, and system monitoring |

---

# 🧩 System Modules

* User Management
* Parking Place Management
* Reservation Management
* Payment Management
* Vehicle Service Center Management
* Inventory Management
* AI Assistant Module

---

# 🛠️ Technology Stack

## 💻 Web Backend

* Java Spring Boot
* MySQL Database
* REST APIs
* Git & GitHub

## 🌐 Frontend (Web)

* HTML
* CSS
* JavaScript

## 📱 Mobile App

* React Native (Expo)
* React Navigation
* Axios (API Integration)
* Functional Components & Hooks

## 🗺️ Maps Integration

* Google Maps (Navigation & Location Services)

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

# 📱 Mobile App Features (Parkify App)

* Secure login & registration system
* Real-time API-based data fetching
* Fully dynamic UI (no hardcoded data)
* Form validation for better UX
* Smooth navigation between modules

---

# 👨‍💻 Team Members & Responsibilities

| Registration Number | Name                        | Module                            |
| ------------------- | --------------------------- | --------------------------------- |
| IT24101654          | HASARINDA W.D.Y.L.          | User Management + AI Assistant    |
| IT24102636          | DISSANAYAKE R.P.Y.R.        | Parking Place Management          |
| IT24101671          | MUNTHAS F.M.                | Reservation Management            |
| IT24101820          | VIKIRUTHAN P.               | Payment Management                |
| IT24100902          | CHANDANAYAKE M.W.H.A.       | Inventory Management              |
| IT24100036          | SURENTHIRAN K.              | Vehicle Service Center Management |

---

# 🏗️ Backend Architecture

```
src/main/java/
 ├── controller/   → Handles HTTP requests
 ├── service/      → Business logic layer
 ├── repository/   → Database access layer
 └── entity/       → Data models
```

---

# 📦 Mobile App Setup

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

➡️ Scan QR code using **Expo Go** app

---

# 🗄️ Database Setup

```sql
CREATE DATABASE smart_parking_db;
```

Update `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_parking_db
spring.datasource.username=root
spring.datasource.password=your_password
```

---

# 📊 Future Enhancements

* 📱 Native Android/iOS deployment
* 🔔 Real-time notifications
* 📡 Live parking slot tracking
* 🤖 AI-based parking prediction system
* 💳 Payment gateway integration
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
