# eRegistrations Server Sizing — Design

- **Status:** Approved (brainstorming)
- **Date:** 2026-05-28
- **Target repo:** `unctad-ai/eregistrations-server-sizing`
- **Local path:** `~/PROJECTS/software-factory/eregistrations-server-sizing`

## Problem

Onboarding a new country to the eRegistrations platform requires advising on the right server configuration to procure. This conversation happens ad-hoc for every country: an engineer SSHes into reference servers (Lesotho, Palestine) to read utilization, then translates the readings into a recommendation by hand. The advice is grounded in real data but the process is not productized, so it is slow, inconsistent, and bottlenecked on the engineer who knows where to look.

## Goals

- Give country partners a self-service tool that produces a defensible server configuration in under two minutes.
- Anchor the recommendation to real measurements from operational eRegistrations servers.
- Cover production, dev, and test environments, with single / split-DB / HA topology choices.
- Output a procurement-ready spec including cloud-SKU equivalents (AWS, Hetzner, OVH).

## Non-Goals (v1)

- Multi-language UI. English only at launch; wording lives in JSON so translation later is mechanical.
- User accounts, saved configurations, or backend persistence.
- E2E browser testing, visual regression testing, load testing.
- Telemetry.

## Audience

External partners and government counterparts during eRegistrations onboarding. Public-ish URL. Internal benchmark names (lesotho2, palbusiness) are anonymized to "Small-country reference deployment", "Large-country reference deployment" in any user-facing copy.

## Architecture

### Stack

- **Vite + React + TypeScript** for the SPA.
- **Tailwind + shadcn/ui** for components.
- **Vitest + Testing Library** for tests.
- **No backend.** The recommendation is a deterministic pure function executed in the browser.

### Repo layout

```
eregistrations-server-sizing/
├── src/
│   ├── components/              # Wizard, ResultsCards, Layout
│   ├── lib/
│   │   ├── recommend.ts         # Pure function: answers → spec
│   │   ├── brackets.ts          # A/B/C base specs
│   │   └── cloud-skus.ts        # AWS / Hetzner / OVH mappings
│   ├── data/
│   │   ├── benchmarks.json      # Anonymized reference snapshots
│   │   └── questions.json       # Wizard question definitions
│   ├── App.tsx
│   └── main.tsx
├── tests/                       # Vitest unit + component tests
├── docs/
│   └── superpowers/specs/       # This document and any successors
├── Dockerfile                   # Multi-stage build → nginx:alpine
├── nginx.conf                   # SPA fallback for client-side routing
├── .github/workflows/ci.yml     # tsc + lint + test + build
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── package.json
└── README.md
```

### Deployment target

- **Platform:** Coolify on the existing UNCTAD Coolify host (`*.eregistrations.dev` wildcard already points to it).
- **URL:** `https://sizing.eregistrations.dev`.
- **Packaging:** a small `Dockerfile` in the repo, multi-stage:
  1. `node:20-alpine` builder runs `pnpm install` + `pnpm build`, producing `dist/`.
  2. `nginx:alpine` runtime copies `dist/` into `/usr/share/nginx/html` and ships a single-page-app `nginx.conf` (try_files fallback to `/index.html`).
- **Coolify resource:** new application sourced from the GitHub repo `unctad-ai/eregistrations-server-sizing`, Dockerfile build pack, port `80`, domain `sizing.eregistrations.dev`, autoredeploy on push to `main`.
- **Operational notes:** no env vars required (pure static build); no database; no secrets. Coolify handles TLS via its existing wildcard cert for `*.eregistrations.dev`.

The choice between Coolify and other static hosts (Cloudflare Pages, GitHub Pages) is now closed: Coolify keeps the tool in the same operational footprint as the rest of `eregistrations.dev`.

## Question Model

Seven questions, all bucketed (no free numeric input). Defined in `src/data/questions.json` so wording can be tuned without code changes. No conditional logic in v1: every question is asked every time.

| # | Question | Type | Options | Drives |
|---|---|---|---|---|
| 1 | Country / service population | single | < 3 M  /  3–10 M  /  > 10 M | Base bracket |
| 2 | Services launched in year 1 | single | 1–5  /  6–15  /  16+ | Base bracket |
| 3 | Expected applications per year | single | < 50 k  /  50 k–500 k  /  > 500 k | Base bracket |
| 4 | Application document uploads | single | Rarely  /  Sometimes  /  Most of the time | Disk multiplier |
| 5 | Planning horizon | single | 1 y  /  3 y  /  5 y | Disk multiplier |
| 6 | Environments | multi | Production *(required)*  +  Dev  +  Test | Cards emitted |
| 7 | Topology | single | Single  /  Split DB  /  HA cluster | Server count per env |

