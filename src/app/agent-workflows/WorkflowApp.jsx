"use client";
import { useState, useEffect, useCallback, useRef } from "react";

// ── Azure Infra Components ──────────────────────────────────────────
const INFRA = {
  orchestrator: { label: "Durable Functions Orchestrator", icon: "⚡", color: "#0078D4", desc: "Deterministic replay-safe orchestration. No I/O allowed — pure control flow. Checkpoints to Azure Storage after each yield." },
  activity:     { label: "Activity Function (Isolated)", icon: "◻", color: "#50E6FF", desc: "Each step runs as an isolated activity. Receives typed input, returns typed output. Own context window — no ambient state." },
  aoai:         { label: "Azure OpenAI Service", icon: "◈", color: "#8B5CF6", desc: "LLM calls happen inside activities only. Each activity constructs a fresh prompt from schema-defined inputs. No shared conversation." },
  cosmos:       { label: "Cosmos DB (Audit Log)", icon: "▣", color: "#FFB900", desc: "Append-only audit records. Input/output hashes, gate results, timestamps, reviewer IDs. Point-in-time reconstruction." },
  blob:         { label: "Immutable Blob Storage", icon: "▤", color: "#FF8C00", desc: "WORM-compliant payload storage. Full input/output payloads written per step. Legal hold / time-based retention." },
  eventgrid:    { label: "Azure Event Grid", icon: "↗", color: "#22C55E", desc: "Human-in-the-loop resume signal. Approval app publishes event → raise_event on Durable Functions instance." },
  keyvault:     { label: "Azure Key Vault", icon: "🔑", color: "#E74856", desc: "Gate thresholds, schema versions, secrets. Audit logging on every read. Per-step config versioned here." },
  appinsights:  { label: "Application Insights", icon: "◉", color: "#B4009E", desc: "Distributed tracing. Auto-correlates via orchestration instance_id. End-to-end trace from trigger to completion." },
};

// ── Step Contract ──────────────────────────────────────────────────
const STEP_CONTRACT = [
  { phase: "INPUT VALIDATION", desc: "Pydantic schema enforcement on incoming payload", color: "#3B82F6", where: "Orchestrator" },
  { phase: "EXECUTION", desc: "Activity function — isolated context, typed I/O", color: "#50E6FF", where: "Activity (isolated)" },
  { phase: "OUTPUT VALIDATION", desc: "Schema + business rule check on result", color: "#A78BFA", where: "Orchestrator" },
  { phase: "GATE EVALUATION", desc: "Pure predicate — no I/O, deterministic", color: "#F59E0B", where: "Orchestrator" },
  { phase: "AUDIT COMMIT", desc: "Hash(input) + Hash(output) + gate result → Cosmos + Blob", color: "#FFB900", where: "Activity → Cosmos + Blob" },
  { phase: "TRANSITION", desc: "Proceed / retry / suspend for human / fail", color: "#22C55E", where: "Orchestrator" },
];

