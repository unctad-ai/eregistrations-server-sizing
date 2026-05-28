# eRegistrations Server Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a static React SPA at `https://sizing.eregistrations.dev` that asks 7 bucketed questions and outputs a recommended server configuration (CPU / RAM / Disk + cloud SKUs) for new eRegistrations country deployments.

**Architecture:** Pure-client Vite + React + TypeScript SPA with Tailwind + shadcn/ui. A deterministic `recommend(answers)` pure function maps bucketed inputs to one of three brackets (A / B / C) anchored to live measurements from existing deployments; environment + topology + disk-multiplier adjustments produce one card per requested environment. Deployed via Coolify (Dockerfile + nginx:alpine) on the existing `*.eregistrations.dev` wildcard.

**Tech Stack:** Vite, React 18, TypeScript (strict), Tailwind CSS, shadcn/ui, react-router, Vitest, Testing Library, happy-dom, ESLint, pnpm, Docker (multi-stage node:20-alpine + nginx:alpine), GitHub Actions.

---

## File Structure

**Created files (in `~/PROJECTS/software-factory/eregistrations-server-sizing/`):**

- `package.json` — pnpm scripts (dev, build, test, lint, typecheck)
- `tsconfig.json`, `tsconfig.node.json` — TypeScript strict config
- `vite.config.ts` — Vite + Vitest config
- `tailwind.config.ts`, `postcss.config.js`, `src/styles.css` — Tailwind setup
- `components.json` — shadcn/ui config
- `.eslintrc.cjs`, `.gitignore`, `.editorconfig` — repo meta
- `index.html` — Vite entry
- `src/main.tsx` — React mount + router
- `src/App.tsx` — route definitions
- `src/types.ts` — `Answers`, `Bracket`, `Card`, `Recommendation`, etc.
- `src/data/questions.json` — 7-question wizard definition
- `src/data/benchmarks.json` — anonymized reference snapshots
- `src/lib/brackets.ts` — A/B/C base specs
- `src/lib/recommend.ts` — pure recommendation function
- `src/lib/cloud-skus.ts` — bracket → cloud SKU mapping
- `src/lib/rationale.ts` — builds the "Why this size?" string
- `src/lib/state.ts` — URL-safe base64 encode/decode of answers
- `src/components/Layout.tsx` — page shell with header/footer
- `src/components/Landing.tsx` — `/` page
- `src/components/About.tsx` — `/about` page
- `src/components/wizard/Wizard.tsx` — wizard shell + step state
- `src/components/wizard/QuestionStep.tsx` — single-question renderer (radio + checkbox)
- `src/components/results/Results.tsx` — `/results` page
- `src/components/results/RecommendationCard.tsx` — one card per environment
- `src/components/results/RationaleBlock.tsx` — collapsible reasoning
- `src/components/results/Warnings.tsx` — HA+A and implausible-combo warnings
- `src/components/ui/*` — shadcn-generated primitives (button, card, radio-group, checkbox, progress, collapsible)
- `tests/recommend.spec.ts` — algorithm tests (~25–35)
- `tests/state.spec.ts` — URL round-trip tests
- `tests/wizard.spec.tsx` — component-level wizard tests
- `tests/setup.ts` — Testing Library setup
- `Dockerfile` — multi-stage build
- `nginx.conf` — SPA fallback config
- `.github/workflows/ci.yml` — typecheck + lint + test + build
- `README.md` — how to run, how to edit questions, how to tune brackets

**Responsibility split:** `recommend.ts` is the only "business logic" file — pure, side-effect-free, exhaustively tested. All UI components consume it through a single call. Data (questions, brackets, SKUs) lives in dedicated files so non-engineers can tune without touching algorithm code.

---

## Task 1: Repo bootstrap (Vite + React + TS)

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`

- [ ] **Step 1: Bootstrap Vite project (non-interactive)**

```bash
cd ~/PROJECTS/software-factory/eregistrations-server-sizing
pnpm create vite@latest . --template react-ts --no-git
```

If prompted to overwrite, answer "Ignore files and continue".

- [ ] **Step 2: Replace the generated `.gitignore` with our version**

`.gitignore`:
```
node_modules/
dist/
.DS_Store
.vscode/
*.log
.env
.env.local
coverage/
```

- [ ] **Step 3: Install dependencies**

```bash
pnpm install
pnpm add react-router-dom@^6
```

- [ ] **Step 4: Tighten tsconfig.json for strict mode**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": "./",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: Replace `src/main.tsx` and `src/App.tsx` with router skeleton**

`src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

`src/App.tsx`:
```tsx
import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div>landing placeholder</div>} />
    </Routes>
  );
}
```

Delete the generated `src/App.css` if present.

- [ ] **Step 6: Verify build works**

Run: `pnpm build`
Expected: `vite v…` and a `dist/` directory created with no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: bootstrap Vite + React + TS scaffold"
```

---

## Task 2: Tailwind + shadcn/ui setup

**Files:**
- Create: `tailwind.config.ts`, `postcss.config.js`, `src/styles.css`, `components.json`, `src/lib/cn.ts`

- [ ] **Step 1: Install Tailwind**

```bash
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p
```

- [ ] **Step 2: Rename `tailwind.config.js` → `tailwind.config.ts` and configure**

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: "#1f6feb", foreground: "#ffffff" }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
```

- [ ] **Step 3: Replace `src/styles.css`**

`src/styles.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { @apply bg-white text-slate-900 font-sans antialiased; }
```

- [ ] **Step 4: Create `src/lib/cn.ts` (shadcn helper)**

```bash
pnpm add clsx tailwind-merge
```

`src/lib/cn.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Add shadcn dependencies and primitives**

```bash
pnpm add @radix-ui/react-radio-group @radix-ui/react-checkbox @radix-ui/react-progress @radix-ui/react-collapsible
pnpm add class-variance-authority lucide-react
```

Create `src/components/ui/button.tsx`:
```tsx
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  default: "bg-accent text-accent-foreground hover:bg-accent/90",
  outline: "border border-slate-300 bg-white hover:bg-slate-50",
  ghost:   "hover:bg-slate-100"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
        "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
```

Create `src/components/ui/card.tsx`:
```tsx
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border border-slate-200 bg-white shadow-sm", className)} {...props} />
  )
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 border-b border-slate-100", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";
```

- [ ] **Step 6: Verify build still works**

Run: `pnpm build`
Expected: dist generated, no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind + base UI primitives"
```

---

## Task 3: Test runner + lint setup

**Files:**
- Create: `tests/setup.ts`, `.eslintrc.cjs`
- Modify: `vite.config.ts`, `package.json`

- [ ] **Step 1: Install Vitest + Testing Library + ESLint**

```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks
```

- [ ] **Step 2: Replace `vite.config.ts`**

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.spec.{ts,tsx}"]
  }
});
```

- [ ] **Step 3: Create `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Create `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  settings: { react: { version: "detect" } },
  rules: {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
  },
  ignorePatterns: ["dist", "node_modules"]
};
```

- [ ] **Step 5: Update package.json scripts**

In `package.json`, replace the `"scripts"` block with:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run",
  "typecheck": "tsc --noEmit",
  "lint": "eslint src tests --ext .ts,.tsx"
}
```

- [ ] **Step 6: Smoke-test the toolchain**

Create a temporary `tests/smoke.spec.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `pnpm test:run`
Expected: 1 test passes.

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

Delete `tests/smoke.spec.ts` before committing.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Vitest + ESLint with strict configs"
```

---

## Task 4: Define types and questions data

**Files:**
- Create: `src/types.ts`, `src/data/questions.json`

- [ ] **Step 1: Write `src/types.ts`**

```ts
export type PopulationBucket = "small" | "medium" | "large";
export type ServicesBucket   = "small" | "medium" | "large";
export type ApplicationsBucket = "small" | "medium" | "large";
export type AttachmentLevel = "rarely" | "sometimes" | "most";
export type Horizon = "1y" | "3y" | "5y";
export type Environment = "production" | "dev" | "test";
export type Topology = "single" | "split-db" | "ha";

