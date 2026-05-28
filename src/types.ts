export type PopulationBucket = "small" | "medium" | "large";
export type ServicesBucket = "small" | "medium" | "large";
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

export type ServerRole =
  | "all-in-one"
  | "app"
  | "db"
  | "app-1"
  | "app-2"
  | "db-1"
  | "db-2";

export interface ServerSpec {
  role: ServerRole;
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
