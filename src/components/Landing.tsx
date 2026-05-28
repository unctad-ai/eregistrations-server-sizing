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
      <Link to="/wizard">
        <Button>Start sizing →</Button>
      </Link>
    </div>
  );
}
