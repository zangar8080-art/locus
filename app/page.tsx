"use client";

import { useMemo, useState } from "react";
import { loadProgramCatalog } from "../src/data/programs/catalog";
import { diagnoseAndRecommend } from "../src/domain/diagnosis";
import type { ApplicantProfile } from "../src/domain/profile";

const catalog = loadProgramCatalog();
const subject = catalog.subjects[0].subjectId;
const firstIntake = catalog.programs.find((program) => program.classification.subjectId === subject)?.intakeId ?? "september_2027";
const demoProfile = {
  qualification: { kind: "ib_diploma", version: 1, totalPoints: 36, higherLevelSubjects: [] },
  target: { subjectId: subject, countryCodes: ["GB", "CA", "NL"] },
  budget: { annualAmount: 24000, currency: "EUR" },
  effort: { weeklyHours: 8 },
  tests: [{ testId: "ielts_academic", status: "planned", score: 7 }, { testId: "sat", status: "unknown" }],
  timing: { targetIntake: firstIntake, planningDate: "2026-09-19" },
} as ApplicantProfile;

const badgeClass = (value: string) => value === "eligible" || value === "feasible" ? "badge badge-positive" : value === "insufficient_data" ? "badge badge-evidence" : "badge badge-caution";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const diagnosis = useMemo(() => diagnoseAndRecommend(demoProfile, catalog), []);
  const visible = showAll ? diagnosis.qualified : diagnosis.qualified.slice(0, 3);

  return <main data-theme={theme} className="app-frame">
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand"><span className="brand-mark">R</span><span>RouteStress</span></div>
      <p className="eyebrow">PRIVATE ALPHA</p>
      <nav className="nav-list"><a className="nav-item active" href="#diagnosis"><span>◈</span>Diagnosis</a><a className="nav-item" href="/profile"><span>◎</span>Applicant profile</a><a className="nav-item" href="#recommendations"><span>▦</span>Programs</a></nav>
      <div className="sidebar-note"><span className="lock">⌾</span><p>Your profile stays on this device.</p></div>
      <button className="theme-switch" onClick={() => setTheme(theme === "light" ? "dark" : "light")}><span>{theme === "light" ? "☾" : "☀"}</span>{theme === "light" ? "Dark theme" : "Light theme"}</button>
    </aside>
    <div className="content-wrap"><header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> Diagnosis</div><div className="top-actions"><span className="badge badge-positive">Saved locally</span><span className="avatar">AS</span></div></header>
      <div className="workspace" id="diagnosis">
        <div className="page-heading"><div><p className="eyebrow">YOUR ROUTE, UNDER PRESSURE</p><h1>Understand the route before you stress it.</h1><p className="lede">A clear diagnosis from your saved profile, curated program facts, and the requirements that decide each route.</p></div><a className="button button-secondary" href="/profile">Edit profile ↗</a></div>
        <div className="progress-strip"><div><span className="progress-label">Diagnosis status</span><strong>Ready</strong></div><div className="progress-track"><div className="progress-value" style={{ width: "100%" }} /></div><span className="progress-note">{diagnosis.recommendations.length} programs reviewed</span></div>
        <section className="card diagnosis-card"><div className="card-heading"><div><p className="eyebrow">DIAGNOSIS</p><h2>What is helping, and what needs attention</h2></div><span className="badge badge-evidence">Traceable result</span></div><div className="signal-grid diagnosis-grid">{diagnosis.findings.map((finding) => <div key={finding.title}><span className={finding.kind === "blocker" ? "badge badge-breakage" : finding.kind === "strength" ? "badge badge-positive" : "badge badge-evidence"}>{finding.kind}</span><h3>{finding.title}</h3><p>{finding.detail}</p></div>)}</div></section>
        <div className="section-heading" id="recommendations"><div><p className="eyebrow">RANKED RECOMMENDATIONS</p><h2>Programs that can carry this route</h2></div><span className="progress-note">{diagnosis.qualified.length} qualified</span></div>
        {diagnosis.shortage && <div className="scenario-warning" role="status"><span className="badge badge-caution">Shortlist is limited</span><p>{diagnosis.shortage} Unknown requirements remain visible instead of being treated as a pass.</p></div>}
        <div className="recommendation-grid">{visible.map((item) => <article className="card recommendation-card" key={item.program.programId}><div className="card-heading"><div><p className="eyebrow">RANK {item.rank}</p><h2>{item.program.programTitle.state === "known" ? item.program.programTitle.value : item.program.programId}</h2></div><span className="badge badge-positive">Qualified</span></div><p className="program-meta">{item.program.intakeLabel.state === "known" ? item.program.intakeLabel.value : "2027 intake"} · {item.program.campusName.state === "known" ? item.program.campusName.value : "International route"}</p><div className="band-row"><span className={badgeClass(item.eligibility)}>Eligibility {item.eligibility}</span><span className={badgeClass(item.feasibility)}>Feasibility {item.feasibility}</span></div><ul className="reason-list">{item.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><details><summary>View evidence trail</summary><p className="detail-copy">{item.sourceCount} curated evidence entries are available in the catalog for this program. Sources are versioned and reviewable.</p></details><button className={selected === item.program.programId ? "button button-primary full" : "button button-secondary full"} onClick={() => setSelected(item.program.programId)}>{selected === item.program.programId ? "Active route selected" : "Choose active route"}</button></article>)}</div>
        {diagnosis.qualified.length > 3 && <button className="button button-secondary reveal-button" onClick={() => setShowAll(!showAll)}>{showAll ? "Show top three" : "Show all qualified programs"}</button>}
        <section className="card next-step-card"><div><p className="eyebrow">NEXT STEP</p><h2>{selected ? "Your active route is ready for a stress test" : "Choose a route to unlock the stress test"}</h2><p className="card-copy">Change a score or timing assumption, see what breaks, and get one repair action.</p></div><span className="scenario-icon">↯</span></section>
        <footer className="footer"><span>RouteStress private alpha</span><span>Facts are curated, not predictions.</span></footer>
      </div>
    </div>
  </main>;
}