### JSON shape

```json
{
  "questions": [
    {
      "id": "population",
      "label": "What is the population this service will serve?",
      "help": "Use the country population, or the relevant subset if the service is sectoral.",
      "type": "single",
      "options": [
        { "value": "small",  "label": "Less than 3 million",  "loadScore": 1 },
        { "value": "medium", "label": "3 to 10 million",      "loadScore": 2 },
        { "value": "large",  "label": "More than 10 million", "loadScore": 3 }
      ]
    }
  ]
}
```

## Recommendation Algorithm

Two stages: pick a base bracket from load proxies, then adjust for disk, environment, and topology.

### Stage 1 — Base bracket

Questions 1, 2, 3 each yield a load score ∈ {1, 2, 3}. Compute the rounded average.

| Average load | Bracket | Base spec (production, single server) |
|---|---|---|
| 1.0 – 1.5 | **A — Small** | 8 vCPU  /  32 GiB  /  500 GB NVMe  /  1 Gbps |
| 1.6 – 2.5 | **B — Mid** *(default)* | 8 vCPU  /  64 GiB  /  1 TB NVMe  /  1 Gbps |
| 2.6 – 3.0 | **C — Large** | 12 vCPU  /  96 GiB  /  2 TB NVMe  /  1 Gbps |

#### Why these numbers

- **Bracket A** reflects what the small-country reference *should* have had. The reference runs 16 vCPU / 30 GiB but uses only 4–5 % CPU steady-state and shows 10 GiB swap in use with commit ratio 163 % — RAM bumped from 30 → 32 GiB, CPU halved from 16 → 8.
- **Bracket C** matches what the large-country reference demonstrates in production: Postgres 123 GB (GDB alone 66 GB), MongoDB 9.4 GB, Camunda container alone 9.6 GiB, 781 GB used on disk after operational use.
- **Bracket B** interpolates and is the safe default for ambiguous input.

### Stage 2 — Adjustments

**Disk multiplier** is applied to the base SSD size, then rounded up to the next 250 GB step.

| Q4 attachment level | × multiplier | Q5 horizon | × multiplier |
|---|---|---|---|
| Rarely | 1.0 | 1 y | 1.0 |
| Sometimes | 1.3 | 3 y | 1.5 |
| Most of the time | 1.8 | 5 y | 2.0 |

The two multipliers compose. Example: Bracket B (1 TB) + Sometimes attachments + 5-year horizon → 1 TB × 1.3 × 2.0 = 2.6 TB → rounded to **3 TB**.

**Environment scaling** — one card emitted per environment in Q6.

| Environment | × CPU | × RAM | × Disk |
|---|---|---|---|
| Production | 1.0 | 1.0 | 1.0 |
| Dev | 0.5 | 0.5 | 0.3 |
| Test | 0.5 | 0.5 | 0.3 |

Rounding rules after scaling:
- vCPU → up to next even integer.
- RAM → up to next 8 GiB step.
- Disk → up to next 250 GB step.

**Topology (Q7)** determines how many servers each environment card shows.

| Topology | Servers per environment |
|---|---|
| Single | 1 box, full spec |
| Split DB | 1 app server (full CPU/RAM, ⅓ of disk) + 1 DB server (½ CPU, full RAM, ⅔ of disk) |
| HA cluster | 2 app servers + 2 DB servers, each at the per-node spec |

### Pseudocode

```typescript
function recommend(answers: Answers): Recommendation {
  const loadAvg = avg([answers.population, answers.services, answers.applications].map(toScore));
  const base = pickBracket(loadAvg);

  const adjustedDisk = base.diskGB
    * attachmentMultiplier(answers.attachments)
    * horizonMultiplier(answers.horizon);

  const adjusted = { ...base, diskGB: roundUpTo250(adjustedDisk) };

  return {
    bracket: base.id,
    cards: answers.environments.map(env => ({
      env,
      servers: topologyServers(answers.topology, scale(adjusted, envMultiplier(env))),
      skus:    lookupCloudSkus(adjusted, env, answers.topology),
      rationale: buildRationale(answers, base, adjusted),
    })),
  };
}
```

### Cloud-SKU mapping (`src/lib/cloud-skus.ts`)

