import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Results } from "@/components/results/Results";
import { encodeAnswers } from "@/lib/state";
import type { Answers } from "@/types";

const base: Answers = {
  population: "medium",
  services: "medium",
  applications: "medium",
  attachments: "sometimes",
  horizon: "3y",
  environments: ["production"],
  postgresql: "local",
  mongodb: "local"
};

function renderWith(answers: Answers) {
  const state = encodeAnswers(answers);
  return render(
    <MemoryRouter initialEntries={[`/results?state=${state}`]}>
      <Results />
    </MemoryRouter>
  );
}

describe("Results page", () => {
  it("renders an all-in-one server when both databases are local", () => {
    renderWith(base);
    expect(screen.getByText("All-in-One Server")).toBeInTheDocument();
    expect(screen.getByText(/PostgreSQL on this server · MongoDB on this server/)).toBeInTheDocument();
  });

  it("renders an application server with placement note when both databases are external", () => {
    renderWith({ ...base, postgresql: "external", mongodb: "external" });
    expect(screen.getByText("Application Server")).toBeInTheDocument();
    expect(screen.getByText(/PostgreSQL externally managed · MongoDB externally managed/)).toBeInTheDocument();
    expect(screen.getByText(/externally managed → disk ×0\.70, RAM −12 GiB/)).toBeInTheDocument();
  });

  it("falls back to the no-session screen for stale topology-era links", () => {
    const stale = btoa(JSON.stringify({ ...base, postgresql: undefined, mongodb: undefined, topology: "ha" }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    render(
      <MemoryRouter initialEntries={[`/results?state=${stale}`]}>
        <Results />
      </MemoryRouter>
    );
    expect(screen.getByText(/No sizing session details detected/)).toBeInTheDocument();
  });

  it("shows the OS requirement on the environment card", () => {
    renderWith(base);
    expect(screen.getByText("OS: Ubuntu 24.04 / 26.04 LTS")).toBeInTheDocument();
  });

  it("shows a ports line with the public edge ports and local database ports", () => {
    renderWith(base);
    expect(screen.getByText(/Ports: 22, 80, 443 public/)).toBeInTheDocument();
    expect(screen.getByText(/5432 PostgreSQL \(internal\)/)).toBeInTheDocument();
  });

  it("omits the PostgreSQL port when both databases are external", () => {
    renderWith({ ...base, postgresql: "external", mongodb: "external" });
    expect(screen.getByText(/Ports: 22, 80, 443 public/)).toBeInTheDocument();
    expect(screen.queryByText(/5432/)).not.toBeInTheDocument();
  });

  it("mentions the installer hard minimum in the notes panel", () => {
    renderWith(base);
    expect(screen.getByText(/hard minimum is 4 vCPU \/ 8 GB RAM \/ 100 GB disk/)).toBeInTheDocument();
    expect(screen.getByText(/16 GB swapfile/)).toBeInTheDocument();
  });
});