// ── Pipeline States ──────────────────────────────────────────────
const STATES = {
  IDLE:          { label: "Idle",           icon: "○", color: "#6B7280", desc: "Awaiting trigger (Event Grid / HTTP / Queue)", infra: ["eventgrid"] },
  INGEST:        { label: "Ingest",         icon: "↓", color: "#3B82F6", desc: "Pull documents from source → stage to Blob Storage", infra: ["activity", "blob"], gate: "Source reachable, payload < 50MB, valid MIME type" },
  CLASSIFY:      { label: "Classify",       icon: "◈", color: "#8B5CF6", desc: "LLM document type classification via AOAI. Fresh context window — only doc text + taxonomy.", infra: ["activity", "aoai"], gate: "confidence > threshold (from Key Vault), doc_type ∈ allowed_types" },
  EXTRACT:       { label: "Extract",        icon: "⊞", color: "#EC4899", desc: "Structured field extraction. AOAI structured output → Pydantic model. Isolated prompt, no prior step context.", infra: ["activity", "aoai"], gate: "All required fields present, types valid, no hallucination flags" },
  VALIDATE:      { label: "Validate",       icon: "✓", color: "#F59E0B", desc: "Business rule validation. Cross-field consistency, regulatory checks, threshold enforcement.", infra: ["activity"], gate: "Zero critical violations, warnings below threshold" },
  HUMAN_REVIEW:  { label: "Human Review",   icon: "👤", color: "#EF4444", desc: "Pipeline SUSPENDS. Event Grid notification → approval app (Teams / SPA). wait_for_external_event resumes.", infra: ["eventgrid", "appinsights"], gate: "Explicit approve/reject from authorized reviewer (AAD identity)" },
  ENRICH:        { label: "Enrich",         icon: "⊕", color: "#14B8A6", desc: "Cross-reference external APIs. Entity resolution, regulatory lookups, risk scoring.", infra: ["activity", "aoai"], gate: "All enrichment sources responded, confidence above minimum" },
  PERSIST:       { label: "Persist",        icon: "▣", color: "#0EA5E9", desc: "Write final record to target system + emit domain event. Transactional outbox pattern.", infra: ["activity", "cosmos", "blob"], gate: "Write confirmed, event published, no duplicate detected" },
  COMPLETED:     { label: "Completed",      icon: "●", color: "#22C55E", desc: "Terminal success. Full audit trail committed. Orchestrator instance archived.", infra: ["cosmos", "appinsights"] },
  FAILED:        { label: "Failed",         icon: "✕", color: "#DC2626", desc: "Terminal failure. Audit trail includes failure reason, last checkpoint, retry history.", infra: ["cosmos", "appinsights"] },
  RETRYING:      { label: "Retrying",       icon: "↻", color: "#F97316", desc: "Exponential backoff via ctx.create_timer(). Resumes from last committed checkpoint — no re-execution of passed steps.", infra: ["orchestrator"] },
};

const TRANSITIONS = [
  { from: "IDLE",          to: "INGEST",       event: "trigger_received" },
  { from: "INGEST",        to: "CLASSIFY",     event: "docs_staged",           guard: "gate.passed" },
  { from: "INGEST",        to: "RETRYING",     event: "source_error",          guard: "retries < max" },
  { from: "INGEST",        to: "FAILED",       event: "source_error",          guard: "retries ≥ max" },
  { from: "CLASSIFY",      to: "EXTRACT",      event: "type_resolved",         guard: "confidence > threshold" },
  { from: "CLASSIFY",      to: "HUMAN_REVIEW", event: "low_confidence",        guard: "confidence ≤ threshold" },
  { from: "EXTRACT",       to: "VALIDATE",     event: "fields_extracted",      guard: "gate.passed" },
  { from: "EXTRACT",       to: "RETRYING",     event: "extraction_error",      guard: "retries < max" },
  { from: "VALIDATE",      to: "ENRICH",       event: "rules_passed",          guard: "zero critical violations" },
  { from: "VALIDATE",      to: "HUMAN_REVIEW", event: "rules_failed",          guard: "violations.fixable" },
  { from: "VALIDATE",      to: "FAILED",       event: "rules_failed",          guard: "!violations.fixable" },
  { from: "HUMAN_REVIEW",  to: "EXTRACT",      event: "corrections_submitted", guard: null },
  { from: "HUMAN_REVIEW",  to: "VALIDATE",     event: "human_approved",        guard: "reviewer in AAD group" },
  { from: "HUMAN_REVIEW",  to: "FAILED",       event: "human_rejected",        guard: null },
  { from: "ENRICH",        to: "PERSIST",      event: "enrichment_done",       guard: "gate.passed" },
  { from: "ENRICH",        to: "RETRYING",     event: "api_timeout",           guard: "retries < max" },
  { from: "PERSIST",       to: "COMPLETED",    event: "write_confirmed",       guard: "gate.passed" },
  { from: "PERSIST",       to: "RETRYING",     event: "write_failed",          guard: "retries < max" },
  { from: "RETRYING",      to: "INGEST",       event: "retry_checkpoint",      guard: "checkpoint == ingest" },
  { from: "RETRYING",      to: "EXTRACT",      event: "retry_checkpoint",      guard: "checkpoint == extract" },
  { from: "RETRYING",      to: "ENRICH",       event: "retry_checkpoint",      guard: "checkpoint == enrich" },
  { from: "RETRYING",      to: "PERSIST",      event: "retry_checkpoint",      guard: "checkpoint == persist" },
  { from: "RETRYING",      to: "FAILED",       event: "max_retries_exceeded",  guard: null },
];

