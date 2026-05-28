import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Landing } from "@/components/Landing";
import { About } from "@/components/About";
import { Wizard } from "@/components/wizard/Wizard";
import { Results } from "@/components/results/Results";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/wizard" element={<Wizard />} />
        <Route path="/results" element={<Results />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  );
}
