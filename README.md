# ☁️ FynnCloud UI

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.0-00DC82.svg)](https://nuxt.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)](https://tailwindcss.com)


A modern, responsive web interface for **FynnCloud** - your self-hosted cloud storage solution.

## ⚠️ Development Status: Early Alpha

This project is in an **early development stage**.

* **API:** May break with backend changes.
* **Features:** In active development.
* **Stability:** Not recommended for production use yet.



## 🛠 Tech Stack

* **Framework:** [Nuxt 4](https://nuxt.com) (Vue 3.5)
* **Language:** TypeScript 5.0+
* **Styling:** [Tailwind CSS 4](https://tailwindcss.com)
* **Icons:** [@nuxt/icon](https://nuxt.com/modules/icon)
* **i18n:** [@nuxtjs/i18n](https://i18n.nuxtjs.org) (EN, DE, FR, IT)
* **Mode:** SPA (Server-Side Rendering disabled)

---

## ⚙️ Environment Variables

The application can be configured using the following environment variables. You can set these in your shell or via a `.env` file.

| Variable | Description | Default / Fallback |
| --- | --- | --- |
| `NUXT_PUBLIC_API_BASE` | Backend API base URL (e.g., `http://localhost:8080`) | Auto-detected from request |

---

## 🚀 Development

### Install Dependencies

```bash
npm install
```

### Development Server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

---

## 📦 Production

### Build for Production

Build the application for production:

```bash
npm run generate
```

### Preview Production Build

Locally preview the production build:

```bash
npm run preview
```

### Docker Deployment

A Dockerfile is included for containerized deployment. (preferred)

---

## 🌍 Internationalization

The UI supports multiple languages:
- 🇬🇧 English (default)
- 🇩🇪 German
- 🇫🇷 French
- 🇮🇹 Italian

Language files are located in the `i18n/` directory.

---

## 📁 Project Structure

```
app/
├── components/      # Vue components
├── composables/     # Vue composables (useApi, useAuth, etc.)
├── pages/          # Application routes
├── layouts/        # Page layouts
└── assets/         # CSS and static assets

i18n/               # Internationalization files
public/             # Public static files
```

---

## 🔗 Related

* Backend: [FynnCloud-Backend](https://github.com/thilojaeggi/FynnCloud-Backend)