// Sim path: happy path with one human review detour
const SIM_SEQUENCE = [
  { state: "IDLE",         duration: 700,  log: "Event Grid trigger: new_document_batch (3 files)", phases: [] },
  { state: "INGEST",       duration: 1200, log: "Activity → Pull from source → Blob Storage staging", phases: ["INPUT VALIDATION", "EXECUTION", "OUTPUT VALIDATION", "GATE EVALUATION", "AUDIT COMMIT", "TRANSITION"] },
  { state: "CLASSIFY",     duration: 1600, log: "Activity → AOAI classify (fresh context) → MSA 0.94, SOW 0.87, NDA 0.62", phases: ["INPUT VALIDATION", "EXECUTION", "OUTPUT VALIDATION", "GATE EVALUATION", "AUDIT COMMIT", "TRANSITION"] },
  { state: "HUMAN_REVIEW", duration: 2400, log: "SUSPENDED — NDA confidence 0.62 < 0.7 threshold → Event Grid → Teams approval", phases: [] },
  { state: "EXTRACT",      duration: 1800, log: "Activity → AOAI structured output (fresh context) → parties, dates, terms", phases: ["INPUT VALIDATION", "EXECUTION", "OUTPUT VALIDATION", "GATE EVALUATION", "AUDIT COMMIT", "TRANSITION"] },
  { state: "VALIDATE",     duration: 1100, log: "Activity → Business rules: 0 critical, 1 warning → gate passed", phases: ["INPUT VALIDATION", "EXECUTION", "OUTPUT VALIDATION", "GATE EVALUATION", "AUDIT COMMIT", "TRANSITION"] },
  { state: "ENRICH",       duration: 1500, log: "Activity → D&B entity match, SEC EDGAR lookup, risk score 0.23", phases: ["INPUT VALIDATION", "EXECUTION", "OUTPUT VALIDATION", "GATE EVALUATION", "AUDIT COMMIT", "TRANSITION"] },
  { state: "PERSIST",      duration: 1000, log: "Activity → Cosmos write + domain event → transactional outbox confirmed", phases: ["INPUT VALIDATION", "EXECUTION", "OUTPUT VALIDATION", "GATE EVALUATION", "AUDIT COMMIT", "TRANSITION"] },
  { state: "COMPLETED",    duration: 0,    log: "Orchestrator complete. Audit trail: 7 steps, 1 human review, 0 retries.", phases: [] },
];

// ── Node layout ────────────────────────────────
const POSITIONS = {
  IDLE:          { x: 80,  y: 40 },
  INGEST:        { x: 80,  y: 130 },
  CLASSIFY:      { x: 80,  y: 220 },
  EXTRACT:       { x: 80,  y: 310 },
  VALIDATE:      { x: 80,  y: 400 },
  ENRICH:        { x: 80,  y: 490 },
  PERSIST:       { x: 80,  y: 580 },
  COMPLETED:     { x: 80,  y: 670 },
  HUMAN_REVIEW:  { x: 340, y: 310 },
  RETRYING:      { x: 340, y: 490 },
  FAILED:        { x: 340, y: 670 },
};

const NW = 180, NH = 48;

function edgePath(from, to) {
  const fx = POSITIONS[from].x + NW / 2, fy = POSITIONS[from].y + NH / 2;
  const tx = POSITIONS[to].x + NW / 2, ty = POSITIONS[to].y + NH / 2;
  const dx = tx - fx;
  if (Math.abs(dx) < 10) return `M ${fx} ${fy + NH / 2} L ${tx} ${ty - NH / 2}`;
  const sx = dx > 0 ? NW / 2 : -NW / 2;
  return `M ${fx + sx} ${fy} C ${fx + dx * 0.5} ${fy} ${tx - dx * 0.5} ${ty} ${tx - sx} ${ty}`;
}