| Bracket | AWS | Hetzner Cloud | OVH |
|---|---|---|---|
| A | `m6i.2xlarge` (8 / 32) | `CCX23` (8 / 32) | `Advance-1` |
| B | `r6i.2xlarge` (8 / 64) | `CCX33` (8 / 64) | `Advance-2` |
| C | `r6i.4xlarge` (16 / 128) ¹ | `CCX43` (16 / 64) ² | `HG-2` |

¹ Closest standard SKU; over-provisions slightly on CPU and RAM.
² Hetzner does not sell an exact 96 GiB SKU; the results page shows the 64 and 128 GiB options with a note.

### Edge cases

- **Unanswered question** — the UI disables Next; the algorithm never receives partial input.
- **Production deselection** — Q6 enforces that Production cannot be removed.
- **HA + Bracket A** — the result page shows a warning panel: *"HA usually only pays off at Bracket B+; consider single-server with backups."*
- **Implausible combinations** (e.g. Large population + 1–5 services + < 50 k applications) — the result page shows a soft note: *"Your inputs span a wide load range; double-check Q2 / Q3 before procuring."*

## UI Flow

### Routes

| Path | Purpose |
|---|---|
| `/` | Landing page: short pitch + "Start sizing" CTA |
| `/wizard` | Multi-step wizard (1/7 → 7/7) with progress bar |
| `/results?state=…` | Computed cards + rationale; `state` is URL-safe base64 of the answers (enables share + bookmark) |
| `/about` | Methodology and contact |

### Wizard step layout

- Single column, max width ~640 px.
- One question per step. Help text under the title.
- Next disabled until current question is answered.
- Back preserves all previous answers.
- Keyboard accessible: Tab through options, arrow keys, Enter to advance.

### Results page

- One shadcn `Card` per environment in Q6.
- Each card shows vCPU / RAM / Disk / Network plus cloud-SKU equivalents.
- Card layout reflects topology: a single box for Single, App + DB stacked for Split DB, 2 × 2 grid for HA.
- A collapsible **"Why this size?"** block expands the explicit reasoning chain (e.g. *"Population: medium (2) + Services: 6–15 (2) + Applications: 50 k–500 k (2) → avg 2.0 → Bracket B. Attachments: Sometimes ×1.3, Horizon: 5 y ×2.0 → Disk: 1 TB → 2.6 TB → rounded to 3 TB."*).
- Actions: **Print / Save as PDF** (via `window.print()` + dedicated print stylesheet), **Copy share link**, **Edit** (returns to wizard with answers prefilled).

### Visual style

- Tailwind + shadcn/ui defaults; neutral palette with a single subtle accent.
- Inter or system-font stack.
- Light mode only in v1 (simpler print output, trivial to add dark mode later).
- Responsive down to phone width; primary target is desktop and tablet.

## Testing

### Unit tests on `recommend()` (primary coverage)

Anchored fixtures use the live measurements from the analysis that motivated this project.

| Fixture | Expected output |
|---|---|
| Small-country profile (small / small / small / sometimes / 1 y / prod / single) | Bracket A, 1 card, 8 vCPU / 32 GiB / 500 GB |
| Large-country profile (medium / large / large / most / 5 y / prod / single) | Bracket C, 1 card, 12 vCPU / 96 GiB / ≥ 2 TB |
| Mid default (medium / medium / medium / sometimes / 3 y / prod+dev+test / single) | Bracket B, 3 cards |

Additional coverage:

- Each attachment × horizon combination on Bracket B (9 tests).
- Each topology branch (3 tests).
- Each environment combination (4 tests: P, P+D, P+T, P+D+T).
- Edge cases: implausible combo warning, HA + Bracket A warning.

Total ≈ 25–35 tests; should run in under one second.

### Component-level tests on the wizard

- Wizard cannot advance with an unanswered question.
- Production cannot be deselected in Q6.
- URL state encoding/decoding round-trips correctly.

### Build / lint gates

```
pnpm tsc --noEmit
pnpm lint
pnpm test --run
pnpm build
```

### CI

GitHub Actions on push + PR running the gates above. No deploy step in v1 — hosting is chosen out-of-band.

## Open Questions

- Whether to include a "submit feedback" `mailto:` link in v1 (defaulting to *no* unless explicitly asked).

## References

- Small-country reference (lesotho2): 16 vCPU / 30 GiB / 360 GB; 10 GiB swap in use; 78 % memory used; CPU idle ≈ 93 %; commit ratio 163 %.
- Large-country reference (palbusiness): 12 vCPU / 62 GiB / 1.5 TB; 11 GiB swap in use; 781 GB used on disk; Postgres 123 GB; MongoDB 9.4 GB.
