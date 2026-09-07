# eRegistrations Server Sizing

Static web tool that recommends a server configuration for new eRegistrations country deployments. Hosted at https://sizing.eregistrations.dev.

## What it does

Answer eight bucketed questions (country population, services launched, expected applications, document upload frequency, planning horizon, environments needed, PostgreSQL placement, MongoDB placement). The tool maps your answers to one of three configuration brackets anchored to real measurements from existing eRegistrations deployments, and produces a procurement-ready spec including cloud SKU equivalents (AWS, Hetzner, OVH). Every environment is a single VM, matching the automated installer's architecture; databases declared externally managed subtract their disk and memory share from the production host.

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

## How to add a cloud SKU mapping

Edit `src/lib/cloud-skus.ts`. Add the SKU per bracket.

## Deployment

Coolify watches `main` for new commits and rebuilds the Docker image. The deployed URL is `https://sizing.eregistrations.dev`. The repo's `Dockerfile` is multi-stage (`node:20-alpine` builder → `nginx:alpine` runtime).

## Repository layout

```
src/
  components/      React components (Layout, Landing, Wizard, Results, About, UI primitives)
  data/            questions.json — wizard definition
  lib/             pure logic: brackets, recommend, cloud SKUs, rationale, state encoding
  types.ts         shared types
tests/             Vitest unit + component tests
docs/superpowers/  spec and implementation plan
Dockerfile, nginx.conf
.github/workflows/ CI definition
```