function uniqueEdges() {
  const s = new Set();
  return TRANSITIONS.filter(t => { const k = `${t.from}->${t.to}`; if (s.has(k)) return false; s.add(k); return true; });
}

// ── Tabs ───────────────────────────────────────
const TABS = ["Pipeline", "Step Contract", "Azure Infra"];

export default function App() {
  const [tab, setTab] = useState(0);
  const [currentState, setCurrentState] = useState(null);
  const [simIdx, setSimIdx] = useState(-1);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState(null);
  const [visited, setVisited] = useState(new Set());
  const [activePhase, setActivePhase] = useState(-1);
  const timer = useRef(null);
  const phaseTimer = useRef(null);
  const logEnd = useRef(null);

  const animatePhases = useCallback((phases, cb) => {
    if (!phases || phases.length === 0) { cb(); return; }
    let i = 0;
    const next = () => {
      if (i >= phases.length) { setActivePhase(-1); cb(); return; }
      setActivePhase(i);
      i++;
      phaseTimer.current = setTimeout(next, 200);
    };
    next();
  }, []);

  const runStep = useCallback((idx) => {
    if (idx >= SIM_SEQUENCE.length) { setRunning(false); return; }
    const step = SIM_SEQUENCE[idx];
    setCurrentState(step.state);
    setSimIdx(idx);
    setVisited(p => new Set([...p, step.state]));
    setLogs(p => [...p, { ts: new Date().toISOString().slice(11, 23), state: step.state, msg: step.log }]);
    animatePhases(step.phases, () => {
      if (step.duration > 0) timer.current = setTimeout(() => runStep(idx + 1), step.duration);
    });
  }, [animatePhases]);

  const startSim = () => {
    clearTimeout(timer.current); clearTimeout(phaseTimer.current);
    setLogs([]); setVisited(new Set()); setCurrentState(null); setSimIdx(-1); setActivePhase(-1);
    setRunning(true); setTab(0);
    setTimeout(() => runStep(0), 300);
  };

  const resetSim = () => {
    clearTimeout(timer.current); clearTimeout(phaseTimer.current);
    setRunning(false); setCurrentState(null); setSimIdx(-1); setLogs([]);
    setVisited(new Set()); setSelected(null); setActivePhase(-1);
  };

  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(phaseTimer.current); }, []);

  const edges = uniqueEdges();
  const activeEdges = currentState ? TRANSITIONS.filter(t => t.from === currentState).map(t => `${t.from}->${t.to}`) : [];
  const sel = selected || currentState;

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace", background: "#06080D", color: "#E2E8F0", minHeight: "100vh", padding: "20px 24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes dash-flow { to { stroke-dashoffset: -20; } }
        @keyframes fade-in { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-glow { 0%,100% { opacity:0.3; } 50% { opacity:0.7; } }
        .log-entry { animation: fade-in 0.25s ease-out; }
        .edge-active { animation: dash-flow 0.6s linear infinite; }
        .phase-active { animation: pulse-glow 0.8s ease-in-out infinite; }
        * { scrollbar-width: thin; scrollbar-color: #1E293B #0F1117; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, margin: 0, color: "#F8FAFC", letterSpacing: "-0.02em" }}>
            <span style={{ color: "#0078D4" }}>Azure</span> Durable Functions — Gated Agentic Pipeline
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#475569", fontWeight: 300 }}>
            Per-step gate enforcement · Isolated context windows · Immutable audit trail · WORM-compliant payloads
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={startSim} disabled={running} style={{ padding: "7px 16px", fontSize: 11, fontFamily: "inherit", fontWeight: 500, background: running ? "#1E293B" : "#0078D4", color: running ? "#475569" : "#FFF", border: "none", borderRadius: 6, cursor: running ? "default" : "pointer" }}>▶ Simulate</button>
          <button onClick={resetSim} style={{ padding: "7px 16px", fontSize: 11, fontFamily: "inherit", fontWeight: 500, background: "#1E293B", color: "#94A3B8", border: "1px solid #1E293B", borderRadius: 6, cursor: "pointer" }}>↺ Reset</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: "6px 16px", fontSize: 11, fontFamily: "inherit", fontWeight: tab === i ? 600 : 400,
            background: tab === i ? "#1E293B" : "transparent", color: tab === i ? "#F8FAFC" : "#64748B",
            border: "1px solid", borderColor: tab === i ? "#334155" : "transparent",
            borderRadius: 6, cursor: "pointer", transition: "all 0.2s",
          }}>{t}</button>
        ))}
      </div>

      {/* Tab: Pipeline */}
      {tab === 0 && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {/* Graph */}
          <div style={{ flex: "0 0 540px", background: "#0A0E15", borderRadius: 10, border: "1px solid #151B28", padding: 12 }}>
            <svg width="530" height="740" viewBox="0 0 540 740">
              <defs>
                <marker id="a" viewBox="0 0 10 7" refX="9" refY="3.5" markerWidth="7" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 3.5 0 7z" fill="#253040"/></marker>
                <marker id="aa" viewBox="0 0 10 7" refX="9" refY="3.5" markerWidth="7" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 3.5 0 7z" fill="#50E6FF"/></marker>
              </defs>
              {edges.map((e, i) => {
                const k = `${e.from}->${e.to}`;
                const act = activeEdges.includes(k);
                return <path key={i} d={edgePath(e.from, e.to)} fill="none" stroke={act ? "#50E6FF" : "#151B28"} strokeWidth={act ? 1.8 : 1} strokeDasharray={act ? "6 4" : "none"} markerEnd={act ? "url(#aa)" : "url(#a)"} className={act ? "edge-active" : ""} />;
              })}
              {Object.entries(POSITIONS).map(([id, pos]) => {
                const s = STATES[id];
                const act = currentState === id;
                const vis = visited.has(id);
                const isSel = selected === id;
                const term = id === "COMPLETED" || id === "FAILED";
                return (
                  <g key={id} onClick={() => setSelected(selected === id ? null : id)} style={{ cursor: "pointer" }}>
                    {act && <rect x={pos.x - 3} y={pos.y - 3} width={NW + 6} height={NH + 6} rx={10} fill="none" stroke={s.color} strokeWidth={1.5} opacity={0.3}><animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" repeatCount="indefinite" /></rect>}
                    <rect x={pos.x} y={pos.y} width={NW} height={NH} rx={7} fill={act ? s.color + "18" : vis ? "#111622" : "#0C0F17"} stroke={act ? s.color : isSel ? "#50E6FF" : vis ? "#1E293B" : "#151B28"} strokeWidth={act || isSel ? 1.8 : 1} />
                    <text x={pos.x + 15} y={pos.y + NH / 2 + 1} fontSize={14} textAnchor="middle" dominantBaseline="central" fill={act ? s.color : vis ? s.color + "AA" : "#334155"}>{s.icon}</text>
                    <text x={pos.x + 32} y={pos.y + NH / 2 + 1} fontSize={11} fontFamily="'IBM Plex Mono', monospace" fontWeight={act ? 600 : 400} dominantBaseline="central" fill={act ? "#F8FAFC" : vis ? "#CBD5E1" : "#475569"}>{s.label}</text>
                    {term && <circle cx={pos.x + NW - 14} cy={pos.y + NH / 2} r={3.5} fill={id === "COMPLETED" ? "#22C55E" : "#DC2626"} opacity={act ? 1 : 0.35} />}
                    {/* "runs on" badge */}
                    {act && s.infra && (
                      <text x={pos.x + NW + 8} y={pos.y + NH / 2 + 1} fontSize={8} fill="#475569" dominantBaseline="central" fontFamily="'IBM Plex Mono', monospace">
                        {s.infra.map(k => INFRA[k]?.icon || "").join(" ")}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right panel */}
          <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Active step contract phases */}
            {running && currentState && STATES[currentState] && (
              <div style={{ background: "#0A0E15", borderRadius: 10, border: "1px solid #151B28", padding: 12 }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#475569", marginBottom: 6 }}>Step Contract — {STATES[currentState]?.label}</div>
                {STEP_CONTRACT.map((p, i) => {
                  const isActive = i === activePhase;
                  const isDone = i < activePhase;
                  return (
                    <div key={i} className={isActive ? "phase-active" : ""} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", marginBottom: 2,
                      borderRadius: 4, background: isActive ? p.color + "15" : "transparent",
                      transition: "background 0.2s",
                    }}>
                      <span style={{ fontSize: 10, width: 14, textAlign: "center", color: isDone ? "#22C55E" : isActive ? p.color : "#253040" }}>{isDone ? "✓" : isActive ? "▸" : "·"}</span>
                      <span style={{ fontSize: 10, fontWeight: 500, color: isActive ? p.color : isDone ? "#64748B" : "#334155", minWidth: 120 }}>{p.phase}</span>
                      <span style={{ fontSize: 9, color: isActive ? "#64748B" : "#1E293B" }}>{p.where}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* State detail */}
            <div style={{ background: "#0A0E15", borderRadius: 10, border: "1px solid #151B28", padding: 12 }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#475569", marginBottom: 6 }}>
                {sel ? "State Detail" : "Click a state or run simulation"}
              </div>
              {sel && STATES[sel] && (() => {
                const s = STATES[sel];
                const out = TRANSITIONS.filter(t => t.from === sel);
                const inb = TRANSITIONS.filter(t => t.to === sel);
                return (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 5, background: s.color + "20", color: s.color, fontSize: 13 }}>{s.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#F8FAFC" }}>{s.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 8px", lineHeight: 1.5 }}>{s.desc}</p>

                    {/* Infra tags */}
                    {s.infra && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                        {s.infra.map(k => (
                          <span key={k} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, background: INFRA[k].color + "15", color: INFRA[k].color, border: `1px solid ${INFRA[k].color}22` }}>
                            {INFRA[k].icon} {INFRA[k].label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Gate rule */}
                    {s.gate && (
                      <div style={{ fontSize: 10, padding: "6px 8px", borderRadius: 5, background: "#F59E0B0A", border: "1px solid #F59E0B22", marginBottom: 8, color: "#FDE68A", lineHeight: 1.5 }}>
                        <span style={{ color: "#F59E0B", fontWeight: 600 }}>GATE: </span>{s.gate}
                      </div>
                    )}

                    {out.length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 9, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Outbound</div>
                        {out.map((t, i) => (
                          <div key={i} style={{ fontSize: 10, padding: "3px 7px", marginBottom: 2, background: "#111622", borderRadius: 3, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "#50E6FF" }}>{t.event}</span>
                            <span style={{ color: "#475569", fontSize: 9, flexShrink: 0 }}>{t.guard && `[${t.guard}]`}</span>
                            <span style={{ color: STATES[t.to]?.color, fontSize: 9, flexShrink: 0 }}>→ {t.to}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {inb.length > 0 && (
                      <div>
                        <div style={{ fontSize: 9, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Inbound</div>
                        {inb.map((t, i) => (
                          <div key={i} style={{ fontSize: 10, padding: "3px 7px", marginBottom: 2, background: "#111622", borderRadius: 3, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                            <span style={{ color: STATES[t.from]?.color, fontSize: 9 }}>{t.from}</span>
                            <span style={{ color: "#50E6FF" }}>{t.event}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Event Log */}
            <div style={{ background: "#0A0E15", borderRadius: 10, border: "1px solid #151B28", padding: 12, flex: 1, minHeight: 120, maxHeight: 250, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#475569", marginBottom: 6 }}>Audit Event Stream</div>
              <div style={{ flex: 1, overflow: "auto", fontSize: 10, lineHeight: 1.7 }}>
                {logs.length === 0 ? (
                  <p style={{ color: "#1E293B", margin: 0 }}>Awaiting events…</p>
                ) : logs.map((l, i) => (
                  <div key={i} className="log-entry" style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{ color: "#253040", whiteSpace: "nowrap", flexShrink: 0 }}>{l.ts}</span>
                    <span style={{ color: STATES[l.state]?.color, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0, minWidth: 80 }}>[{STATES[l.state]?.label}]</span>
                    <span style={{ color: "#7B8BA3" }}>{l.msg}</span>
                  </div>
                ))}
                <div ref={logEnd} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Step Contract */}
      {tab === 1 && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ background: "#0A0E15", borderRadius: 10, border: "1px solid #151B28", padding: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: "#F8FAFC", margin: "0 0 4px" }}>Per-Step Execution Contract</h2>
            <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 16px", lineHeight: 1.5 }}>Every step in the pipeline follows this contract before the orchestrator allows a state transition. The orchestrator is deterministic and replay-safe — all I/O happens in activities.</p>
            {STEP_CONTRACT.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < STEP_CONTRACT.length - 1 ? "1px solid #151B28" : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: p.color + "18", color: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: p.color, marginBottom: 2 }}>{p.phase}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>{p.desc}</div>
                  <div style={{ fontSize: 9, color: "#475569", marginTop: 3 }}>Runs in: <span style={{ color: "#64748B" }}>{p.where}</span></div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: 12, borderRadius: 6, background: "#DC262610", border: "1px solid #DC262622" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#FCA5A5", marginBottom: 4 }}>⚠ Critical Constraint</div>
              <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>
                Gate evaluation functions must be <span style={{ color: "#FDE68A" }}>pure predicates</span> — no I/O, no API calls, no database reads. They run inside the orchestrator, which replays on crash recovery. A gate that makes a DB call will double-execute on replay. All data needed for gate evaluation must be present in the step's output payload.
              </div>
            </div>
            <div style={{ marginTop: 12, padding: 12, borderRadius: 6, background: "#0078D410", border: "1px solid #0078D422" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#60A5FA", marginBottom: 4 }}>Audit Guarantee</div>
              <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>
                For any step, you can reconstruct <span style={{ color: "#F8FAFC" }}>exactly what the LLM saw</span> (input hash → Blob) and <span style={{ color: "#F8FAFC" }}>what it returned</span> (output hash → Blob). Both hashes are committed to Cosmos DB before the orchestrator transitions. Regulators get: step name, input payload, output payload, gate result, timestamp, reviewer ID (if human-reviewed).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Azure Infra */}
      {tab === 2 && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ background: "#0A0E15", borderRadius: 10, border: "1px solid #151B28", padding: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: "#F8FAFC", margin: "0 0 4px" }}>Azure-Native Infrastructure</h2>
            <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 16px", lineHeight: 1.5 }}>Full stack for gov/finance auditability. VNET-injectable, WORM-compliant, distributed-traced.</p>
            {Object.entries(INFRA).map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid #111622" }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: v.color + "15", color: v.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{v.icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: v.color }}>{v.label}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5, marginTop: 2 }}>{v.desc}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: 12, borderRadius: 6, background: "#14B8A60A", border: "1px solid #14B8A622" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#5EEAD4", marginBottom: 4 }}>Payload Size Constraint</div>
              <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>
                Durable Functions checkpoints to Azure Storage Tables with a <span style={{ color: "#FDE68A" }}>~20KB entity limit</span>. Inter-step payloads (full document text, extraction results) must be externalized — write to Blob Storage, pass the blob reference through the orchestrator. This is architecturally correct for auditability: each payload gets its own addressable, WORM-protected blob.
              </div>
            </div>
            <div style={{ marginTop: 12, padding: 12, borderRadius: 6, background: "#F59E0B0A", border: "1px solid #F59E0B22" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#FDE68A", marginBottom: 4 }}>Tradeoff vs. Temporal</div>
              <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>
                Durable Functions' determinism is <span style={{ color: "#FDE68A" }}>convention-enforced, not SDK-enforced</span>. In Temporal, calling requests.get() from workflow code raises DeterminismError. In Durable Functions, it silently works the first time then produces nondeterministic behavior on replay. Requires code review discipline + linter rules flagging I/O in orchestrator functions.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
