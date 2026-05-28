export function About() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">About this tool</h1>
      <p className="text-slate-700">
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
