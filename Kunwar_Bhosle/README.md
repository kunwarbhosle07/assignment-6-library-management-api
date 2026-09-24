# Library Management System REST API

A production-grade, secure **Library Management System REST API** built with **Node.js**, **Express.js**, **Firebase Admin SDK (Firestore)**, **JWT Authentication**, and **Swagger UI**.

---

## 📌 Live Demo & Documentation
- **Live Base URL**: `https://library-management-api.onrender.com` *(Replace with your deployed Render URL)*
- **Interactive Swagger UI**: `https://library-management-api.onrender.com/api-docs` (Local: `http://localhost:5000/api-docs`)

![Swagger UI](screenshots/swagger-ui.png)

---

## 🚀 Features & Learning Outcomes

1. **Cloud Database with Firebase Admin SDK**:
   - Integrated with Firestore using the official `firebase-admin` SDK.
   - Atomic inventory updates and transaction locks using `db.runTransaction()` during book borrowing and returning to eliminate race conditions.
   - Smart fallback mechanism supporting both local file-based credentials (`serviceAccountKey.json`) and raw JSON string environment variable (`FIREBASE_SERVICE_ACCOUNT`).

2. **Role-Based Access Control (RBAC)**:
   - **Student**: Register, view book catalog, search/filter books, borrow books, return books, and view personal borrowing history.
   - **Librarian**: Secret-key registration, full CRUD over book catalog, view all system-wide borrow records, and generate overdue reports.

3. **Rate Limiting & Security Hardening**:
   - `express-rate-limit` protecting `/api/*` routes against brute-force & DoS attacks (100 requests per 15 mins per IP).
   - `trust proxy` configured for accurate IP rate limiting behind reverse proxies (Render).
   - Password hashing with `bcryptjs` (10 salt rounds).
   - JWT tokens signed with custom expiration.

4. **OpenAPI 3.0 Documentation**:
   - Interactive Swagger UI served at `/api-docs` using JSDoc `@swagger` annotations.

---

## 🛡️ Permission Matrix

| Operation | Endpoint | Student | Librarian | Public |
|---|---|:---:|:---:|:---:|
| Register Student | `POST /api/auth/register` | ✅ | ❌ | ✅ |
| Register Librarian | `POST /api/auth/register-librarian` | ❌ | ✅ | ✅ (w/ Secret) |
| User Login | `POST /api/auth/login` | ✅ | ✅ | ✅ |
| View Profile | `GET /api/auth/profile` | ✅ | ✅ | ❌ |
| Browse Book Catalog | `GET /api/books` | ✅ | ✅ | ✅ |
| View Single Book | `GET /api/books/:id` | ✅ | ✅ | ✅ |
| Add New Book | `POST /api/books` | ❌ | ✅ | ❌ |
| Update Book / Inventory | `PUT /api/books/:id` | ❌ | ✅ | ❌ |
| Remove Book | `DELETE /api/books/:id` | ❌ | ✅ | ❌ |
| Borrow Book | `POST /api/books/:id/borrow` | ✅ | ❌ | ❌ |
| Return Book | `POST /api/books/:id/return` | ✅ | ❌ | ❌ |
| View Personal History | `GET /api/books/my-history` | ✅ | ❌ | ❌ |
| View All Borrow Records | `GET /api/librarian/borrow-records` | ❌ | ✅ | ❌ |
| View Overdue Reports | `GET /api/reports/overdue` | ❌ | ✅ | ❌ |

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore (via Firebase Admin SDK)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Rate Limiting**: `express-rate-limit`
- **Documentation**: Swagger (`swagger-ui-express`, `swagger-jsdoc`)
- **Environment Management**: `dotenv` & `cors`

---

## ⚙️ Local Installation & Setup Guide

### 1. Clone & Install Dependencies
Navigate into the `Kunwar_Bhosle` directory:
```bash
cd assignment-6-library-management-api/Kunwar_Bhosle
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```

