import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServerRack } from "@/components/wizard/ServerRack";
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

describe("ServerRack", () => {
  it("renders one blade with the databases summary when both databases are local", () => {
    render(<ServerRack answers={base} />);
    expect(screen.getByText("All-in-One Server")).toBeInTheDocument();
    expect(screen.getByText("PG LOCAL · MONGO LOCAL")).toBeInTheDocument();
    expect(screen.getByText("U1")).toBeInTheDocument();
  });

  it("lists the database ports alongside the public ports when databases are local", () => {
    render(<ServerRack answers={base} />);
    expect(screen.getByText("22·80·443 public +5432·27017 app-tier")).toBeInTheDocument();
  });

  it("reflects placement when MongoDB is externally managed", () => {
    render(<ServerRack answers={{ ...base, mongodb: "external" }} />);
    expect(screen.getByText("Application Server")).toBeInTheDocument();
    expect(screen.getByText("PG LOCAL · MONGO MANAGED")).toBeInTheDocument();
    expect(screen.getByText("22·80·443 public +5432 app-tier")).toBeInTheDocument();
  });

  it("labels the network footer as the aggregate link", () => {
    render(<ServerRack answers={base} />);
    expect(screen.getByText(/Gbps aggregate link/)).toBeInTheDocument();
  });
});
