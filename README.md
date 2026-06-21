# AASHA Connect

### Offline-First Digital Healthcare Companion for ASHA Workers

AASHA Connect is a smart healthcare data collection and management platform designed for ASHA (Accredited Social Health Activist) workers operating in rural and low-connectivity regions.

The platform enables healthcare workers to collect, manage, and synchronize family health records even without internet connectivity, ensuring uninterrupted healthcare services in remote areas.

---

## Problem Statement

ASHA workers often work in villages and low-network areas where internet connectivity is unreliable.

Traditional healthcare record systems require continuous internet access, making it difficult to:

* Register families
* Maintain health records
* Track beneficiaries
* Synchronize healthcare data
* Generate reports

AASHA Connect solves this challenge through an **Offline-First Architecture** using IndexedDB and automatic cloud synchronization.

---

# Key Features

## ASHA Worker Management

* ASHA Worker Registration
* Secure Login System
* Worker Status Management
* Area-wise Worker Assignment

---

##  Family Registration

* Add New Families
* Family Head Information
* Address Management
* Contact Information
* Notes & Observations

---

##  Offline-First Functionality

* IndexedDB Local Storage
* Dexie.js Integration
* Works without Internet
* Automatic Data Synchronization
* Pending Sync Queue

---

##  Smart Sync Engine

* Offline Data Queue
* Sync on Internet Availability
* Sync Progress Tracking
* Duplicate Prevention
* Local-to-Cloud Synchronization

---

## Authentication & Security

* Admin Authentication
* Worker Authentication
* Session Management
* Route Protection
* Secure Dashboard Access

---

## OCR Smart Autofill

Upload or capture Aadhaar card images and automatically extract:

* Name
* Aadhaar Number
* Date of Birth
* Gender
* Address
* PIN Code

Features:

* OCR-Based Text Extraction
* Confidence Scoring
* Editable Verification Screen
* Manual Correction Support

---

##  Voice Assistant

Healthcare workers can use voice commands to:

* Fill forms faster
* Reduce typing effort
* Improve accessibility
* Support field operations

---

## Analytics Dashboard

Visual insights for administrators:

* Total Families
* Registered Workers
* Pending Sync Records
* Family Statistics
* Operational Metrics

---

## Mobile-Friendly Design

Designed specifically for:

* ASHA Workers
* Rural Healthcare Staff
* Community Health Programs
* Low-End Android Devices

---

# System Architecture

```text
ASHA Worker
      │
      ▼
Frontend (HTML/CSS/JavaScript)
      │
      ├── IndexedDB (Offline Storage)
      │
      └── Sync Engine
              │
              ▼
Backend (Node.js + Express)
              │
              ▼
MongoDB Database
```

---

# Technology Stack

## Frontend

* HTML5
* CSS3
* JavaScript
* Dexie.js
* IndexedDB

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Additional Libraries

* Tesseract.js (OCR)
* Web Speech API
* Chart.js

---

# Project Structure

```text
AASHA-CONNECT
│
├── admin/
├── worker/
├── family/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   └── server.js
│
├── assets/
├── README.md
└── package.json
```

---

# ⚙ Installation Guide

## Clone Repository

```bash
git clone https://github.com/anujaz03/AASHA-CONNECT.git
```

## Navigate to Project

```bash
cd AASHA-CONNECT
```

## Install Backend Dependencies

```bash
cd backend
npm install
```

## Start MongoDB

Ensure MongoDB is running locally.

---

## Start Backend Server

```bash
npm start
```

or

```bash
node server.js
```

---

## Launch Frontend

Open:

```text
http://localhost:3000
```

---

# 📸 Screenshots

### Admin Login

(Add Screenshot Here)

### Admin Dashboard

(Add Screenshot Here)

### Family Registration

(Add Screenshot Here)

### OCR Smart Autofill

(Add Screenshot Here)

### Family Records

(Add Screenshot Here)

---

# Future Enhancements

* Family Member Health Records
* Vaccination Tracking
* High-Risk Pregnancy Detection
* Child Nutrition Monitoring
* Geo-Tagging
* PWA Support
* Government Health Scheme Integration
* ABDM Integration
* Advanced AI Health Insights

---

# Impact

AASHA Connect empowers frontline healthcare workers by enabling:

* Faster Data Collection
* Improved Rural Healthcare Management
* Reliable Offline Operations
* Better Health Monitoring
* Increased Administrative Efficiency

---

# Author

### Anuja Zade

MCA Student | Web Developer | Data Analytics Enthusiast

GitHub:
https://github.com/anujaz03

---

## If you found this project useful, consider giving it a Star.
