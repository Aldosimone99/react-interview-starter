# React Interview Starter

An **interview-ready React + TypeScript project** showcasing professional frontend patterns through a realistic Job Tracker app.

**Best for:** Early–Mid level React interviews • Portfolio review • Learning modern React patterns

---

## ⚡ Quick Pitch (30 seconds)

> A focused React project built to demonstrate real‑world frontend skills: feature‑based architecture, URL‑driven state, async data handling, and clean UI composition. The scope is intentional—optimized for explainability in interviews rather than feature bloat.

---

## 🎯 What This Project Demonstrates

- Clean **feature-based architecture**
- **URL-synced search, filters, and sorting**
- **Custom hooks** for async data, debouncing, and persistence
- Strong **TypeScript domain modeling**
- Realistic **SaaS-style UI patterns** (cards, toolbars, sticky sidebars)
- Thoughtful **edge-case handling** (loading, empty, not-found)

---

## 🧱 Tech Stack

- **React** (Hooks, functional components)
- **TypeScript** (strict, domain-driven types)
- **React Router v6** (nested routes, dynamic params)
- **Tailwind CSS** (utility-first, consistent design system)
- **Vite** (fast dev server & build)

---

## 📁 Project Structure

```txt
src/
├── components/ui/          # Reusable UI primitives (Card, Badge, Skeleton)
├── features/jobs/          # Jobs domain (types, api, hooks, storage)
│   ├── api.ts              # Mock API with AbortSignal support
│   ├── data.ts             # Seed data
│   ├── saved.ts            # localStorage helpers
│   ├── types.ts            # Job & JobLevel types
│   └── hooks/              # Domain-specific hooks
├── hooks/                  # Shared generic hooks
├── layouts/                # App layouts
├── pages/                  # Route-level pages
├── App.tsx                 # Router configuration
├── main.tsx                # Entry point
└── index.css               # Global styles
```

---

## 🧭 Core Features

### Job Listing
- Search across title, company, location
- Level filtering (All / Junior / Mid / Senior)
- Sorting (Recent, Seniority)
- Saved-only view with count
- **All state synced to URL**

### Job Detail
- Dynamic route: `/jobs/:id`
- Save / Unsave job
- Personal notes (persisted in `localStorage`)
- Two-column layout with sticky actions sidebar
- Breadcrumb navigation

### Navigation & UX
- Persistent layout with nested routing
- Graceful 404 page
- Loading skeletons
- Empty states

---

## 🧠 Key React Patterns Used

- **Derived state** with `useMemo`
- **Async handling** via a custom `useAsync` hook
- **AbortController** to prevent race conditions
- **Debounced inputs** for performance
- **Type-driven UI decisions**

---

## ⚡ Performance & Web Vitals

Lighthouse audits were used to evaluate real-world performance on core user flows.

Notes:
- Initial audits in development mode showed lower scores due to Vite dev tooling overhead (HMR, dev client).
- Production preview (`vite preview`) was used as the reference to reflect real user conditions.

Current results (Home page):
- Performance: 100
- Accessibility: 100
- Best Practices: 100

Jobs listing page:
- Performance: 93 (feature-rich, data-driven UI)

This approach highlights awareness of tooling impact on performance metrics and correct Web Vitals interpretation.

---

## 🔐 Data Persistence

Saved jobs and notes are stored locally:

```ts
// saved jobs
{ "1": true, "3": true }

// notes
{ "1": "Interesting role", "3": "Follow up" }
```

---

## 🧪 Edge Cases Covered

- No results
- Saved-only empty state
- Invalid job ID
- Loading & error states

---

## 🚀 Getting Started

```bash
git clone https://github.com/Aldosimone99/react-interview-starter.git
cd react-interview-starter
npm install
npm run dev
```

Open: http://localhost:5173

---

## 🎤 Interview Talking Points

- **Why URL-driven state:** shareable links, browser navigation
- **Why feature folders:** scalability & ownership
- **Why custom hooks:** reuse & separation of concerns
- **Why mock API:** realistic async flows without backend noise

---

## ♿ Accessibility (Baseline)

- Keyboard-navigable UI
- Visible focus management for interactive elements
- Semantic HTML structure
- ARIA attributes used where appropriate

Accessibility was considered during development, with further improvements identified as future work.

---

## 🛣️ Possible Next Steps

- Add dates/salary to jobs
- Replace mock API with real backend
- Add tests (RTL + Vitest)
- Extended accessibility audit (WCAG-focused)

---

## 👤 Author

**Aldosimone Di Rosa** — Frontend Developer (React / Angular)

- GitHub: https://github.com/Aldosimone99
- LinkedIn: https://www.linkedin.com/in/aldosimone-di-rosa-b5a55716b/

---

**Status:** Interview-ready • Actively maintained