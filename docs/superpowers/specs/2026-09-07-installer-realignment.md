# Installer Realignment — Database Placement Replaces Topology

- **Date:** 2026-09-07
- **Supersedes:** the topology question (Q7) and Stage-2 topology table of `2026-05-28-eregistrations-server-sizing-design.md` (kept as history)

## Decision

The v1 design offered three deployment topologies: single, split-db, HA cluster. Ground truth from `eregistrations-installer` shows only the first exists in reality:

- The installer generates single-host inventories only (`installer/inventory.py`); `"remote"` DB hosts are explicitly unsupported (`installer/config.py`).
- No HA anywhere: single-node Docker Swarm, no PostgreSQL replication, no MongoDB replica set.

The wizard's topology question is replaced by the installer's actual architectural axes — per-database placement, mirroring `install.toml`'s `postgresql_mode` / `mongodb_mode`:

- **Q7 PostgreSQL:** `local` (on this server, installer standard) | `external` (managed service)
- **Q8 MongoDB:** `local` (on this server — host install on Ubuntu 24.04 or container on 26.04) | `external` (e.g. Atlas)

Every environment card is now exactly one VM.

## Sizing effect of external placement (production only)

Dev/test always co-locate their databases — nobody procures managed databases for dev.

| Placement | Disk allowance | RAM | vCPU |
|---|---|---|---|
| Both local | ×1.0 | −0 | unchanged |
| PostgreSQL external | ×0.75 | −8 GiB | unchanged |
| MongoDB external | ×0.95 | −4 GiB | unchanged |
| Both external | ×0.70 | −12 GiB | unchanged |

Anchors: PostgreSQL data + nightly dump generations ≈ 25% of the disk allowance, MongoDB ≈ 5% (large-country reference: PG 123 GB live, Mongo 9.4 GB, ~781 GB total used; installer retention is 14 nightly dump generations on the same volume). RAM: MongoDB wiredTiger cache is the installer default 4 GiB (`roles/mongodb/defaults/main.yml`); PostgreSQL's effective share on an untuned host ≈ 8 GiB. vCPU is unchanged — the ~25-service application stack drives CPU, and it always runs on the VM.

Constants live in `src/lib/db-placement.ts` (`DB_DISK_SHARE`, `DB_RAM_GIB`).

## Consequences

- `Topology` type and `split-db`/`ha` server roles removed; `ServerRole` is now `"all-in-one" | "app"`.
- `ha-overkill-for-bracket-a` warning removed; `implausible-load-spread` kept.
- Stale share links (topology-era state) are rejected by `decodeAnswers` and fall back to the no-session screen.
- Wizard is now 8 questions.