export interface Answers {
  population: PopulationBucket;
  services: ServicesBucket;
  applications: ApplicationsBucket;
  attachments: AttachmentLevel;
  horizon: Horizon;
  environments: Environment[];
  topology: Topology;
}

export type BracketId = "A" | "B" | "C";

export interface BaseSpec {
  id: BracketId;
  label: string;
  vcpu: number;
  ramGiB: number;
  diskGB: number;
  networkGbps: number;
}

export interface ServerSpec {
  role: "all-in-one" | "app" | "db" | "app-1" | "app-2" | "db-1" | "db-2";
  vcpu: number;
  ramGiB: number;
  diskGB: number;
  networkGbps: number;
}

export interface CloudSkus {
  aws: string;
  hetzner: string;
  ovh: string;
}

export interface EnvironmentCard {
  env: Environment;
  servers: ServerSpec[];
  skus: CloudSkus;
}

export type WarningCode = "ha-overkill-for-bracket-a" | "implausible-load-spread";

export interface Recommendation {
  bracket: BracketId;
  cards: EnvironmentCard[];
  rationale: string;
  warnings: WarningCode[];
}

export interface QuestionOption {
  value: string;
  label: string;
  loadScore?: 1 | 2 | 3;
}

export interface Question {
  id: keyof Answers;
  label: string;
  help: string;
  type: "single" | "multi";
  required?: boolean;
  forcedValues?: string[];
  options: QuestionOption[];
}
```

- [ ] **Step 2: Write `src/data/questions.json`**

```json
{
  "questions": [
    {
      "id": "population",
      "label": "What is the population this service will serve?",
      "help": "Use the country population, or the relevant subset if the service is sectoral (e.g. number of registered businesses).",
      "type": "single",
      "options": [
        { "value": "small",  "label": "Less than 3 million",  "loadScore": 1 },
        { "value": "medium", "label": "3 to 10 million",      "loadScore": 2 },
        { "value": "large",  "label": "More than 10 million", "loadScore": 3 }
      ]
    },
    {
      "id": "services",
      "label": "How many services do you plan to launch in year 1?",
      "help": "A service is a single citizen-facing procedure (e.g. business registration, building permit).",
      "type": "single",
      "options": [
        { "value": "small",  "label": "1 to 5 services",   "loadScore": 1 },
        { "value": "medium", "label": "6 to 15 services",  "loadScore": 2 },
        { "value": "large",  "label": "16 or more services", "loadScore": 3 }
      ]
    },
    {
      "id": "applications",
      "label": "How many applications do you expect per year?",
      "help": "Total submissions across all services in a typical operational year.",
      "type": "single",
      "options": [
        { "value": "small",  "label": "Fewer than 50,000",       "loadScore": 1 },
        { "value": "medium", "label": "50,000 to 500,000",       "loadScore": 2 },
        { "value": "large",  "label": "More than 500,000",       "loadScore": 3 }
      ]
    },
    {
      "id": "attachments",
      "label": "How often do applications require document uploads?",
      "help": "Scanned IDs, photos, contracts — anything that ends up stored as a file.",
      "type": "single",
      "options": [
        { "value": "rarely",    "label": "Rarely" },
        { "value": "sometimes", "label": "Sometimes" },
        { "value": "most",      "label": "Most of the time" }
      ]
    },
    {
      "id": "horizon",
      "label": "What planning horizon are you sizing for?",
      "help": "How many years of growth the server should comfortably absorb before upgrade.",
      "type": "single",
      "options": [
        { "value": "1y", "label": "1 year"  },
        { "value": "3y", "label": "3 years" },
        { "value": "5y", "label": "5 years" }
      ]
    },
    {
      "id": "environments",
      "label": "Which environments do you need?",
      "help": "Production is required. Dev and Test are optional and roughly one-third the size of Production.",
      "type": "multi",
      "required": true,
      "forcedValues": ["production"],
      "options": [
        { "value": "production", "label": "Production (required)" },
        { "value": "dev",        "label": "Development" },
        { "value": "test",       "label": "Test / QA" }
      ]
    },
    {
      "id": "topology",
      "label": "Preferred deployment topology",
      "help": "Single = all on one server. Split DB = app + DB on separate servers. HA = redundant pair of each.",
      "type": "single",
      "options": [
        { "value": "single",   "label": "Single server" },
        { "value": "split-db", "label": "Split database" },
        { "value": "ha",       "label": "High-availability cluster" }
      ]
    }
  ]
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/data/questions.json
git commit -m "feat: define types and wizard question data"
```

---

## Task 5: Brackets module (A/B/C base specs)

**Files:**
- Create: `src/lib/brackets.ts`, `tests/brackets.spec.ts`

- [ ] **Step 1: Write the failing test**

`tests/brackets.spec.ts`:
```ts
import { describe, it, expect } from "vitest";
import { BRACKETS, pickBracket } from "@/lib/brackets";

describe("BRACKETS", () => {
  it("defines A, B, C with expected base specs", () => {
    expect(BRACKETS.A).toMatchObject({ id: "A", vcpu: 8,  ramGiB: 32, diskGB: 500 });
    expect(BRACKETS.B).toMatchObject({ id: "B", vcpu: 8,  ramGiB: 64, diskGB: 1000 });
    expect(BRACKETS.C).toMatchObject({ id: "C", vcpu: 12, ramGiB: 96, diskGB: 2000 });
  });
});

describe("pickBracket", () => {
  it("returns A for avg load <= 1.5", () => {
    expect(pickBracket(1.0).id).toBe("A");
    expect(pickBracket(1.5).id).toBe("A");
  });
  it("returns B for 1.5 < avg <= 2.5", () => {
    expect(pickBracket(1.6).id).toBe("B");
    expect(pickBracket(2.0).id).toBe("B");
    expect(pickBracket(2.5).id).toBe("B");
  });
  it("returns C for avg > 2.5", () => {
    expect(pickBracket(2.6).id).toBe("C");
    expect(pickBracket(3.0).id).toBe("C");
  });
});
```

- [ ] **Step 2: Run the test — must fail**

Run: `pnpm test:run tests/brackets.spec.ts`
Expected: FAIL ("Cannot find module …").

- [ ] **Step 3: Implement `src/lib/brackets.ts`**

```ts
import type { BaseSpec, BracketId } from "@/types";

export const BRACKETS: Record<BracketId, BaseSpec> = {
  A: { id: "A", label: "Small",  vcpu: 8,  ramGiB: 32, diskGB: 500,  networkGbps: 1 },
  B: { id: "B", label: "Mid",    vcpu: 8,  ramGiB: 64, diskGB: 1000, networkGbps: 1 },
  C: { id: "C", label: "Large",  vcpu: 12, ramGiB: 96, diskGB: 2000, networkGbps: 1 }
};

export function pickBracket(avgLoad: number): BaseSpec {
  if (avgLoad <= 1.5) return BRACKETS.A;
  if (avgLoad <= 2.5) return BRACKETS.B;
  return BRACKETS.C;
}
```

- [ ] **Step 4: Run tests — must pass**

Run: `pnpm test:run tests/brackets.spec.ts`
Expected: PASS, all assertions green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/brackets.ts tests/brackets.spec.ts
git commit -m "feat(algo): bracket A/B/C base specs and selection"
```

---

## Task 6: `recommend()` — load scoring and bracket selection

**Files:**
- Create: `src/lib/recommend.ts`, `tests/recommend.spec.ts`

- [ ] **Step 1: Write failing tests**

`tests/recommend.spec.ts`:
```ts
import { describe, it, expect } from "vitest";
import { recommend } from "@/lib/recommend";
import type { Answers } from "@/types";

const baseAnswers: Answers = {
  population: "small",
  services: "small",
  applications: "small",
  attachments: "rarely",
  horizon: "1y",
  environments: ["production"],
  topology: "single"
};

describe("recommend — bracket selection", () => {
  it("selects A for all-small profile", () => {
    expect(recommend(baseAnswers).bracket).toBe("A");
  });

  it("selects B for all-medium profile", () => {
    expect(recommend({ ...baseAnswers, population: "medium", services: "medium", applications: "medium" }).bracket).toBe("B");
  });

  it("selects C for all-large profile", () => {
    expect(recommend({ ...baseAnswers, population: "large", services: "large", applications: "large" }).bracket).toBe("C");
  });

  it("rounds borderline avg = 1.67 to B", () => {
    // small(1) + small(1) + large(3) → avg 1.67 → B
    expect(recommend({ ...baseAnswers, applications: "large" }).bracket).toBe("B");
  });
});
```

- [ ] **Step 2: Run tests — must fail**

Run: `pnpm test:run tests/recommend.spec.ts`
Expected: FAIL ("Cannot find module").

- [ ] **Step 3: Implement minimal `recommend()`**

`src/lib/recommend.ts`:
```ts
import type { Answers, Recommendation, EnvironmentCard } from "@/types";
import { pickBracket } from "@/lib/brackets";

const SCORE: Record<string, 1 | 2 | 3> = { small: 1, medium: 2, large: 3 };

function avgLoad(a: Answers): number {
  const sum = SCORE[a.population] + SCORE[a.services] + SCORE[a.applications];
  return sum / 3;
}

export function recommend(answers: Answers): Recommendation {
  const base = pickBracket(avgLoad(answers));
  const cards: EnvironmentCard[] = [];
  return {
    bracket: base.id,
    cards,
    rationale: "",
    warnings: []
  };
}
```

- [ ] **Step 4: Run tests — must pass**

Run: `pnpm test:run tests/recommend.spec.ts`
Expected: PASS for all 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recommend.ts tests/recommend.spec.ts
git commit -m "feat(algo): bracket selection from load proxies"
```

---

## Task 7: Disk multiplier (attachments × horizon × rounding)

**Files:**
- Modify: `src/lib/recommend.ts`, `tests/recommend.spec.ts`

- [ ] **Step 1: Add failing tests for disk adjustment**

Append to `tests/recommend.spec.ts`:
```ts
describe("recommend — disk adjustment", () => {
  it("returns base 500 GB for A + rarely + 1y", () => {
    const r = recommend(baseAnswers);
    expect(r.cards[0].servers[0].diskGB).toBe(500);
  });

  it("scales disk for sometimes attachments + 5y horizon (Bracket B)", () => {
    // base 1000 × 1.3 × 2.0 = 2600 → rounded up to 2750
    const r = recommend({
      ...baseAnswers,
      population: "medium", services: "medium", applications: "medium",
      attachments: "sometimes", horizon: "5y"
    });
    expect(r.cards[0].servers[0].diskGB).toBe(2750);
  });

  it("scales disk to >= 2000 for C + most + 5y", () => {
    const r = recommend({
      ...baseAnswers,
      population: "large", services: "large", applications: "large",
      attachments: "most", horizon: "5y"
    });
    // base 2000 × 1.8 × 2.0 = 7200 → rounded to 7250
    expect(r.cards[0].servers[0].diskGB).toBe(7250);
  });
});
```

- [ ] **Step 2: Run tests — must fail**

Run: `pnpm test:run tests/recommend.spec.ts`
Expected: FAIL (cards is empty array).

- [ ] **Step 3: Extend `recommend()` to emit a production card with adjusted disk**

Replace `src/lib/recommend.ts` with:
```ts
import type { Answers, Recommendation, EnvironmentCard, ServerSpec, BaseSpec, AttachmentLevel, Horizon } from "@/types";
import { pickBracket } from "@/lib/brackets";

const SCORE: Record<string, 1 | 2 | 3> = { small: 1, medium: 2, large: 3 };
const ATTACH_MULT: Record<AttachmentLevel, number> = { rarely: 1.0, sometimes: 1.3, most: 1.8 };
const HORIZON_MULT: Record<Horizon, number>        = { "1y": 1.0, "3y": 1.5, "5y": 2.0 };

function avgLoad(a: Answers): number {
  return (SCORE[a.population] + SCORE[a.services] + SCORE[a.applications]) / 3;
}

function roundUpTo(n: number, step: number): number {
  return Math.ceil(n / step) * step;
}

function adjustedDisk(base: BaseSpec, a: Answers): number {
  const raw = base.diskGB * ATTACH_MULT[a.attachments] * HORIZON_MULT[a.horizon];
  return roundUpTo(raw, 250);
}

export function recommend(answers: Answers): Recommendation {
  const base = pickBracket(avgLoad(answers));
  const disk = adjustedDisk(base, answers);

  const prodServer: ServerSpec = {
    role: "all-in-one",
    vcpu: base.vcpu,
    ramGiB: base.ramGiB,
    diskGB: disk,
    networkGbps: base.networkGbps
  };

  const cards: EnvironmentCard[] = [
    { env: "production", servers: [prodServer], skus: { aws: "", hetzner: "", ovh: "" } }
  ];

  return { bracket: base.id, cards, rationale: "", warnings: [] };
}
```

- [ ] **Step 4: Run tests — must pass**

Run: `pnpm test:run tests/recommend.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/recommend.ts tests/recommend.spec.ts
git commit -m "feat(algo): disk multiplier and rounding"
```

---

## Task 8: Environment scaling (Dev, Test cards)

**Files:**
- Modify: `src/lib/recommend.ts`, `tests/recommend.spec.ts`

- [ ] **Step 1: Add failing tests**

Append:
```ts
describe("recommend — environment scaling", () => {
  it("emits one production card by default", () => {
    expect(recommend(baseAnswers).cards.map(c => c.env)).toEqual(["production"]);
  });

  it("emits prod + dev + test in order when all selected", () => {
    const r = recommend({ ...baseAnswers, environments: ["production", "dev", "test"] });
    expect(r.cards.map(c => c.env)).toEqual(["production", "dev", "test"]);
  });

  it("scales dev to half CPU/RAM and ~30 percent disk, rounded up", () => {
    // Bracket B: 8 vCPU / 64 GiB / 1000 GB → dev: 4 / 32 / 300
    const r = recommend({
      ...baseAnswers,
      population: "medium", services: "medium", applications: "medium",
      environments: ["production", "dev"]
    });
    const dev = r.cards.find(c => c.env === "dev")!;
    expect(dev.servers[0].vcpu).toBe(4);
    expect(dev.servers[0].ramGiB).toBe(32);
    expect(dev.servers[0].diskGB).toBe(500); // 1000*0.3=300 → up to 500
  });

  it("rounds vCPU up to nearest even integer", () => {
    // Bracket C: 12 → dev 6 (already even). Use Bracket A: 8 → 4
    const r = recommend({ ...baseAnswers, environments: ["production", "dev"] });
    expect(r.cards.find(c => c.env === "dev")!.servers[0].vcpu).toBe(4);
  });
});
```

- [ ] **Step 2: Run tests — must fail**

Expected: FAIL (only production card emitted).

- [ ] **Step 3: Extend `recommend()` for env scaling**

Replace the body of `recommend()` (and add helpers) in `src/lib/recommend.ts`:
```ts
import type { Environment } from "@/types";

const ENV_MULT: Record<Environment, { cpu: number; ram: number; disk: number }> = {
  production: { cpu: 1.0, ram: 1.0, disk: 1.0 },
  dev:        { cpu: 0.5, ram: 0.5, disk: 0.3 },
  test:       { cpu: 0.5, ram: 0.5, disk: 0.3 }
};

function roundUpToEven(n: number): number {
  return Math.ceil(n / 2) * 2;
}

function roundUpTo8(n: number): number {
  return Math.ceil(n / 8) * 8;
}

function scaleServer(base: BaseSpec, prodDisk: number, env: Environment): ServerSpec {
  const m = ENV_MULT[env];
  return {
    role: "all-in-one",
    vcpu:        roundUpToEven(base.vcpu * m.cpu),
    ramGiB:      roundUpTo8(base.ramGiB * m.ram),
    diskGB:      roundUpTo(prodDisk * m.disk, 250),
    networkGbps: base.networkGbps
  };
}

export function recommend(answers: Answers): Recommendation {
  const base = pickBracket(avgLoad(answers));
  const prodDisk = adjustedDisk(base, answers);

  const envOrder: Environment[] = ["production", "dev", "test"];
  const cards: EnvironmentCard[] = envOrder
    .filter(env => answers.environments.includes(env))
    .map(env => ({
      env,
      servers: [scaleServer(base, prodDisk, env)],
      skus: { aws: "", hetzner: "", ovh: "" }
    }));

  return { bracket: base.id, cards, rationale: "", warnings: [] };
}
```

- [ ] **Step 4: Run tests — must pass**

Run: `pnpm test:run tests/recommend.spec.ts`
Expected: PASS (all environment tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/recommend.ts tests/recommend.spec.ts
git commit -m "feat(algo): per-environment scaling with rounding rules"
```

---

## Task 9: Topology server emission

**Files:**
- Modify: `src/lib/recommend.ts`, `tests/recommend.spec.ts`

- [ ] **Step 1: Add failing tests**

Append:
```ts
describe("recommend — topology", () => {
  it("single emits 1 all-in-one server per env", () => {
    const r = recommend(baseAnswers);
    expect(r.cards[0].servers.map(s => s.role)).toEqual(["all-in-one"]);
  });

  it("split-db emits 1 app + 1 db server per env", () => {
    const r = recommend({ ...baseAnswers, topology: "split-db" });
    expect(r.cards[0].servers.map(s => s.role)).toEqual(["app", "db"]);
    // app: full CPU/RAM, ⅓ disk
    expect(r.cards[0].servers[0].vcpu).toBe(8);
    expect(r.cards[0].servers[0].ramGiB).toBe(32);
    // db: half CPU, full RAM, ⅔ disk
    expect(r.cards[0].servers[1].vcpu).toBe(4);
    expect(r.cards[0].servers[1].ramGiB).toBe(32);
  });

  it("ha emits 2 app + 2 db servers per env", () => {
    const r = recommend({ ...baseAnswers, topology: "ha" });
    expect(r.cards[0].servers.map(s => s.role)).toEqual(["app-1", "app-2", "db-1", "db-2"]);
  });
});
```

- [ ] **Step 2: Run tests — must fail**

Expected: FAIL (single all-in-one is hardcoded).

- [ ] **Step 3: Extend `recommend()` with topology branches**

Replace the env mapping in `recommend()` to call a new `serversForTopology` helper. Add to `src/lib/recommend.ts`:

```ts
import type { Topology } from "@/types";

function serversForTopology(
  topology: Topology,
  scaled: ServerSpec
): ServerSpec[] {
  if (topology === "single") {
    return [{ ...scaled, role: "all-in-one" }];
  }
  if (topology === "split-db") {
    const appDisk = roundUpTo(scaled.diskGB / 3, 250);
    const dbDisk  = roundUpTo((scaled.diskGB * 2) / 3, 250);
    return [
      { ...scaled, role: "app", diskGB: appDisk },
      { ...scaled, role: "db",  vcpu: roundUpToEven(scaled.vcpu / 2), diskGB: dbDisk }
    ];
  }
  // ha
  const appDisk = roundUpTo(scaled.diskGB / 3, 250);
  const dbDisk  = roundUpTo((scaled.diskGB * 2) / 3, 250);
  return [
    { ...scaled, role: "app-1", diskGB: appDisk },
    { ...scaled, role: "app-2", diskGB: appDisk },
    { ...scaled, role: "db-1", vcpu: roundUpToEven(scaled.vcpu / 2), diskGB: dbDisk },
    { ...scaled, role: "db-2", vcpu: roundUpToEven(scaled.vcpu / 2), diskGB: dbDisk }
  ];
}
```

Change the `map` in `recommend()` to call this:
```ts
.map(env => ({
  env,
  servers: serversForTopology(answers.topology, scaleServer(base, prodDisk, env)),
  skus: { aws: "", hetzner: "", ovh: "" }
}));
```

- [ ] **Step 4: Run tests — must pass**

Run: `pnpm test:run tests/recommend.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recommend.ts tests/recommend.spec.ts
git commit -m "feat(algo): topology branching (single / split-db / ha)"
```

---

## Task 10: Warnings (HA on Bracket A; implausible load spread)

**Files:**
- Modify: `src/lib/recommend.ts`, `tests/recommend.spec.ts`

- [ ] **Step 1: Add failing tests**

Append:
```ts
describe("recommend — warnings", () => {
  it("warns on ha + Bracket A", () => {
    const r = recommend({ ...baseAnswers, topology: "ha" });
    expect(r.warnings).toContain("ha-overkill-for-bracket-a");
  });

  it("does not warn on ha + Bracket B", () => {
    const r = recommend({
      ...baseAnswers,
      population: "medium", services: "medium", applications: "medium",
      topology: "ha"
    });
    expect(r.warnings).not.toContain("ha-overkill-for-bracket-a");
  });

  it("warns when load proxies span min and max scores", () => {
    // small(1) + small(1) + large(3) → spread 2
    const r = recommend({ ...baseAnswers, applications: "large" });
    expect(r.warnings).toContain("implausible-load-spread");
  });

  it("does not warn on close load proxies", () => {
    const r = recommend({ ...baseAnswers, applications: "medium" });
    expect(r.warnings).not.toContain("implausible-load-spread");
  });
});
```

- [ ] **Step 2: Run tests — must fail**

Expected: FAIL (warnings empty).

- [ ] **Step 3: Add warnings logic to `src/lib/recommend.ts`**

Add at module scope:
```ts
function computeWarnings(answers: Answers, base: BaseSpec): WarningCode[] {
  const w: WarningCode[] = [];
  if (answers.topology === "ha" && base.id === "A") {
    w.push("ha-overkill-for-bracket-a");
  }
  const scores = [SCORE[answers.population], SCORE[answers.services], SCORE[answers.applications]];
  if (Math.max(...scores) - Math.min(...scores) >= 2) {
    w.push("implausible-load-spread");
  }
  return w;
}
```

Update the imports to include `WarningCode` and `BaseSpec`. Update `recommend()` to set `warnings: computeWarnings(answers, base)`.

- [ ] **Step 4: Run tests — must pass**

Run: `pnpm test:run tests/recommend.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recommend.ts tests/recommend.spec.ts
git commit -m "feat(algo): edge-case warnings"
```

---

## Task 11: Anchor fixtures (Lesotho-profile, Palestine-profile)

**Files:**
- Modify: `tests/recommend.spec.ts`

- [ ] **Step 1: Add anchor tests**

Append:
```ts
describe("recommend — anchor fixtures", () => {
  it("small-country profile → Bracket A, 1 card, 8/32/500", () => {
    const r = recommend({
      population: "small", services: "small", applications: "small",
      attachments: "sometimes", horizon: "1y",
      environments: ["production"], topology: "single"
    });
    expect(r.bracket).toBe("A");
    expect(r.cards).toHaveLength(1);
    expect(r.cards[0].servers[0]).toMatchObject({ vcpu: 8, ramGiB: 32, diskGB: 750 });
    // 500 × 1.3 × 1.0 = 650 → rounded up to 750
  });

  it("large-country profile → Bracket C, 1 card, 12/96/≥2000", () => {
    const r = recommend({
      population: "medium", services: "large", applications: "large",
      attachments: "most", horizon: "5y",
      environments: ["production"], topology: "single"
    });
    expect(r.bracket).toBe("C");
    expect(r.cards[0].servers[0].vcpu).toBe(12);
    expect(r.cards[0].servers[0].ramGiB).toBe(96);
    expect(r.cards[0].servers[0].diskGB).toBeGreaterThanOrEqual(2000);
  });

  it("mid-default profile → Bracket B, 3 cards (prod/dev/test)", () => {
    const r = recommend({
      population: "medium", services: "medium", applications: "medium",
      attachments: "sometimes", horizon: "3y",
      environments: ["production", "dev", "test"], topology: "single"
    });
    expect(r.bracket).toBe("B");
    expect(r.cards.map(c => c.env)).toEqual(["production", "dev", "test"]);
  });
});
```

- [ ] **Step 2: Run tests — must pass on first run (no implementation change)**

Run: `pnpm test:run tests/recommend.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/recommend.spec.ts
git commit -m "test(algo): anchor fixtures from real-server analysis"
```

---

## Task 12: Cloud SKU mapping

**Files:**
- Create: `src/lib/cloud-skus.ts`, `tests/cloud-skus.spec.ts`
- Modify: `src/lib/recommend.ts`

- [ ] **Step 1: Write failing tests**

`tests/cloud-skus.spec.ts`:
```ts
import { describe, it, expect } from "vitest";
import { lookupCloudSkus } from "@/lib/cloud-skus";

describe("lookupCloudSkus", () => {
  it("returns AWS/Hetzner/OVH for bracket A", () => {
    const s = lookupCloudSkus("A");
    expect(s.aws).toBe("m6i.2xlarge (8 vCPU / 32 GiB)");
    expect(s.hetzner).toBe("CCX23 (8 / 32)");
    expect(s.ovh).toBe("Advance-1");
  });

  it("returns AWS/Hetzner/OVH for bracket B", () => {
    expect(lookupCloudSkus("B").aws).toBe("r6i.2xlarge (8 vCPU / 64 GiB)");
  });

  it("returns AWS/Hetzner/OVH for bracket C with note", () => {
    const s = lookupCloudSkus("C");
    expect(s.aws).toBe("r6i.4xlarge (16 vCPU / 128 GiB, slightly over)");
    expect(s.hetzner).toMatch(/CCX43/);
  });
});
```

- [ ] **Step 2: Run tests — must fail**

Expected: FAIL ("Cannot find module").

- [ ] **Step 3: Implement `src/lib/cloud-skus.ts`**

```ts
import type { BracketId, CloudSkus } from "@/types";

const SKUS: Record<BracketId, CloudSkus> = {
  A: {
    aws:     "m6i.2xlarge (8 vCPU / 32 GiB)",
    hetzner: "CCX23 (8 / 32)",
    ovh:     "Advance-1"
  },
  B: {
    aws:     "r6i.2xlarge (8 vCPU / 64 GiB)",
    hetzner: "CCX33 (8 / 64)",
    ovh:     "Advance-2"
  },
  C: {
    aws:     "r6i.4xlarge (16 vCPU / 128 GiB, slightly over)",
    hetzner: "CCX43 (16 / 64) or CCX53 (16 / 128)",
    ovh:     "HG-2"
  }
};

export function lookupCloudSkus(bracket: BracketId): CloudSkus {
  return SKUS[bracket];
}
```

- [ ] **Step 4: Wire into `recommend()`**

In `src/lib/recommend.ts`, replace `skus: { aws: "", hetzner: "", ovh: "" }` with `skus: lookupCloudSkus(base.id)`. Add import: `import { lookupCloudSkus } from "@/lib/cloud-skus";`.

- [ ] **Step 5: Run tests — must pass**

Run: `pnpm test:run`
Expected: PASS for all suites.

- [ ] **Step 6: Commit**

```bash
git add src/lib/cloud-skus.ts tests/cloud-skus.spec.ts src/lib/recommend.ts
git commit -m "feat(algo): cloud SKU lookup per bracket"
```

---

## Task 13: Rationale builder

**Files:**
- Create: `src/lib/rationale.ts`, `tests/rationale.spec.ts`
- Modify: `src/lib/recommend.ts`

- [ ] **Step 1: Write failing test**

`tests/rationale.spec.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildRationale } from "@/lib/rationale";
import { BRACKETS } from "@/lib/brackets";
import type { Answers } from "@/types";

describe("buildRationale", () => {
  it("explains the reasoning chain in prose", () => {
    const answers: Answers = {
      population: "medium", services: "medium", applications: "medium",
      attachments: "sometimes", horizon: "5y",
      environments: ["production"], topology: "single"
    };
    const out = buildRationale(answers, BRACKETS.B, 2750);
    expect(out).toMatch(/Bracket B/);
    expect(out).toMatch(/avg 2/);
    expect(out).toMatch(/×1\.3/);
    expect(out).toMatch(/×2\.0/);
    expect(out).toMatch(/2750/);
  });
});
```

- [ ] **Step 2: Run test — must fail**

Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/rationale.ts`**

```ts
import type { Answers, BaseSpec, AttachmentLevel, Horizon } from "@/types";

const SCORE: Record<string, number> = { small: 1, medium: 2, large: 3 };
const ATTACH_MULT: Record<AttachmentLevel, number> = { rarely: 1.0, sometimes: 1.3, most: 1.8 };
const HORIZON_MULT: Record<Horizon, number> = { "1y": 1.0, "3y": 1.5, "5y": 2.0 };

export function buildRationale(answers: Answers, base: BaseSpec, finalDiskGB: number): string {
  const avg = (SCORE[answers.population] + SCORE[answers.services] + SCORE[answers.applications]) / 3;
  const attachMult  = ATTACH_MULT[answers.attachments];
  const horizonMult = HORIZON_MULT[answers.horizon];

  return [
    `Population (${SCORE[answers.population]}) + Services (${SCORE[answers.services]}) + ` +
    `Applications (${SCORE[answers.applications]}) → avg ${avg.toFixed(1)} → Bracket ${base.id} (${base.label}).`,
    `Disk: base ${base.diskGB} GB × attachments ×${attachMult.toFixed(1)} × horizon ×${horizonMult.toFixed(1)} → ${finalDiskGB} GB.`,
    `Network: ${base.networkGbps} Gbps (default).`
  ].join(" ");
}
```

- [ ] **Step 4: Wire into `recommend()`**

In `src/lib/recommend.ts`, import `buildRationale` and replace `rationale: ""` with:
```ts
rationale: buildRationale(answers, base, prodDisk)
```

- [ ] **Step 5: Run tests — must pass**

Run: `pnpm test:run`
Expected: PASS for all.

- [ ] **Step 6: Commit**

```bash
git add src/lib/rationale.ts tests/rationale.spec.ts src/lib/recommend.ts
git commit -m "feat(algo): human-readable rationale builder"
```

---

## Task 14: URL state encode/decode

**Files:**
- Create: `src/lib/state.ts`, `tests/state.spec.ts`

- [ ] **Step 1: Write failing tests**

`tests/state.spec.ts`:
```ts
import { describe, it, expect } from "vitest";
import { encodeAnswers, decodeAnswers } from "@/lib/state";
import type { Answers } from "@/types";

const sample: Answers = {
  population: "medium", services: "medium", applications: "large",
  attachments: "sometimes", horizon: "3y",
  environments: ["production", "dev"], topology: "split-db"
};

describe("state encoding", () => {
  it("round-trips Answers through URL-safe base64", () => {
    const encoded = encodeAnswers(sample);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
    expect(decodeAnswers(encoded)).toEqual(sample);
  });

  it("returns null for malformed input", () => {
    expect(decodeAnswers("garbage!!")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — must fail**

Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/state.ts`**

```ts
import type { Answers } from "@/types";

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(s: string): string {
  return s.replace(/-/g, "+").replace(/_/g, "/");
}

export function encodeAnswers(answers: Answers): string {
  return toUrlSafe(btoa(JSON.stringify(answers)));
}

export function decodeAnswers(encoded: string): Answers | null {
  try {
    return JSON.parse(atob(fromUrlSafe(encoded))) as Answers;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests — must pass**

Run: `pnpm test:run`
Expected: PASS for all.

- [ ] **Step 5: Commit**

```bash
git add src/lib/state.ts tests/state.spec.ts
git commit -m "feat: url-safe state encoding for shareable results"
```

---

## Task 15: Layout + Landing page + router wiring

**Files:**
- Create: `src/components/Layout.tsx`, `src/components/Landing.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create Layout component**

`src/components/Layout.tsx`:
```tsx
import { Outlet, Link } from "react-router-dom";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold text-slate-900">
            eRegistrations Server Sizing
          </Link>
          <nav className="text-sm text-slate-600 space-x-4">
            <Link to="/about" className="hover:text-slate-900">About</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 text-center text-xs text-slate-500 py-4">
        Anchored to live measurements from operational eRegistrations deployments.
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Create Landing component**

`src/components/Landing.tsx`:
```tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Landing() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-slate-900">
        Size your eRegistrations server in under two minutes.
      </h1>
      <p className="text-slate-700 leading-relaxed">
        Answer seven short questions about the country, scope, and growth plan. We map your answers to
        one of three configuration brackets anchored to real measurements from existing eRegistrations
        deployments, and produce a procurement-ready spec with equivalent cloud SKUs.
      </p>
      <Link to="/wizard"><Button>Start sizing →</Button></Link>
    </div>
  );
}
```

- [ ] **Step 3: Wire routes in `src/App.tsx`**

```tsx
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Landing } from "@/components/Landing";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 4: Smoke-test in dev server**

Run: `pnpm dev`
Visit `http://localhost:5173/` — expect the landing copy and a "Start sizing →" button.
Kill dev server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): layout + landing page"
```

---

## Task 16: Wizard shell with step state

**Files:**
- Create: `src/components/wizard/Wizard.tsx`, `src/components/ui/progress.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create the Progress component**

`src/components/ui/progress.tsx`:
```tsx
import { cn } from "@/lib/cn";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full rounded-full bg-slate-100 overflow-hidden", className)}>
      <div
        className="h-full bg-accent transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create the Wizard shell**

`src/components/wizard/Wizard.tsx`:
```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import questionData from "@/data/questions.json";
import type { Answers, Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuestionStep } from "@/components/wizard/QuestionStep";
import { encodeAnswers } from "@/lib/state";

const QUESTIONS = questionData.questions as Question[];

export function Wizard() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({ environments: ["production"] });

  const current = QUESTIONS[idx];
  const total = QUESTIONS.length;

  const valueForCurrent = (answers as Record<string, unknown>)[current.id];
  const isAnswered =
    current.type === "single"
      ? typeof valueForCurrent === "string" && valueForCurrent.length > 0
      : Array.isArray(valueForCurrent) && valueForCurrent.length > 0;

  function update(value: string | string[]) {
    setAnswers(a => ({ ...a, [current.id]: value }));
  }

  function next() {
    if (idx < total - 1) setIdx(idx + 1);
    else navigate(`/results?state=${encodeAnswers(answers as Answers)}`);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Progress value={((idx + 1) / total) * 100} />
        <p className="text-sm text-slate-500">Question {idx + 1} of {total}</p>
      </div>

      <QuestionStep
        question={current}
        value={valueForCurrent as string | string[] | undefined}
        onChange={update}
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
          ← Back
        </Button>
        <Button onClick={next} disabled={!isAnswered}>
          {idx === total - 1 ? "See recommendation →" : "Next →"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add route**

In `src/App.tsx`, add inside `<Route element={<Layout />}>`:
```tsx
<Route path="/wizard" element={<Wizard />} />
```
and `import { Wizard } from "@/components/wizard/Wizard";`.

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: a single error referencing missing `QuestionStep` — proceed to Task 17.

- [ ] **Step 5: Commit (allow temporary import error — fixed in next task)**

```bash
git add -A
git commit -m "feat(wizard): wizard shell with step state and progress"
```

---

## Task 17: QuestionStep component

**Files:**
- Create: `src/components/wizard/QuestionStep.tsx`, `src/components/ui/radio-group.tsx`, `src/components/ui/checkbox.tsx`

- [ ] **Step 1: Create radio + checkbox primitives**

`src/components/ui/radio-group.tsx`:
```tsx
import * as RG from "@radix-ui/react-radio-group";
import { cn } from "@/lib/cn";
import { ReactNode } from "react";

export function RadioGroup(props: RG.RadioGroupProps & { children: ReactNode }) {
  return <RG.Root {...props} className={cn("space-y-2", props.className)}>{props.children}</RG.Root>;
}

export function RadioItem({ value, label }: { value: string; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-md border border-slate-200 hover:bg-slate-50">
      <RG.Item value={value} className="h-4 w-4 rounded-full border border-slate-400 data-[state=checked]:bg-accent data-[state=checked]:border-accent">
        <RG.Indicator className="block h-2 w-2 rounded-full bg-white mx-auto" />
      </RG.Item>
      <span className="text-slate-800">{label}</span>
    </label>
  );
}
```

`src/components/ui/checkbox.tsx`:
```tsx
import * as CB from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

export function CheckboxItem({
  value, label, checked, onCheckedChange, disabled
}: {
  value: string;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-md border border-slate-200 hover:bg-slate-50 aria-disabled:opacity-60">
      <CB.Root
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        disabled={disabled}
        value={value}
        className="h-4 w-4 rounded border border-slate-400 data-[state=checked]:bg-accent data-[state=checked]:border-accent flex items-center justify-center"
      >
        <CB.Indicator><Check className="h-3 w-3 text-white" /></CB.Indicator>
      </CB.Root>
      <span className="text-slate-800">{label}</span>
    </label>
  );
}
```

- [ ] **Step 2: Create `QuestionStep`**

`src/components/wizard/QuestionStep.tsx`:
```tsx
import type { Question } from "@/types";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { CheckboxItem } from "@/components/ui/checkbox";

interface Props {
  question: Question;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}

export function QuestionStep({ question, value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{question.label}</h2>
        <p className="text-sm text-slate-600 mt-1">{question.help}</p>
      </div>

      {question.type === "single" ? (
        <RadioGroup value={typeof value === "string" ? value : ""} onValueChange={(v) => onChange(v)}>
          {question.options.map(o => (
            <RadioItem key={o.value} value={o.value} label={o.label} />
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-2">
          {question.options.map(o => {
            const arr = Array.isArray(value) ? value : [];
            const isForced = question.forcedValues?.includes(o.value) ?? false;
            const checked = isForced || arr.includes(o.value);
            return (
              <CheckboxItem
                key={o.value}
                value={o.value}
                label={o.label}
                checked={checked}
                disabled={isForced}
                onCheckedChange={(v) => {
                  if (isForced) return;
                  const next = v ? [...new Set([...arr, o.value])] : arr.filter(x => x !== o.value);
                  // ensure forcedValues stay included
                  const forced = question.forcedValues ?? [];
                  onChange([...new Set([...forced, ...next])]);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Smoke-test the wizard end-to-end**

Run: `pnpm dev`
Visit `/wizard`, answer all 7 questions. Expect the URL to change to `/results?state=…` on the final click.
Kill dev server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(wizard): question step component (radio + checkbox)"
```

---

## Task 18: Wizard component-level tests

**Files:**
- Create: `tests/wizard.spec.tsx`

- [ ] **Step 1: Write failing tests**

`tests/wizard.spec.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Wizard } from "@/components/wizard/Wizard";

function setup() {
  return render(<MemoryRouter><Wizard /></MemoryRouter>);
}

describe("Wizard", () => {
  it("disables Next until the current question is answered", async () => {
    setup();
    const next = screen.getByRole("button", { name: /Next/i });
    expect(next).toBeDisabled();
    await userEvent.click(screen.getByText(/3 to 10 million/));
    expect(next).toBeEnabled();
  });

  it("shows 'See recommendation' on the last step", async () => {
    setup();
    const user = userEvent.setup();
    // advance through 6 steps, picking the first option each time
    for (let i = 0; i < 6; i++) {
      const options = screen.getAllByRole(i === 5 ? "checkbox" : "radio");
      await user.click(options[0]);
      await user.click(screen.getByRole("button", { name: /Next/i }));
    }
    expect(screen.getByRole("button", { name: /See recommendation/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — must pass**

Run: `pnpm test:run tests/wizard.spec.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/wizard.spec.tsx
git commit -m "test(wizard): component-level Next-button and final-step behavior"
```

---

## Task 19: Results page — recommendation cards

**Files:**
- Create: `src/components/results/Results.tsx`, `src/components/results/RecommendationCard.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create RecommendationCard**

`src/components/results/RecommendationCard.tsx`:
```tsx
import type { EnvironmentCard } from "@/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const ENV_LABEL: Record<EnvironmentCard["env"], string> = {
  production: "Production",
  dev:        "Development",
  test:       "Test / QA"
};

const ROLE_LABEL: Record<string, string> = {
  "all-in-one": "Single server",
  "app":        "Application server",
  "db":         "Database server",
  "app-1":      "Application server 1",
  "app-2":      "Application server 2",
  "db-1":       "Database server 1",
  "db-2":       "Database server 2"
};

export function RecommendationCard({ card }: { card: EnvironmentCard }) {
  return (
    <Card className="break-inside-avoid">
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900">{ENV_LABEL[card.env]}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {card.servers.map((s, i) => (
            <li key={i} className="border-l-2 border-accent pl-4">
              <div className="text-sm font-medium text-slate-700">{ROLE_LABEL[s.role]}</div>
              <div className="text-sm text-slate-600">
                {s.vcpu} vCPU · {s.ramGiB} GiB RAM · {s.diskGB} GB NVMe SSD · {s.networkGbps} Gbps
              </div>
            </li>
          ))}
        </ul>

        <div className="pt-3 border-t border-slate-100 text-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Cloud equivalents</div>
          <ul className="text-slate-700 space-y-1">
            <li><span className="font-medium">AWS:</span> {card.skus.aws}</li>
            <li><span className="font-medium">Hetzner:</span> {card.skus.hetzner}</li>
            <li><span className="font-medium">OVH:</span> {card.skus.ovh}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create Results page**

`src/components/results/Results.tsx`:
```tsx
import { useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { decodeAnswers } from "@/lib/state";
import { recommend } from "@/lib/recommend";
import { RecommendationCard } from "@/components/results/RecommendationCard";
import { Button } from "@/components/ui/button";

export function Results() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const encoded = params.get("state");
  const answers = useMemo(() => (encoded ? decodeAnswers(encoded) : null), [encoded]);

  if (!answers) {
    return (
      <div className="space-y-4">
        <p>No answers found in URL.</p>
        <Button onClick={() => navigate("/wizard")}>Start over</Button>
      </div>
    );
  }

  const r = recommend(answers);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Recommended configuration</h1>
        <p className="text-slate-700">
          Based on your answers, you fall into <strong>Bracket {r.bracket}</strong>.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {r.cards.map(c => <RecommendationCard key={c.env} card={c} />)}
      </div>

      <div className="flex flex-wrap gap-3 print:hidden">
        <Button onClick={() => window.print()}>Print / Save as PDF</Button>
        <Button variant="outline" onClick={() => {
          navigator.clipboard.writeText(window.location.href);
        }}>Copy share link</Button>
        <Link to={`/wizard`}><Button variant="ghost">← Edit answers</Button></Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add print stylesheet**

Append to `src/styles.css`:
```css
@media print {
  header, footer, .print\:hidden { display: none !important; }
  main { max-width: none; padding: 0; }
  .grid { display: block; }
  .break-inside-avoid { break-inside: avoid; margin-bottom: 1rem; }
}
```

- [ ] **Step 4: Wire route**

In `src/App.tsx`:
```tsx
<Route path="/results" element={<Results />} />
```
and `import { Results } from "@/components/results/Results";`.

- [ ] **Step 5: Smoke-test in browser**

Run: `pnpm dev`. Complete the wizard. Verify the results page renders one or more cards. Try Print preview (Cmd+P) — header/footer/buttons hidden.
Kill dev server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(results): recommendation cards + print stylesheet + share link"
```

---

## Task 20: Rationale block + warnings

**Files:**
- Create: `src/components/results/RationaleBlock.tsx`, `src/components/results/Warnings.tsx`, `src/components/ui/collapsible.tsx`
- Modify: `src/components/results/Results.tsx`

- [ ] **Step 1: Create Collapsible primitive**

`src/components/ui/collapsible.tsx`:
```tsx
import * as C from "@radix-ui/react-collapsible";
import { ReactNode, useState } from "react";

export function Collapsible({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <C.Root open={open} onOpenChange={setOpen}>
      <C.Trigger className="text-sm text-accent hover:underline">{open ? "▼" : "▶"} {trigger}</C.Trigger>
      <C.Content className="pt-3 text-sm text-slate-700 leading-relaxed">{children}</C.Content>
    </C.Root>
  );
}
```

- [ ] **Step 2: Create RationaleBlock**

`src/components/results/RationaleBlock.tsx`:
```tsx
import { Collapsible } from "@/components/ui/collapsible";

export function RationaleBlock({ rationale }: { rationale: string }) {
  return (
    <div className="border-t border-slate-200 pt-6">
      <Collapsible trigger="Why this size?">
        <p>{rationale}</p>
        <p className="mt-3 text-xs text-slate-500">
          Reference deployments used to anchor these brackets: a small-country reference
          (load ~5%, 78% memory, 10 GiB swap in use) and a large-country reference
          (Postgres 123 GB, 781 GB on disk after operational use).
        </p>
      </Collapsible>
    </div>
  );
}
```

- [ ] **Step 3: Create Warnings**

`src/components/results/Warnings.tsx`:
```tsx
import type { WarningCode } from "@/types";

const MESSAGES: Record<WarningCode, string> = {
  "ha-overkill-for-bracket-a":
    "HA usually only pays off at Bracket B+. For small deployments consider a single server with good backups.",
  "implausible-load-spread":
    "Your answers span a wide load range (e.g. large population but very few applications). Double-check questions 2 and 3 before procuring."
};

export function Warnings({ codes }: { codes: WarningCode[] }) {
  if (codes.length === 0) return null;
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 space-y-1">
      {codes.map(c => <p key={c}>⚠ {MESSAGES[c]}</p>)}
    </div>
  );
}
```

- [ ] **Step 4: Wire into Results**

In `src/components/results/Results.tsx`, import both and insert above the cards grid:
```tsx
import { Warnings } from "@/components/results/Warnings";
import { RationaleBlock } from "@/components/results/RationaleBlock";

// inside the return, before the grid:
<Warnings codes={r.warnings} />
```

And after the action buttons:
```tsx
<RationaleBlock rationale={r.rationale} />
```

- [ ] **Step 5: Smoke-test**

Run: `pnpm dev`. Walk the wizard with answers that trigger warnings (population=small + services=small + applications=large + topology=ha). Verify both warning panels render.
Kill dev server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(results): rationale block + warning panels"
```

---

## Task 21: About page

**Files:**
- Create: `src/components/About.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create About page**

`src/components/About.tsx`:
```tsx
export function About() {
  return (
    <div className="prose prose-slate max-w-none space-y-4">
      <h1 className="text-2xl font-semibold">About this tool</h1>
      <p>
        This sizing tool produces server recommendations for new eRegistrations country deployments.
        Recommendations are anchored to live measurements from existing operational deployments,
        not to vendor specifications or theoretical capacity calculations.
      </p>
      <h2 className="text-xl font-semibold pt-4">How the recommendation works</h2>
      <ul className="list-disc list-inside space-y-1 text-slate-700">
        <li>Three questions about country and service scope are scored 1–3 and averaged into a Bracket A / B / C.</li>
        <li>Two questions about document uploads and planning horizon adjust the disk recommendation.</li>
        <li>Selected environments produce additional cards, with Dev and Test scaled to roughly one-third of Production.</li>
        <li>The chosen topology determines how the per-environment spec splits across one, two, or four servers.</li>
      </ul>
      <h2 className="text-xl font-semibold pt-4">Limitations</h2>
      <p className="text-slate-700">
        The tool produces a starting point, not a binding specification. Procurement decisions should
        be reviewed with the engineering team responsible for operating the deployment.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Wire route**

In `src/App.tsx`:
```tsx
<Route path="/about" element={<About />} />
```
and `import { About } from "@/components/About";`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: about page with methodology and limitations"
```

---

## Task 22: Dockerfile + nginx config

**Files:**
- Create: `Dockerfile`, `nginx.conf`, `.dockerignore`

- [ ] **Step 1: Create `.dockerignore`**

```
node_modules
dist
.git
.github
.vscode
coverage
docs
tests
*.log
```

- [ ] **Step 2: Create `nginx.conf`**

```
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;
  gzip_min_length 1024;

  location ~* \.(?:js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

- [ ] **Step 3: Create `Dockerfile`**

```dockerfile
# Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Runtime
FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null || exit 1
```

- [ ] **Step 4: Build the image locally**

Run: `docker build -t eregistrations-server-sizing:dev .`
Expected: Image builds; `docker image ls | grep eregistrations-server-sizing` shows the tag.

- [ ] **Step 5: Run and verify locally**

Run: `docker run --rm -p 8080:80 eregistrations-server-sizing:dev`
Visit `http://localhost:8080/` — landing page renders. Visit `http://localhost:8080/wizard` — wizard renders (SPA fallback works). Ctrl-C to stop.

- [ ] **Step 6: Commit**

```bash
git add Dockerfile nginx.conf .dockerignore
git commit -m "build: multi-stage Dockerfile + nginx SPA config"
```

---

## Task 23: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:run
      - run: pnpm build

      - name: Verify Docker image builds
        run: docker build -t local/eregistrations-server-sizing:ci .
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: typecheck + lint + test + build + docker"
```

---

## Task 24: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

`README.md`:
```markdown
# eRegistrations Server Sizing

Static web tool that recommends a server configuration for new eRegistrations country deployments. Hosted at https://sizing.eregistrations.dev.

## Run locally

    pnpm install
    pnpm dev          # http://localhost:5173
    pnpm test         # watch mode
    pnpm test:run     # single run
    pnpm typecheck
    pnpm lint
    pnpm build

## How to add or edit a question

Questions live in `src/data/questions.json`. Each entry has an `id` (must match a key in the `Answers` type in `src/types.ts`), `label`, `help`, `type` (`single` | `multi`), and `options`. Load-scoring options need a `loadScore` ∈ {1, 2, 3}.

## How to retune the brackets

Edit `src/lib/brackets.ts`. Each bracket has `vcpu`, `ramGiB`, `diskGB`, `networkGbps`. Tests in `tests/recommend.spec.ts` include anchor fixtures from real-server measurements; update them in lock-step.

## How to add a cloud SKU

Edit `src/lib/cloud-skus.ts`. Add the SKU per bracket.

## Deployment

Coolify watches `main` for new commits and rebuilds the Docker image. The deployed URL is `https://sizing.eregistrations.dev`. The repo's `Dockerfile` is multi-stage (node:20-alpine builder → nginx:alpine runtime).

## License

See LICENSE.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## Task 25: Push to GitHub (`unctad-ai/eregistrations-server-sizing`)

**Files:** none modified.

- [ ] **Step 1: Create the remote repository**

Run: `gh repo create unctad-ai/eregistrations-server-sizing --public --description "Server sizing advisor for eRegistrations country deployments" --source . --remote origin --push`

If `gh` errors with "not authenticated", run `gh auth login` interactively first, then retry. If the org requires SSO, follow the link `gh` prints to authorize.

- [ ] **Step 2: Verify CI ran**

Run: `gh run list --limit 1`
Expected: a recent run on `main` with status `completed` and conclusion `success`. If `in_progress`, wait until done. If `failed`, fix the underlying issue and push a fixup commit.

---

## Task 26: Coolify deployment

**Files:** none modified.

- [ ] **Step 1: Choose deployment skill**

Two existing skills target Coolify on the eRegistrations infrastructure:
- `deploy:request-deploy` — opens an issue on `unctad-ai/deploy` to request Coolify provisioning. Best for first-time provision.
- `provision-coolify` — for already-onboarded country voice-agent projects; not the right fit for a new fresh app.

Use `deploy:request-deploy` for this task.

- [ ] **Step 2: Invoke the deploy request**

Trigger the skill and supply:
- Repo: `unctad-ai/eregistrations-server-sizing`
- Framework: Dockerfile build pack
- Domain: `sizing.eregistrations.dev`
- Port: `80`
- Branch: `main` with autoredeploy
- No env vars, no secrets, no DB
- Wildcard TLS cert already covers `*.eregistrations.dev`

- [ ] **Step 3: Verify post-deploy**

Once Coolify finishes provisioning, run from a workstation:
```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://sizing.eregistrations.dev/
```
Expected: `200`.

Also test SPA routing:
```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://sizing.eregistrations.dev/results
```
Expected: `200` (nginx SPA fallback serves `index.html`).

---

## Self-Review

**1. Spec coverage check (all 7 sections of the spec):**

| Spec section | Implemented in |
|---|---|
| Architecture / repo layout | Tasks 1, 2, 22 |
| Question model (7 questions) | Task 4 |
| Algorithm — bracket selection | Tasks 5, 6 |
| Algorithm — disk multiplier | Task 7 |
| Algorithm — environment scaling | Task 8 |
| Algorithm — topology | Task 9 |
| Cloud SKU mapping | Task 12 |
| Edge cases / warnings | Task 10 |
| Anchor fixtures | Task 11 |
| Rationale | Task 13 |
| Routes (`/`, `/wizard`, `/results`, `/about`) | Tasks 15, 16, 19, 21 |
| URL state encoding | Task 14 |
| Wizard step layout | Tasks 16, 17 |
| Results page (cards, rationale, warnings, actions) | Tasks 19, 20 |
| Visual style (Tailwind + shadcn, single accent) | Task 2 |
| Unit tests on `recommend()` | Tasks 5–13 |
| Component tests on wizard | Task 18 |
| URL round-trip tests | Task 14 |
| Build / lint gates | Task 3 |
| CI | Task 23 |
| Deployment (Coolify + sizing.eregistrations.dev) | Tasks 22, 25, 26 |

No spec section is unimplemented.

**2. Placeholder scan:** No "TBD", "TODO", "similar to Task N", or vague-handwave instructions remain. Every code block contains the actual content.

**3. Type consistency check:** `recommend()` returns `Recommendation` (Task 4); all consumers (`Results.tsx`, tests) reference the same type. `ServerSpec.role` strings (`all-in-one`, `app`, `db`, `app-1`, `app-2`, `db-1`, `db-2`) are defined in Task 4 and used in Tasks 9 and 19. `WarningCode` strings are defined in Task 4 and consumed in Tasks 10 and 20.

**4. Scope:** Single coherent project; one repo; one deploy target.
