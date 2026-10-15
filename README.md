# ⚡ HustleKit AI

> **A Polished AI-Powered Business Toolkit for Solo Entrepreneurs & Small Online Sellers**  
> Built for hackathons, creators, indie makers, and solo commerce stores.

---

## 🌟 Overview & Architecture

HustleKit AI provides solo operators with a unified commerce command center and AI copywriting studio without bloated enterprise software or complex prompt engineering.

The foundation is built as a decoupled, clean TypeScript architecture:
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons.
- **Backend**: Node.js, Express, TypeScript, modular routes, strictly-typed domain models.
- **AI & Data Policy**: Includes a realistic e-commerce demo dataset and a transparent template & heuristic generation engine. No fake AI claims or hardcoded keys; live provider keys can be attached via standard environment variables.

---

## 🗂️ Project Structure

```text
hustlekit-ai/
├── package.json               # Root scripts for running frontend + backend concurrently
├── README.md                  # Complete documentation and setup guide
├── backend/                   # Node.js + Express + TypeScript API server
│   ├── .env.example           # Backend environment variable template
│   ├── .env                   # Local backend configuration
│   ├── package.json           # Backend dependencies and scripts
│   ├── tsconfig.json          # TypeScript compiler configuration
│   └── src/
│       ├── server.ts          # Express server with CORS, logging, and error handling
│       ├── types/
│       │   └── index.ts       # Shared TypeScript domain interfaces
│       └── routes/
│           ├── health.routes.ts    # Health check endpoint (GET /api/health)
│           ├── content.routes.ts   # AI marketing copy generator (POST /api/generate)
│           ├── products.routes.ts  # Inventory management (GET/POST /api/products)
│           ├── insights.routes.ts  # Sales metrics & forecast (GET /api/insights)
│           └── settings.routes.ts  # Store configuration (GET/PUT /api/settings)
└── frontend/                  # React + Vite + TypeScript + Tailwind CSS application
    ├── .env.example           # Frontend environment variable template
    ├── .env                   # Local client environment config (VITE_API_URL)
    ├── index.html             # HTML entry with Inter & Plus Jakarta Sans typography
    ├── package.json           # Frontend dependencies and build scripts
    ├── postcss.config.js      # PostCSS configuration
    ├── tailwind.config.js     # Tailwind CSS theme with brand tokens & glassmorphism
    ├── tsconfig.json          # Project TypeScript config
    ├── tsconfig.app.json      # Client application TypeScript rules
    └── src/
        ├── App.tsx            # Main application shell with cross-page routing & state
        ├── index.css          # Tailwind directives, dark theme tokens, and custom scrollbars
        ├── main.tsx           # React DOM root mounting
        ├── types/
        │   └── index.ts       # Frontend TypeScript definitions
        ├── services/
        │   └── api.ts         # Centralized API client service with fetch wrappers
        ├── components/
        │   ├── Badge.tsx      # Multi-variant badge (demo, success, warning, danger)
        │   ├── StatCard.tsx   # Revenue & telemetry stat cards with trend metrics
        │   ├── SalesChart.tsx # Interactive SVG revenue curve with projection toggles
        │   ├── Sidebar.tsx    # Responsive navigation bar with quick action links
        │   ├── TopBar.tsx     # Header bar with real-time backend health check status
        │   ├── EmptyState.tsx # Polished empty state with action triggers
        │   └── Toast.tsx      # Floating toast notification system
        └── pages/
            ├── DashboardPage.tsx     # Revenue stats, SVG velocity chart, inventory & CTA
            ├── ProductStudioPage.tsx # Copywriting generator, multi-format selector & preview
            ├── SalesInsightsPage.tsx # Telemetry, forecast projection, and AI action cards
            └── SettingsPage.tsx      # Store identity, API health ping, and sandbox controls
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 1. Installation
Install all dependencies across root, backend, and frontend with a single command:
```bash
npm run install:all
```
*(Or install manually in each folder: `cd backend && npm install`, then `cd ../frontend && npm install`)*

---

### 2. Environment Variables

Templates are provided in `.env.example` files:

#### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Gemma 2 Model Provider Configuration (OpenAI-compatible)
# Supported providers: OpenRouter (https://openrouter.ai), Groq, Together AI, or local Ollama
GEMMA_API_KEY=your_api_key_here
GEMMA_API_BASE_URL=https://openrouter.ai/api/v1
GEMMA_MODEL=google/gemma-2-9b-it

# Execution Controls
# Set to 'false' to enforce real inference (returns clear error when key is missing)
# Set to 'true' to explicitly permit offline heuristic templates
ENABLE_MOCK_FALLBACK=false

GEMMA_TIMEOUT_MS=15000
GEMMA_MAX_TOKENS=800
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_ENV=development
```

---

### 3. Running in Development Mode

You can run both backend and frontend concurrently from the root directory:
```bash
npm run dev
```

Alternatively, run each service independently in separate terminal windows:
- **Terminal 1 (Backend)**:
  ```bash
  cd backend
  npm run dev
  ```
  *Server starts on `http://localhost:5000`*

- **Terminal 2 (Frontend)**:
  ```bash
  cd frontend
  npm run dev
  ```
  *Frontend starts on `http://localhost:5173`*

---

### 4. Running Verification Checks & Builds

To verify code correctness, type-safety, and production build viability:
```bash
# Build both services
npm run build

# Or individually:
npm run build:backend
npm run build:frontend
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status, uptime, version, and AI engine status |
| `GET` | `/api/products` | Retrieve store inventory and demo products |
| `POST` | `/api/products` | Add a new product to inventory |
| `GET` | `/api/insights` | Retrieve sales telemetry, chart history, forecast, and recommendations |
| `POST` | `/api/generate` | Generate marketing copy, SEO tags, or customer replies |
| `GET` | `/api/settings` | Retrieve store configuration |
| `PUT` | `/api/settings` | Update store configuration |

---

## 🎯 Key Functional Features

1. **Dashboard**:
   - Live revenue summary cards with percentage change indicators.
   - Interactive SVG sales velocity curve with revenue and order volume views.
   - Clear "Turn Product Ideas Into High-Converting Sales Copy" call to action banner.
   - Recent inventory table with 1-click "Create Copy" action that preloads the SKU directly into the studio.
   - "Add Product" modal with immediate state updates.

2. **AI Product Studio**:
   - Product details form (Title, Category, Price, Audience, Key Features chips).
   - 4 Content types: Product Description, SEO Title & Meta, Promotional Social Message, Customer Support Reply.
   - 5 Copywriting tones: Persuasive, Luxurious, Friendly, Concise, Witty.
   - Live generation with word count, character count, recommended tags, and target channels.
   - Quick "Copy to Clipboard" with toast feedback and inline edit mode.

3. **Sales Insights**:
   - Multi-channel revenue distribution (Shopify Direct, Instagram Reels, Etsy, Newsletter).
   - AI Linear-EWMA 30-day forecast projection with confidence scoring.
   - Prioritized AI action cards (Inventory restocking, Flash promo campaigns, SEO refresh, Price testing) with 1-click execution.

4. **Settings & Telemetry**:
   - Store identity and target market setup.
   - Live Backend Health Ping test button with direct uptime feedback.
   - Clear distinction of Demo Data mode with instant reload button.
