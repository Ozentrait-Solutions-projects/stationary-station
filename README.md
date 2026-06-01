# ⚡ NexCart — Full-Stack E-Commerce Store

NexCart is a state-of-the-art, premium full-stack e-commerce application. It features a modern user interface, highly responsive experience, secure JWT-based user authentication, shopping cart, wishlist, order management, promo code coupon systems, and interactive product reviews.

---

## 🚀 Live Deployments

| Service | Live URL |
| :--- | :--- |
| 🛒 **Frontend (Storefront)** | [https://stationary-v2z6.vercel.app](https://stationary-v2z6.vercel.app) |
| ⚙️ **Backend (REST API)** | [https://stationary-sigma.vercel.app/api/health](https://stationary-sigma.vercel.app/api/health) |

---

## 🛠️ Technology Stack

### **Frontend**
* **Core:** React, React Router (v7)
* **Styling:** TailwindCSS, Vanilla CSS, Glassmorphism
* **Animations:** Framer Motion
* **Icons:** Lucide React
* **HTTP Client:** Axios (configured with interceptors for auth tokens)

### **Backend**
* **Runtime:** Node.js
* **Framework:** Express
* **Database Driver:** `pg` (PostgreSQL client)
* **Security:** Helmet, BcryptJS (Password hashing), CORS integration
* **Logging & Compression:** Morgan, Compression

### **Database**
* **Engine:** PostgreSQL
* **Host:** Neon Serverless PostgreSQL (Cloud)

---

## 🔒 Demo Credentials

You can use the following default accounts to log in and explore both the customer and administration views:

| Role | Email | Password |
| :--- | :--- | :--- |
| 🔑 **Administrator** | `admin@nexcart.com` | `password123` |
| 👤 **Standard Customer** | `john@example.com` | `password123` |

---

## ✨ Features
* **Modern Premium Design:** Vibrant HSL color themes, glassmorphism, responsive navigation, and elegant micro-animations.
* **Authentication:** Secure login and registration with JSON Web Tokens (JWT) stored in LocalStorage.
* **Product Catalog:** List products by categories, search, filter, and sort by price or ratings.
* **Reviews & Ratings:** Interactive ratings on product detail pages.
* **Active Cart & Wishlist:** Live additions, quantity adjustments, and wishlist saves with persistent database storage.
* **Checkout & Coupons:** Coupon validation system supporting percentage-based discounts (e.g. `WELCOME20`, `NEXCART10`).
* **Admin Dashboard:** Access analytics, manage products, view stock status, and track orders (accessible via admin credentials).

---

## 💻 Local Setup & Development

### **Prerequisites**
* Node.js (v18+)
* Local PostgreSQL database

### **1. Setup Backend**
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and set your credentials:
   ```env
   ```
4. Run migrations & seed data:
   ```bash
   npm run setup
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

### **2. Setup Frontend**
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
