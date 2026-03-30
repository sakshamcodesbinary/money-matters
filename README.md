# 🌑 Money-Matters: Institutional Capital Orchestration

**Money-Matters** is a high-precision financial orchestration system that transforms raw fiscal data into strategic capital roadmaps. It utilizes a sophisticated backend architecture to process user data through a custom-engineered intelligence layer, delivering institutional-grade financial advice.

---

## 🏗️ System Architecture

The Money-Matters backend is designed for high-fidelity data processing and secure orchestration.

### 1. Data Layer: Firebase & Firestore
*   **Atomic Data Mapping**: User financial states are stored as a consolidated `Db` type, mapping Income, Expenses, Debts, Investments, Assets, and Goals into a single, high-performance Firestore document. This reduces latency and ensures consistent state across the terminal.
*   **Secure Authentication**: Integrated with the Firebase Admin SDK for server-side token verification and identity management.

### 2. The Neural Core: Gemini AI Orchestrator
Our current intelligence layer is a specialized feature-engineered engine that bridges raw data with advanced generative reasoning.
*   **Current State: Neural Orchestration**: Utilizes `gemini-3.1-flash-lite-preview` for high-speed, multi-modal reasoning over structured financial DNA.
*   **Roadmap: Custom Advisory Integration**: Currently transitioning toward a fully **Custom-Trained Financial Advisory Model** for even deeper localized analytics and precision debt-equity orchestration (V4.x).
*   **Structured Intelligence**: The core returns strictly formatted JSON response objects, ensuring AI insights are reliably mapped to the UI without "hallucinations."

### 3. Logic Engine: Fiscal Computation
*   **Heuristic Health Scoring**: A custom algorithm calculates financial health based on four primary vectors: Savings Rate, Debt-to-Income, Emergency Fund Status, and Investment Diversity.
*   **Liquidation Logic**: Specialized routines for calculating debt-reduction paths (Snowball vs. Avalanche) integrated with real-time interest rate compounding.

---

## 🔄 System Workflow: "Inundation to Sovereignty"

The system follows a strictly defined four-phase data lifecycle:

### Phase 01: Inundation (Data Injection)
The user injects raw income and capital streams into the matrix. The backend validates and normalizes these streams into a standardized monthly velocity.

### Phase 02: Mapping (Velocity Analysis)
Every expense and liability is mapped against the income inundation. The system calculates the "Capital Alpha" (Monthly Surplus) and establishes the initial fiscal baseline.

### Phase 03: Liquidation (Neural Restructuring)
The Neural Core analyzes debts and EMIs. It generates a "Liquidation Roadmap" that prioritize high-interest liabilities, calculating potential interest savings and a "Debt-Free Date."

### Phase 04: Sovereignty (Goal Optimization)
The final phase involves cataloging assets and optimizing investments. The AI calculates the shortest path to user-defined goals (Retirement, Education, Home) based on the optimized fiscal state.

---

## 🛠️ Technical Stack
*   **Core Logic**: Next.js 16 (App Router) + Node.js Runtime.
*   **Intelligence**: Google Gemini API (Neural Orchestration).
*   **Data Hub**: Google Firestore (NoSQL Document Store).
*   **Identity**: Firebase Admin Auth.
*   **Fiscal Visuals**: Recharts (Data Visualization Engine).

---

## 🚀 Deployment & Environment

To initialize the backend terminal, the following environment variables are required:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
FIREBASE_SERVICE_ACCOUNT_JSON=...
FIREBASE_WEB_API_KEY=... # For Auth Identity Toolkit
GEMINI_API_KEY=... # For Predictive Intelligence Hub
```

---

## ⚖️ License
Internal Institutional Use Only. Part of the **SakshamCodesBinary** ecosystem.
