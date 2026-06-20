# ApexReal Estate - Modern AI-Powered MERN Stack Marketplace

A robust, enterprise-grade real estate marketplace built with the MERN stack, featuring dynamic localization, dynamic production routing, and advanced Generative AI integrations for intelligent property analysis and security optimization.

## 🚀 Live Demo
- **Front-End (Production):** `https://mern-estate-client-xtpi.onrender.com/`
- **Back-End API Endpoint:** `https://mern-estate-api-l4oy.onrender.com`

## ✨ Core Features

- **🤖 AI-Powered Listing Suite (OpenAI `gpt-4o-mini`):**
  - **Bilingual SEO Content Generator:** Automatically generates high-converting, SEO-optimized, bilingual (Arabic/English) property descriptions and titles based on raw property attributes.
  - **Smart Evaluation & Rent/Sale Pricing Guide:** Analyzes real-time property details to suggest the most competitive and optimized market price for landlords and sellers.
  - **Buyer/Tenant Price Analysis:** Provides instant end-user feedback, explaining transparently whether the listed owner's price is fair, overpriced, or a good deal based on neighborhood benchmarks.

- **🔒 Advanced Security & Rate Limiting:**
  - **DDoS & Resource Abuse Prevention:** Implemented a strict rate-limiting mechanism on the AI features. If a user refreshes or spams the AI optimization tools more than 5 times within a single hour, the feature automatically suspends for that session to protect API usage and prevent cloud resource drainage.
  - **Secure Authentication:** Custom JWT-based authentication combined with Google OAuth, secure cookie handling, and robust CRUD operations for listing management.

- **🌍 Dynamic Localization & RTL Support:** Fully customized multi-language interface with automatic browser language detection (Defaulting to English, auto-switching to Arabic with full RTL styling support).

- **🌐 Advanced Search & Filtering:** High-performance filtering mechanism supporting multi-axis queries (pricing, types, offers, amenities) with seamless pagination.

- **🐳 Environment Agnostic Architecture:** Configured with centralized global environment tracking (`window.API_BASE_URL`) to seamlessly switch routing between `localhost` development configurations and Render production servers.

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS, Vite, Redux Toolkit
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, OpenAI API (GPT-4o-mini)
- **Deployment:** Render (Static Site & Web Service), GitHub

## 🔧 Installation & Local Setup

---
*Developed with ❤️ by Hanadi - Senior Full Stack Engineer.*