Fill in the `.env` variables:
```env
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000
JWT_SECRET=super_secret_jwt_key_for_local_testing_12345
JWT_EXPIRES_IN=1d
LIBRARIAN_SECRET_KEY=admin_secret_key_123
GOOGLE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

### 3. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com) and create a project.
2. Under **Build → Firestore Database**, create a database in **Production mode**.
3. Go to **Project Settings (Gear Icon) → Service accounts**.
4. Click **Generate new private key** to download the JSON file.
5. Move the downloaded JSON file to the project root (`Kunwar_Bhosle/`) and rename it `serviceAccountKey.json`.

> ⚠️ **IMPORTANT**: `serviceAccountKey.json` and `.env` are git-ignored. Never commit private credentials to public version control.

### 4. Start the Application
- **Development Mode** (with Nodemon):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```
- Access Swagger UI at `http://localhost:5000/api-docs`

---

## 🔑 How to Create a Librarian Account

To register a librarian account, send a `POST` request to `/api/auth/register-librarian` containing the `secretKey` field that matches the `LIBRARIAN_SECRET_KEY` set in `.env`:

```json
POST /api/auth/register-librarian
Header: Content-Type: application/json

{
  "name": "Head Librarian",
  "email": "librarian@university.edu",
  "password": "securepassword123",
  "secretKey": "admin_secret_key_123"
}
```

---

## 📡 Sample API Requests & Responses

### 1. Register Student
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@university.edu",
  "password": "password123"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Student account registered successfully.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "uid": "abc123docid",
      "name": "Jane Smith",
      "email": "jane@university.edu",
      "role": "student",
      "createdAt": "2026-03-01T12:00:00.000Z"
    }
  }
}
```

### 2. Borrow a Book (Atomic Transaction)
```http
POST /api/books/book_doc_101/borrow
Authorization: Bearer <student_jwt_token>
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Book borrowed successfully.",
  "data": {
    "id": "borrow_doc_999",
    "userId": "abc123docid",
    "bookId": "book_doc_101",
    "bookTitle": "Introduction to Algorithms",
    "borrowDate": "2026-03-01T14:00:00.000Z",
    "dueDate": "2026-03-15T14:00:00.000Z",
    "returnDate": null,
    "status": "borrowed"
  }
}
```

---

## ☁️ Deploying on Render

### Step 1: Push Repository to GitHub
Ensure you are inside `Kunwar_Bhosle`:
```bash
git init
git add .
git commit -m "Initial commit: Library Management API"
git branch -M main
git remote add origin https://github.com/<your-username>/itm-assignment-06-library-api.git
git push -u origin main
```

### Step 2: Create Web Service on Render
1. Sign in to [Render](https://render.com).
2. Click **New + → Web Service** and select `itm-assignment-06-library-api`.
3. Configuration settings:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Step 3: Configure Environment Variables on Render
Add the following key-value pairs in **Environment**:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `<long_random_secret_string>` |
| `JWT_EXPIRES_IN` | `1d` |
| `LIBRARIAN_SECRET_KEY` | `<your_librarian_secret>` |
| `BASE_URL` | `https://library-management-api.onrender.com` |
| `FIREBASE_SERVICE_ACCOUNT` | *Entire single-line JSON string of `serviceAccountKey.json`* |

> 💡 **Tip**: Convert `serviceAccountKey.json` to a single line using:
> `node -e "console.log(JSON.stringify(require('./serviceAccountKey.json')))"`

---

## ✅ Verification Checklist

- [x] Server starts cleanly and Swagger UI loads at `/api-docs`.
- [x] Student attempting to access `POST /api/books` receives **403 Forbidden**.
- [x] Librarian can successfully create, update, and delete books.
- [x] Atomic borrowing transaction decrements `availableCopies` and prevents negative inventory.
- [x] Atomic returning transaction increments `availableCopies` and records `returnDate`.
- [x] Prevent duplicate active borrow of the same book by the same student.
- [x] `GET /api/books/my-history` route ordering resolves before `/:id`.
- [x] `GET /api/reports/overdue` returns only active overdue records (`status === 'borrowed'` and `dueDate < now`).
- [x] Rate limiter blocks request spamming after 100 requests in 15 minutes with HTTP **429**.
- [x] All credentials git-ignored.
