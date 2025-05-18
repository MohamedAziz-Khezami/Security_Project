# SecureTransfer: File & Image Encryption Platform

## Project Overview & Purpose

**SecureTransfer** is a full-stack application designed to provide robust encryption and decryption services for files and images. It empowers users to securely encrypt, decrypt, and partially process files and images using a variety of cryptographic algorithms, all through a modern web interface. The platform is ideal for individuals and organizations seeking to protect sensitive data with advanced cryptographic techniques.



[SecureTransfer.app](https://security-project-eta.vercel.app/)


## Security Disclaimer

This app is intended for educational and moderate-security use cases. For high-security or enterprise-grade environments, ensure proper key management, use of secure channels (HTTPS), and regular security audits.


## Key Features

- **File Encryption/Decryption:** Supports AES, ECC, RSA, 3DES, and more.
- **Partial Encryption:** Encrypt or decrypt only selected regions of text files or images.
- **Image Encryption:** Advanced image encryption with region selection and multiple algorithms.
- **Key Generation:** Generate RSA key pairs directly from the UI.
- **Modern UI:** Responsive, accessible, and user-friendly frontend built with Next.js and Tailwind CSS.
- **API-first:** Well-documented FastAPI backend for easy integration and extension.

(**Partial encryption** allows users to encrypt only selected sections of a file or image, ideal for scenarios where full encryption is unnecessary or when preserving partial readability is desired.)

---

## System Architecture

```
[ User (Browser) ]
        |
        v
[ Next.js Frontend (React, Tailwind) ]
        |
        v
[ FastAPI Backend (Python) ]
        |
        v
[ (Optional) Database / File Storage ]
```

- **Frontend:** Next.js app for user interaction, form handling, and visualization.
- **Backend:** FastAPI app for cryptographic operations and API endpoints.
- **Communication:** RESTful API (JSON, multipart/form-data).
- **(Optional) Storage:** Can be extended to use persistent storage for files/keys.

---

# Backend: FastAPI App (`backend`)

## Tech Stack

- **Python 3.10+**
- **FastAPI** (API framework)
- **Pydantic** (data validation)
- **Cryptography, PyCryptodome** (crypto algorithms)
- **Pillow, OpenCV** (image processing)
- **Uvicorn** (ASGI server)
- **Starlette** (ASGI toolkit)
- **python-dotenv** (env config)

## Directory Structure

```
backend/
├── requirements.txt
└── app/
    ├── main.py              # FastAPI entry point
    ├── api/
    │   └── routes.py        # API endpoints
    ├── services/
    │   ├── encryption_service.py
    │   └── image_service.py
    ├── schemas/
    │   └── encryption.py    # Pydantic models
    └── core/
        └── config.py        # App settings/config
```

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd Security_Project/backend
   ```

2. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

- **Environment Variables:**  
  The backend uses Pydantic settings (see `core/config.py`).  
  You can create a `.env` file in `backend/` to override defaults:


## API Documentation

- **Interactive Docs:**  
  Once running, visit [http://localhost:8000/docs](http://localhost:8000/docs) for Swagger UI.

- **Key Endpoints:**
  - `POST /api/encrypt` — Encrypt or decrypt files (supports partial encryption).
  - `POST /api/generate-rsa-keys` — Generate RSA key pairs.
  - `POST /api/image/partial-encrypt` — Partial image encryption/decryption.


  See `app/api/routes.py` for full details.



## Running the Backend

- **Development:**
  ```bash
  uvicorn app.main:app --reload
  ```
  The API will be available at [http://localhost:8000](http://localhost:8000).

- **Production:**  
  Use a production ASGI server (e.g., Gunicorn with Uvicorn workers).

---

# Frontend: Next.js App (`frontend`)

## Tech Stack

- **Next.js 15 (React 19)**
- **TypeScript**
- **Tailwind CSS**
- **Radix UI** (UI primitives)
- **Zod** (validation)
- **date-fns, recharts, embla-carousel** (utilities & charts)

## Directory Structure

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── image-encryption/
│       └── page.tsx
├── components/
│   ├── image-encryption.tsx
│   ├── file-encryption.tsx
│   ├── theme-provider.tsx
│   └── ui/                # UI primitives (buttons, dialogs, etc.)
├── styles/
│   └── globals.css
├── public/
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Installation & Setup

1. **Install dependencies:**
   ```bash
   cd Security_Project/frontend
   npm install
   # or
   pnpm install
   ```

## Configuration

- **Environment Variables:**  
  Create a `.env.local` file for runtime config (e.g., API URLs):
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8000/api
  ```

- **TypeScript:**  
  Configured via `tsconfig.json` (strict mode enabled).

- **Tailwind CSS:**  
  Configured via `tailwind.config.ts`.

## Development & Build Commands

- **Start development server:**
  ```bash
  npm run dev
  # or
  pnpm dev
  ```
  Visit [http://localhost:3000](http://localhost:3000).

- **Build for production:**
  ```bash
  npm run build
  npm start
  ```

- **Linting:**
  ```bash
  npm run lint
  ```



---

# Usage

## Running Locally

1. **Start the backend:**
   ```bash
   cd Security_Project/backend
   uvicorn app.main:app --reload
   ```

2. **Start the frontend:**
   ```bash
   cd Security_Project/frontend
   npm run dev
   ```

3. **Access the app:**  
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running in Production

- **Backend:**  
  Deploy with a production ASGI server (e.g., Gunicorn + Uvicorn).

- **Frontend:**  
  Build and serve with `npm run build` and `npm start`, or deploy to Vercel/Netlify.

---

# Contributing

1. Fork the repository and create a feature branch.
2. Follow code style guidelines (TypeScript strict, Python PEP8).
3. Add tests for new features.
4. Submit a pull request with a clear description.

---


