import { useState, useEffect, useRef } from "react";

const SECTIONS = [
  "Executive Summary",
  "Agent Request Data Flow",
  "Entra Agent ID",
  "Foundry Agent Service",
  "Toolkit: Policy Engine",
  "Toolkit: Trust & Identity",
  "Toolkit: Execution Rings",
  "Toolkit: SRE & Reliability",
  "Toolkit: Compliance",
  "Authorization Fabric",
  "OWASP ASI Top 10",
  "Policy Examples",
  "Regulatory Timeline",
];

function useInView(ref) {
  const [v, setV] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.1 });
    o.observe(ref.current);
    return () => o.disconnect();
  }, [ref]);
  return v;
}
function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const v = useInView(ref);
  return (<div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s` }}>{children}</div>);
}

const mono = "'JetBrains Mono', monospace";
const sans = "'DM Sans', sans-serif";
const C = { red: "#ef5350", blue: "#4fc3f7", green: "#66bb6a", orange: "#ffb74d", purple: "#ba68c8", pink: "#ff8a65", bg: "#08080e", card: "#111118", border: "#1a1a28", text: "#c8c8d8", muted: "#888", dim: "#555" };

function DataFlowDiagram() {
  const steps = [
    { label: "User / App", sub: "Request initiated", color: C.blue, x: 10 },
    { label: "Entra Agent ID", sub: "Authenticate identity\nConditional Access\nDelegated vs unattended", color: C.blue, x: 120 },
    { label: "Agent OS\nPolicy Engine", sub: "Intercept tool call\nYAML / Rego / Cedar\nIntent classification\n< 0.1ms p99", color: C.purple, x: 250 },
    { label: "Agent Mesh\nTrust Gate", sub: "Verify Ed25519 DID\nTrust score 0-1000\nScope narrowing", color: C.green, x: 380 },
    { label: "Hypervisor\nExecution Ring", sub: "Determine ring (0-3)\nResource limits\nSaga orchestration", color: C.orange, x: 510 },
    { label: "Tool / MCP\nExecution", sub: "Tool call executes\nScoped token (8693)\nSandboxed env", color: C.green, x: 640 },
  ];
  const bh = 96, y0 = 28;
  const obsY = y0 + bh + 48;
  return (
    <svg viewBox="0 0 780 275" style={{ width: "100%", maxWidth: 780, display: "block", margin: "0 auto" }}>
      <defs>
        <marker id="af" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#555" /></marker>
      </defs>
      {steps.slice(0, -1).map((s, i) => {
        const nx = steps[i + 1].x;
        return <line key={i} x1={s.x + 105} y1={y0 + bh / 2} x2={nx - 4} y2={y0 + bh / 2} stroke="#333" strokeWidth="1.5" markerEnd="url(#af)" />;
      })}
      {steps.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y={y0} width={108} height={bh} rx={6} fill={C.card} stroke={s.color + "55"} strokeWidth="1" />
          <rect x={s.x} y={y0} width={3} height={bh} rx={1.5} fill={s.color} />
          {s.label.split("\n").map((l, j) => (
            <text key={`l${j}`} x={s.x + 12} y={y0 + 17 + j * 13} fill={s.color} fontSize="10" fontWeight="700" fontFamily={sans}>{l}</text>
          ))}
          {s.sub.split("\n").map((l, j) => (
            <text key={`s${j}`} x={s.x + 12} y={y0 + 17 + s.label.split("\n").length * 13 + 3 + j * 11} fill="#777" fontSize="8" fontFamily={mono}>{l}</text>
          ))}
        </g>
      ))}
      <path d={`M ${steps[2].x + 54} ${y0 + bh} L ${steps[2].x + 54} ${y0 + bh + 18}`} stroke={C.red} strokeWidth="1.5" strokeDasharray="4 3" />
      <text x={steps[2].x + 62} y={y0 + bh + 16} fill={C.red} fontSize="8" fontWeight="700" fontFamily={mono}>DENY → audit log</text>
      <rect x={10} y={obsY} width={738} height={40} rx={6} fill="#0d0d14" stroke="#1e1e2e" strokeWidth="1" />
      <text x={20} y={obsY + 15} fill={C.red} fontSize="9" fontWeight="700" fontFamily={mono}>OBSERVABILITY PLANE</text>
      <text x={20} y={obsY + 30} fill="#555" fontSize="8" fontFamily={mono}>Agent SRE: SLOs + error budgets + circuit breakers · OTel → Prometheus / Grafana / Datadog / Arize / Langfuse · Merkle audit chain</text>
      <rect x={10} y={2} width={738} height={20} rx={4} fill="#0d0d14" stroke="#1e1e2e" strokeWidth="1" />
      <text x={20} y={15} fill="#666" fontSize="7.5" fontFamily={mono}>DATA GOVERNANCE: Purview DLP · Compliance Manager · Data Residency · Content Safety · Defender AI Threat Protection · Sentinel SIEM</text>
      <path d={`M ${steps[5].x + 54} ${y0 + bh} Q ${steps[5].x + 54} ${obsY - 6} ${steps[5].x} ${obsY - 6} L 70 ${obsY - 6}`} fill="none" stroke="#2a2a3a" strokeWidth="1" strokeDasharray="3 3" />
      <text x={340} y={obsY - 1} fill="#444" textAnchor="middle" fontSize="7" fontFamily={mono}>response → output check → compliance evidence → audit log → user</text>
    </svg>
  );
}

function OWASPRadar({ hovered, setHovered }) {
  const risks = [
    { id: "ASI01", label: "Goal Hijack", sev: 0.95, angle: 0 },
    { id: "ASI02", label: "Tool Misuse", sev: 0.88, angle: 36 },
    { id: "ASI03", label: "Identity Abuse", sev: 0.85, angle: 72 },
    { id: "ASI04", label: "Supply Chain", sev: 0.78, angle: 108 },
    { id: "ASI05", label: "Data Leakage", sev: 0.82, angle: 144 },
    { id: "ASI06", label: "Memory Poison", sev: 0.75, angle: 180 },
    { id: "ASI07", label: "Multi-Agent", sev: 0.72, angle: 216 },
    { id: "ASI08", label: "Cascading Fail", sev: 0.80, angle: 252 },
    { id: "ASI09", label: "Trust Exploit", sev: 0.68, angle: 288 },
    { id: "ASI10", label: "Rogue Agents", sev: 0.90, angle: 324 },
  ];
  const cx = 200, cy = 200, maxR = 155;
  const toR = d => (d - 90) * Math.PI / 180;
  const pts = risks.map(r => {
    const rad = toR(r.angle), d = r.sev * maxR;
    return { ...r, px: cx + Math.cos(rad) * d, py: cy + Math.sin(rad) * d, lx: cx + Math.cos(rad) * (maxR + 28), ly: cy + Math.sin(rad) * (maxR + 28) };
  });
  return (
    <svg viewBox="0 0 400 400" style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }}>
      {[0.25, 0.5, 0.75, 1].map((r, i) => <circle key={i} cx={cx} cy={cy} r={maxR * r} fill="none" stroke="#1e1e2e" strokeWidth="1" />)}
      {risks.map((r, i) => { const rad = toR(r.angle); return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(rad) * maxR} y2={cy + Math.sin(rad) * maxR} stroke="#161622" strokeWidth="1" />; })}
      <polygon points={pts.map(p => `${p.px},${p.py}`).join(" ")} fill="rgba(239,83,80,0.1)" stroke={C.red} strokeWidth="2" />
      {pts.map((p, i) => (
        <g key={i} onMouseEnter={() => setHovered(p.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
          <circle cx={p.px} cy={p.py} r={hovered === p.id ? 7 : 4.5} fill={hovered === p.id ? C.orange : C.red} style={{ transition: "all 0.2s" }} />
          <text x={p.lx} y={p.ly} textAnchor="middle" fill={hovered === p.id ? C.orange : "#999"} fontSize="9" fontWeight={hovered === p.id ? "700" : "400"} fontFamily={sans}>{p.id}</text>
          <text x={p.lx} y={p.ly + 11} textAnchor="middle" fill={hovered === p.id ? "#ddd" : "#555"} fontSize="7.5" fontFamily={sans}>{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

function TrustTiers() {
  const t = [
    { range: "900-1000", label: "Ring 0 · Kernel", color: C.green, desc: "Full access, modify policies" },
    { range: "700-899", label: "Ring 1 · Supervisor", color: C.blue, desc: "Cross-agent, elevated tools" },
    { range: "400-699", label: "Ring 2 · User", color: C.orange, desc: "Standard tools, own scope" },
    { range: "0-399", label: "Ring 3 · Untrusted", color: C.red, desc: "Read-only, sandboxed" },
  ];
  return (
    <svg viewBox="0 0 620 100" style={{ width: "100%", maxWidth: 620, display: "block", margin: "0 auto" }}>
      {t.map((tier, i) => {
        const x = i * 155;
        return (
          <g key={i}>
            <rect x={x} y={8} width={146} height={66} rx={6} fill={C.card} stroke={tier.color + "55"} strokeWidth="1.5" />
            <text x={x + 73} y={27} textAnchor="middle" fill={tier.color} fontSize="11" fontWeight="700" fontFamily={sans}>{tier.label}</text>
            <text x={x + 73} y={42} textAnchor="middle" fill={C.dim} fontSize="9.5" fontFamily={mono}>{tier.range}</text>
            <text x={x + 73} y={60} textAnchor="middle" fill="#777" fontSize="8" fontFamily={sans}>{tier.desc}</text>
            {i < t.length - 1 && <text x={x + 152} y={44} fill="#333" fontSize="14">→</text>}
          </g>
        );
      })}
      <text x={310} y={92} textAnchor="middle" fill="#444" fontSize="8.5" fontFamily={sans}>← New agents start Ring 3. Trust decays without positive signals. Delegation always narrows scope. →</text>
    </svg>
  );
}

function CodeBlock({ title, lang, children }) {
  const [cp, setCp] = useState(false);
  const copy = () => { navigator.clipboard.writeText(children); setCp(true); setTimeout(() => setCp(false), 1500); };
  return (
    <div style={{ background: "#0a0a12", borderRadius: 8, border: `1px solid ${C.border}`, margin: "16px 0", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 14px", background: "#0d0d16", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ color: "#666", fontSize: 11, fontFamily: mono }}>{title} <span style={{ color: "#444" }}>({lang})</span></span>
        <button onClick={copy} style={{ background: "none", border: "1px solid #2a2a38", borderRadius: 4, color: cp ? C.green : "#666", fontSize: 10, padding: "2px 8px", cursor: "pointer", fontFamily: mono }}>{cp ? "✓" : "copy"}</button>
      </div>
      <pre style={{ margin: 0, padding: "14px 16px", fontSize: 12, lineHeight: 1.6, color: "#b0b0c8", fontFamily: mono, overflowX: "auto", whiteSpace: "pre" }}>{children}</pre>
    </div>
  );
}

function Callout({ type = "info", title, children }) {
  const s = { info: { b: C.blue, bg: "rgba(79,195,247,0.05)" }, warn: { b: C.orange, bg: "rgba(255,183,77,0.05)" }, critical: { b: C.red, bg: "rgba(239,83,80,0.05)" }, success: { b: C.green, bg: "rgba(102,187,106,0.05)" } }[type] || { b: C.blue, bg: "rgba(79,195,247,0.05)" };
  return (
    <div style={{ borderLeft: `3px solid ${s.b}`, background: s.bg, borderRadius: "0 8px 8px 0", padding: "12px 18px", margin: "16px 0" }}>
      {title && <div style={{ color: s.b, fontWeight: 700, fontSize: 12, marginBottom: 4, fontFamily: sans }}>{title}</div>}
      <div style={{ color: "#bbb", fontSize: 13, lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

function SH({ id, n, title, sub }) {
  return (
    <div id={id} style={{ marginTop: 56, marginBottom: 24, scrollMarginTop: 80 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ color: C.red, fontSize: 12, fontFamily: mono, opacity: 0.6 }}>{n}</span>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#f0f0f5", fontFamily: sans, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
      {sub && <p style={{ margin: "2px 0 0 28px", color: "#666", fontSize: 13 }}>{sub}</p>}
      <div style={{ width: 50, height: 2, background: `linear-gradient(90deg, ${C.red}, transparent)`, marginTop: 10, marginLeft: 28 }} />
    </div>
  );
}

function PolicyCard({ risk, title, desc, policies, color }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: C.card, border: `1px solid ${open ? color + "55" : C.border}`, borderRadius: 8, marginBottom: 10, overflow: "hidden", transition: "border-color 0.3s" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 46, height: 26, borderRadius: 5, background: color + "18", color, fontSize: 10, fontWeight: 700, fontFamily: mono, flexShrink: 0 }}>{risk}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#e0e0e8", fontSize: 13, fontWeight: 600 }}>{title}</div>
          <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>{desc}</div>
        </div>
        <span style={{ color: "#444", fontSize: 16, transition: "transform 0.3s", transform: open ? "rotate(90deg)" : "rotate(0)" }}>›</span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #161622" }}>
          {policies.map((p, i) => (
            <div key={i} style={{ marginTop: 12 }}>
              <div style={{ color, fontSize: 11, fontWeight: 700, fontFamily: mono, marginBottom: 3 }}>▸ {p.name}</div>
              <div style={{ color: "#aaa", fontSize: 12.5, lineHeight: 1.6 }}>{p.desc}</div>
              {p.code && <pre style={{ background: "#080810", borderRadius: 6, padding: "10px 12px", marginTop: 6, fontSize: 11, color: "#a0a0c0", fontFamily: mono, overflowX: "auto", border: "1px solid #161622", whiteSpace: "pre" }}>{p.code}</pre>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Grid2({ items }) {
  return (<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>{items.map((c, i) => (
    <div key={i} style={{ background: C.card, borderRadius: 6, padding: "12px 14px", border: `1px solid ${C.border}`, borderLeft: `3px solid ${c.color || C.blue}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.color || C.blue, fontFamily: mono, marginBottom: 3 }}>{c.title}</div>
      <div style={{ fontSize: 11.5, color: "#999", lineHeight: 1.5 }}>{c.desc}</div>
    </div>
  ))}</div>);
}

function TimelineItem({ date, title, desc, color }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <div style={{ width: 2, flex: 1, background: C.border, marginTop: 3 }} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: C.dim, fontFamily: mono }}>{date}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e0e0e8" }}>{title}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.55 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(null);
  useEffect(() => {
    const h = () => {
      const pos = SECTIONS.map((_, i) => { const el = document.getElementById(`s${i}`); return el ? el.getBoundingClientRect().top : 9999; });
      setActive(pos.reduce((b, t, i) => (t < 140 && t > -300 ? i : b), 0));
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  const go = i => document.getElementById(`s${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const riskPolicies = [
    { risk: "ASI01", title: "Agent Goal Hijack", color: C.red, desc: "Attacker redirects agent objectives via injected instructions in data", policies: [
      { name: "Semantic Intent Validation", desc: "Before tool execution, the policy engine's semantic intent classifier categorizes the action. If intent drifts from session scope, execution blocks.", code: `# OPA Rego — intent drift detection\ndeny[msg] {\n  intent := classify_intent(input.action)\n  not intent in input.session.allowed_intents\n  msg := sprintf("Intent drift: %v not in scope", [intent])\n}` },
      { name: "Output Destination Lock", desc: "Agents processing internal data blocked from POSTing to external URLs. Prevents exfiltration via hijacked goals.", code: `# YAML policy\n- rule: deny_external_egress\n  action: http_request\n  condition: destination NOT IN approved_endpoints\n  decision: DENY` },
      { name: "RAG Content Boundary", desc: "Retrieved documents treated strictly as data, not instructions. Flag if agent plan changes after ingesting retrieval results." },
    ]},
    { risk: "ASI02", title: "Tool Misuse", color: C.orange, desc: "Agent uses legitimate tools with destructive params or unexpected chains", policies: [
      { name: "Tool Capability Gating", desc: "Role-based tool allowlists via CapabilityModel.", code: `from agent_os import PolicyEngine, CapabilityModel\n\nengine = PolicyEngine(capabilities=CapabilityModel(\n    allowed_tools=["lookup_order", "send_email"],\n    denied_tools=["delete_account", "execute_sql"],\n))\ndecision = engine.evaluate(\n    agent_id="support-1",\n    action="tool_call", tool="delete_account"\n)  # → DENY` },
      { name: "Argument Validation", desc: "Constrain parameters even for allowed tools. write_file path must match sandbox.", code: `# Cedar — path constraint\npermit(\n  principal is Agent,\n  action == "tool_call",\n  resource == "write_file"\n) when {\n  resource.path.matches("^/tmp/agent-workspace/.*")\n};` },
      { name: "Tool Chain Limits", desc: "Cap sequential tool calls per request. Prevent runaway execution loops." },
      { name: "Destructive Action Gate", desc: "write/delete/transfer/execute → requires elevated trust or REQUIRE_APPROVAL." },
    ]},
    { risk: "ASI03", title: "Identity & Privilege Abuse", color: C.blue, desc: "OAuth permissions alone can't answer: should THIS agent do THIS NOW?", policies: [
      { name: "Per-Tool-Call Token Scoping", desc: "Each MCP tool invocation gets a narrowly-scoped, short-lived token via RFC 8693 token exchange.", code: `POST /oauth2/token\ngrant_type=urn:ietf:params:oauth:grant-type:token-exchange\nsubject_token={agent_session_token}\nresource=urn:tool:crm:lookup_customer\nscope=read:customer_basic` },
      { name: "Temporal Access Windows", desc: "Financial tools only during business hours." },
      { name: "Cross-Tenant Boundary", desc: "Agent for Tenant A must never access Tenant B's resources." },
      { name: "Delegation Ceiling", desc: "Agent can never exceed delegated user's permissions. Scope always narrows." },
    ]},
    { risk: "ASI04", title: "Agentic Supply Chain", color: C.purple, desc: "Dynamic runtime composition — agents discover components during execution", policies: [
      { name: "MCP Server Allowlisting", desc: "Ed25519-signed, manifest-verified MCP servers only. Trust-tiered capability gating.", code: `mcp_servers:\n  trusted:\n    - id: crm-mcp-server\n      manifest_hash: "sha256:a1b2c3..."\n      capabilities: [read, write]\n  untrusted:\n    - id: "*"\n      decision: DENY` },
      { name: "Model Provenance", desc: "Only approved model registries. No mid-execution endpoint swaps." },
    ]},
    { risk: "ASI05", title: "Data Leakage", color: C.green, desc: "Agent exposes confidential data through tool payloads or logs", policies: [
      { name: "Data Classification Gate", desc: "Outbound payloads scanned for PII/sensitive data. Integrates with Purview DLP." },
      { name: "Log Redaction", desc: "Audit logs auto-redact SSN, CC numbers, auth tokens before persistence." },
    ]},
    { risk: "ASI06", title: "Memory Poisoning", color: C.red, desc: "Adversarial data in memory stores influences future decisions", policies: [
      { name: "Cross-Model Verification Kernel", desc: "Memory writes pass through CMVK with majority voting before commit." },
      { name: "Memory Store RBAC", desc: "Most agents read-only; designated memory-writers only." },
    ]},
    { risk: "ASI07", title: "Multi-Agent Vulnerabilities", color: C.blue, desc: "Compromised agent propagates harm via delegation chains", policies: [
      { name: "Inter-Agent Trust Threshold", desc: "Deny delegation if trust score below threshold.", code: `- rule: inter_agent_delegation\n  condition:\n    source_agent.trust_score >= 600\n    target_agent.trust_score >= 500\n    delegation_depth <= 3\n  else: DENY` },
      { name: "Delegation Depth Cap", desc: "Max transitive delegation depth prevents unbounded trust chains." },
    ]},
    { risk: "ASI08", title: "Cascading Failures", color: C.orange, desc: "Single agent failure propagates through systems", policies: [
      { name: "SLO Circuit Breaker", desc: "Error rate > budget → auto-throttle or kill. Blast radius caps." },
      { name: "Cost Ceiling", desc: "Cap total API spend per session. Prevent runaway cost." },
    ]},
    { risk: "ASI09", title: "Human-Agent Trust Exploit", color: C.purple, desc: "Agent manipulates trust via persuasive rationale", policies: [
      { name: "HITL Escalation Threshold", desc: "Actions above risk threshold → REQUIRE_APPROVAL." },
      { name: "Confidence Calibration", desc: "Require agents to surface uncertainty. Prevent false authority." },
    ]},
    { risk: "ASI10", title: "Rogue Agents", color: C.red, desc: "Compromised agents deviate while appearing legitimate", policies: [
      { name: "Behavioral Anomaly → Quarantine", desc: "Trust decay + repeated denials → auto-quarantine to Ring 3." },
      { name: "Session & Action Limits", desc: "Max session length and total actions. No indefinite execution." },
      { name: "Self-Replication Prevention", desc: "Cannot spawn agents or register MCP servers without admin.", code: `- rule: no_self_replication\n  action: [spawn_agent, register_mcp_server]\n  decision: DENY\n  unless: caller.role == "admin"` },
      { name: "Kill Switch", desc: "Ring 0 can terminate any agent immediately." },
    ]},
  ];

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: sans }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      <nav style={{ position: "fixed", top: 0, left: 0, width: 210, height: "100vh", background: "#0a0a12", borderRight: "1px solid #131320", padding: "20px 0", zIndex: 100, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 16px 16px", borderBottom: "1px solid #131320" }}>
          <div style={{ fontSize: 10, color: C.red, fontFamily: mono, letterSpacing: "0.1em", marginBottom: 3 }}>TEAM BRIEF</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#e8e8f0", lineHeight: 1.25 }}>Azure AI Agent<br/>Governance 2026</div>
        </div>
        <div style={{ padding: "12px 8px", flex: 1 }}>
          {SECTIONS.map((s, i) => (
            <button key={i} onClick={() => go(i)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", textAlign: "left", background: active === i ? "rgba(239,83,80,0.07)" : "none", border: "none", borderRadius: 5, padding: "5px 8px", marginBottom: 1, cursor: "pointer" }}>
              <span style={{ fontSize: 9, fontFamily: mono, color: active === i ? C.red : "#3a3a4a", width: 16 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontSize: 11.5, color: active === i ? "#e0e0e8" : "#666", fontWeight: active === i ? 600 : 400 }}>{s}</span>
            </button>
          ))}
        </div>
      </nav>

      <main style={{ marginLeft: 210, padding: "36px 52px 100px", maxWidth: 840 }}>
        <div id="s0" style={{ scrollMarginTop: 20 }}>
          <FadeIn>
            <span style={{ fontSize: 10, color: C.red, fontFamily: mono, letterSpacing: "0.12em" }}>APRIL 2026</span>
            <h1 style={{ fontSize: 34, fontWeight: 800, color: "#f4f4fa", margin: "6px 0 10px", lineHeight: 1.12, letterSpacing: "-0.03em" }}>AI Agent Governance in Azure</h1>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, maxWidth: 600, margin: "0 0 28px" }}>Identity, runtime policy enforcement, execution isolation, SRE reliability, compliance automation, and the OWASP Agentic Top 10 — with implementation-level detail and code examples.</p>
          </FadeIn>
          <FadeIn delay={0.12}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 32 }}>
              {[{ n: "9", l: "Packages", s: "Independent install" }, { n: "10/10", l: "OWASP ASI", s: "All risks covered" }, { n: "<0.1ms", l: "Policy Latency", s: "p99 enforcement" }, { n: "9,500+", l: "Tests", s: "ClusterFuzzLite" }].map((c, i) => (
                <div key={i} style={{ background: C.card, borderRadius: 8, padding: "16px 14px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.red, fontFamily: mono }}>{c.n}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#d0d0d8", marginTop: 2 }}>{c.l}</div>
                  <div style={{ fontSize: 10, color: C.dim }}>{c.s}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        <SH id="s1" n="01" title="Agent Request Data Flow" sub="How a single tool call traverses the full governance stack" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 13.5, marginBottom: 20 }}>Every agent action passes through multiple independent governance gates before execution. Each gate can independently DENY. Every decision logs to an immutable audit chain. This isn't conceptual — it's the literal request path.</p>
          <DataFlowDiagram />
          <Callout type="info" title="Three independent gates — all must pass">
            <strong style={{ color: C.purple }}>Policy Gate</strong> (Agent OS) → action within scope?{" "}
            <strong style={{ color: C.green }}>Trust Gate</strong> (Agent Mesh) → identity verified, score sufficient?{" "}
            <strong style={{ color: C.orange }}>Reliability Gate</strong> (Agent SRE) → circuit breaker closed, error budget remaining? A highly trusted agent can still be denied by policy. A compliant agent can still be blocked by a tripped breaker.
          </Callout>
        </FadeIn>

        <SH id="s2" n="02" title="Microsoft Entra Agent ID" sub="First-class identity for non-human agents" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 13.5, marginBottom: 14 }}>Specialized identity type for AI agents — same governance surface as human users. Auto-registers from Copilot Studio and Foundry with zero config.</p>
          <Grid2 items={[
            { title: "Conditional Access", desc: "Apply existing CA policies — location, risk-level, device conditions", color: C.blue },
            { title: "Blueprint Model", desc: "Reusable governing templates for provisioning at scale", color: C.blue },
            { title: "Human Sponsors", desc: "Every agent has a human accountable for lifecycle and access", color: C.green },
            { title: "Three RBAC Roles", desc: "Admin (lifecycle) · Developer (create) · Registry Admin (metadata)", color: C.green },
            { title: "Attended + Unattended", desc: "OBO delegated or autonomous identity with user-like claims", color: C.purple },
            { title: "Auto-Registration", desc: "Copilot Studio + Foundry agents auto-register on creation", color: C.purple },
          ]} />
        </FadeIn>

        <SH id="s3" n="03" title="Foundry Agent Service" sub="Enterprise control plane — GA March 2026" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 13.5, marginBottom: 14 }}>Publishing promotes an agent to a managed Azure resource with its own Entra identity, stable endpoint, audit trail, and governance boundaries. Control Plane ARM API for unified management.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {["Dedicated Entra identity", "Private VNet networking", "BYO storage / Search / Cosmos", "Tracing + eval linking", "Control Plane ARM API", "M365 / Teams distribution"].map((f, i) => (
              <div key={i} style={{ background: "#0d0d14", borderRadius: 5, padding: "8px 12px", border: `1px solid ${C.border}`, fontSize: 11, color: "#aaa", textAlign: "center" }}>{f}</div>
            ))}
          </div>
        </FadeIn>

        <SH id="s4" n="04" title="Toolkit: Policy Engine (Agent OS)" sub="Stateless kernel intercepting every agent action" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 13.5, marginBottom: 14 }}>Agent OS is the core — evaluates every tool call against configurable rules. Stateless design deploys as AKS sidecar, behind a load balancer, or serverless. Three policy languages, three eval modes each (embedded, remote, fallback).</p>
          <CodeBlock title="Policy Engine — intercepting agent actions" lang="python">{`from agent_os import StatelessKernel, ExecutionContext, Policy

kernel = StatelessKernel()
ctx = ExecutionContext(
    agent_id="analyst-1",
    policies=[
        Policy.read_only(),                    # No write operations
        Policy.rate_limit(100, "1m"),          # 100 calls/minute max
        Policy.require_approval(
            actions=["delete_*", "write_production_*"],
            min_approvals=2,
            approval_timeout_minutes=30,
        ),
    ],
)

result = await kernel.execute(
    action="delete_user_record",
    params={"user_id": 12345},
    context=ctx,
)
# result.decision → DENY (matches delete_* → require_approval)
# Audit log entry created automatically with full context`}</CodeBlock>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 13, marginBottom: 10 }}>Two evaluation layers: <strong style={{ color: C.purple }}>configurable pattern matching</strong> (YAML rules for SQL injection, privesc, prompt injection) and a <strong style={{ color: C.orange }}>semantic intent classifier</strong> detecting dangerous goals regardless of phrasing. Actions classified as DESTRUCTIVE_DATA, DATA_EXFILTRATION, or PRIVILEGE_ESCALATION get blocked, routed for approval, or trigger trust downgrade.</p>
          <Grid2 items={[
            { title: "PolicyConflictResolver", desc: "4 strategies: deny-overrides, allow-overrides, priority-first-match, most-specific-wins", color: C.purple },
            { title: "Expression Evaluator", desc: "Equality, inequality, numeric, in/not-in, boolean, and/or, nested paths", color: C.purple },
            { title: "MCP Gateway", desc: "Built-in MCP security gateway for governing Model Context Protocol tool calls", color: C.orange },
            { title: "Rate Limiting", desc: "Per-agent, per-tool rate limits enforced at the kernel level", color: C.orange },
          ]} />
          <Callout type="warn" title="All rules are externalized config">
            Policy rules ship as sample configs in <code style={{ fontFamily: mono, color: C.orange }}>examples/policies/</code>. Review and customize before production. Supports YAML (simple), OPA Rego (complex conditional), and Cedar (fine-grained RBAC/ABAC). No built-in rule set is exhaustive.
          </Callout>
        </FadeIn>

        <SH id="s5" n="05" title="Toolkit: Trust & Identity (Agent Mesh)" sub="Zero-trust cryptographic identity — 'SSL for AI Agents'" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 13.5, marginBottom: 14 }}>Every agent gets a DID-based Ed25519 identity. Trust is a 0–1000 score that <strong style={{ color: C.orange }}>decays over time without positive signals</strong>. Delegation chains enforce scope narrowing — a parent with read+write can only delegate read to children.</p>
          <CodeBlock title="Agent Identity & Trust Verification" lang="python">{`from agentmesh import AgentIdentity, TrustBridge

identity = AgentIdentity.create(
    name="data-analyst",
    sponsor="alice@company.com",          # Human accountability
    capabilities=["read:data", "write:reports"],
)
# identity.did → "did:mesh:data-analyst:a7f3b2..."

bridge = TrustBridge()
verification = await bridge.verify_peer(
    peer_id="did:mesh:other-agent",
    required_trust_score=700,  # Ring 1+ required
)
# verification.trusted → True/False
# verification.score → 823
# verification.decay_rate → -2.3/hour`}</CodeBlock>
          <Grid2 items={[
            { title: "SPIFFE/SVID Support", desc: "Integrates with existing service mesh identity infrastructure", color: C.green },
            { title: "IATP Protocol", desc: "Inter-Agent Trust Protocol for secure agent-to-agent comms", color: C.green },
            { title: "Delegation Chains", desc: "Scope always narrows — parent read+write → child read only", color: C.blue },
            { title: "JWK/JWKS + DID Export", desc: "W3C DID Document export, standard key formats", color: C.blue },
            { title: "Cascade Revocation", desc: "Revoking parent auto-revokes all downstream delegations", color: C.red },
            { title: "IdentityRegistry", desc: "Lifecycle: active → suspended → revoked. Central agent inventory.", color: C.red },
          ]} />
        </FadeIn>

        <SH id="s6" n="06" title="Toolkit: Execution Rings (Agent Hypervisor)" sub="CPU-inspired privilege isolation for agents" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 13.5, marginBottom: 16 }}>New agents start Ring 3 and earn their way up. Each ring enforces resource limits: max execution time, memory caps, CPU throttling, request rate. Ring boundaries and thresholds are fully configurable.</p>
          <TrustTiers />
          <Callout type="success" title="Saga Orchestration for multi-step operations">
            When an agent executes a sequence (draft email → send → update CRM) and the final step fails, compensating actions fire in reverse. Distributed transaction pattern ensuring consistency across multi-agent workflows.
          </Callout>
        </FadeIn>

        <SH id="s7" n="07" title="Toolkit: SRE & Reliability" sub="Production reliability patterns applied to agent behavior" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 13.5, marginBottom: 14 }}>Agents treated like production services. When safety SLI drops below 99% (1%+ policy violations), capabilities auto-restrict until recovery. Same error-budget model SRE teams use.</p>
          <Grid2 items={[
            { title: "SLOs & Error Budgets", desc: "Configurable safety SLIs. Burn through budget → auto-restrict capabilities", color: C.green },
            { title: "Circuit Breakers", desc: "Consecutive failures trip breaker. Cooldown before retry. Prevents cascading.", color: C.orange },
            { title: "9 Chaos Templates", desc: "Network delays, LLM failures, tool timeouts, trust manipulation, memory corruption, races", color: C.red },
            { title: "Progressive Delivery", desc: "Canary policy rollouts. 5% of agents first, validate, expand.", color: C.blue },
          ]} />
          <Callout type="info" title="Plugs into your existing observability stack">
            OTel → <strong>Prometheus, Grafana, Datadog, Arize, Langfuse, LangSmith, MLflow</strong>. Message brokers: <strong>Kafka, Redis, NATS, Azure Service Bus, AWS SQS, RabbitMQ</strong>. Key metrics: policy decisions/sec, trust distributions, ring transitions, SLO burn rates, circuit breaker state, governance latency.
          </Callout>
        </FadeIn>

        <SH id="s8" n="08" title="Toolkit: Compliance Automation" sub="agent-compliance — automated governance verification with signed attestation" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 13.5, marginBottom: 14 }}>Automated grading against regulatory frameworks, evidence collection across all 10 OWASP categories, and signed attestation for auditors or CI pipelines. Bootstrap integrity self-verifies the governance layer on startup.</p>
          <CodeBlock title="Compliance CLI" lang="bash">{`# OWASP ASI 2026 compliance check → signed attestation
agent-compliance verify
# ✓ ASI01 Goal Hijack ......... PASS  (semantic intent classifier active)
# ✓ ASI02 Tool Misuse ......... PASS  (capability model enforced)
# ✓ ASI03 Identity Abuse ...... PASS  (DID identity + trust scoring)
# ✓ ASI04 Supply Chain ........ PASS  (Ed25519 plugin signing)
# ✓ ASI05 Data Leakage ........ PASS  (output classification active)
# ✓ ASI06 Memory Poisoning .... PASS  (CMVK majority voting)
# ✓ ASI07 Multi-Agent ......... PASS  (IATP + delegation limits)
# ✓ ASI08 Cascading Failures .. PASS  (SLO + circuit breakers)
# ✓ ASI09 Trust Exploitation .. PASS  (HITL escalation configured)
# ✓ ASI10 Rogue Agents ........ PASS  (kill switch + ring isolation)
# 
# Overall: 10/10 ASI controls verified
# Attestation signed → ./governance-attestation.json

# Machine-readable for CI gates
agent-compliance verify --json

# Shields.io badge for README
agent-compliance verify --badge

# Integrity manifest — hashes 15 modules + 4 critical functions
agent-compliance integrity --generate integrity.json`}</CodeBlock>
          <Grid2 items={[
            { title: "EU AI Act Mapping", desc: "Art. 9 (risk mgmt), Art. 12 (audit trails), Art. 14 (human oversight) — evidence auto-collected", color: C.orange },
            { title: "HIPAA / SOC2", desc: "Framework-specific grading with exportable evidence packages", color: C.orange },
            { title: "NIST AI RMF", desc: "Mapping to NIST AI Agent Security RFI (2026-00206)", color: C.purple },
            { title: "Bootstrap Integrity", desc: "Self-verifies governance layer at startup — hash 15 modules + 4 enforcement functions", color: C.purple },
          ]} />
          <Callout type="warn" title="CI/CD integration pattern">
            Run <code style={{ fontFamily: mono, color: C.orange }}>agent-compliance verify --json</code> in your pipeline. Gate deployments on all 10 ASI controls passing. The integrity manifest ensures the governance code itself hasn't been tampered with.
          </Callout>
        </FadeIn>

        <SH id="s9" n="09" title="Authorization Fabric" sub="Runtime decision plane — PEP/PDP as Entra-protected Functions" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 13.5, marginBottom: 14 }}>Centralized policy evaluation sitting between every agent and its tools. Policies stored in Cosmos DB, evaluated at runtime. Every tool call gets a deterministic decision.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[{ l: "ALLOW", c: C.green, d: "Proceed" }, { l: "DENY", c: C.red, d: "Block + log" }, { l: "REQUIRE_APPROVAL", c: C.orange, d: "Human-in-loop" }, { l: "MASK", c: C.purple, d: "Proceed, redact" }].map((d, i) => (
              <div key={i} style={{ background: C.card, borderRadius: 6, padding: "10px", textAlign: "center", border: `1px solid ${d.c}33` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: d.c, fontFamily: mono }}>{d.l}</div>
                <div style={{ fontSize: 10, color: "#777", marginTop: 3 }}>{d.d}</div>
              </div>
            ))}
          </div>
          <Callout type="info" title="MASK — key for sensitive domains">
            Agent proceeds with the tool call, but sensitive fields are redacted in the response before the agent sees them. Use powerful data tools without exposing unnecessary information — critical for finance, healthcare, HR.
          </Callout>
        </FadeIn>

        <SH id="s10" n="10" title="OWASP Agentic Top 10 (ASI 2026)" sub="The risk taxonomy the toolkit is built against" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 13.5, marginBottom: 16 }}>Published December 2025 by 100+ experts. First formal taxonomy of autonomous agent risks. Hover to explore each category.</p>
          <OWASPRadar hovered={hovered} setHovered={setHovered} />
          <Callout type="critical" title="Core principle: Least Agency">
            Only grant agents the minimum autonomy, tool access, and credential scope required — and no more. Agentic failures aren't "bad output" — they're <strong>bad outcomes</strong> with real system consequences.
          </Callout>
        </FadeIn>

        <SH id="s11" n="11" title="Policy Examples by Risk Category" sub="Expand each card for policies with implementation code" />
        <FadeIn>
          {riskPolicies.map((r, i) => <PolicyCard key={i} {...r} />)}
        </FadeIn>
        <FadeIn delay={0.1}>
          <CodeBlock title="Complete: Support Agent Policy Set" lang="yaml">{`agent_policies:
  - name: "customer-support-v2"
    agent_role: "support-agent"
    trust_minimum: 500          # Ring 2+ required

    tool_access:
      allow:
        - tool: lookup_order
          args: { order_id: "required" }
        - tool: send_email
          args: { to: "must_match_customer_email" }
        - tool: escalate_ticket
        - tool: knowledge_search
      deny:
        - tool: "delete_*"
        - tool: "admin_*"
        - tool: execute_sql

    guardrails:
      max_tool_calls_per_session: 25
      max_session_duration_minutes: 30
      require_approval_above:
        dollar_amount: 500
        data_sensitivity: "confidential"
      block_external_egress: true

    identity:
      auth_flow: "delegated"
      token_scope: "per_tool_call"
      max_token_ttl_seconds: 300

    sre:
      error_budget: 0.01
      circuit_breaker:
        consecutive_failures: 3
        cooldown_seconds: 60
      cost_ceiling_per_session: 2.50`}</CodeBlock>
        </FadeIn>

        <SH id="s12" n="12" title="Regulatory Timeline" sub="Key deadlines driving governance urgency" />
        <FadeIn>
          <TimelineItem date="Dec 2025" title="OWASP Agentic Top 10 Published" desc="First taxonomy of autonomous agent risks — ASI01–ASI10. 100+ expert reviewers." color={C.purple} />
          <TimelineItem date="Feb 2026" title="Entra Agent ID Preview" desc="Specialized identity for AI agents. Auto-registration from Copilot Studio and Foundry." color={C.blue} />
          <TimelineItem date="Mar 2026" title="Foundry Agent Service GA" desc="OpenAI Responses API base. Enterprise RBAC, tracing, private networking, Control Plane ARM API." color={C.green} />
          <TimelineItem date="Apr 2, 2026" title="Agent Governance Toolkit v3.0" desc="MIT licensed. 9 packages, 5 languages, 9,500+ tests. 10/10 OWASP ASI coverage." color={C.red} />
          <TimelineItem date="Jun 2026" title="Colorado AI Act Enforceable" desc="First US state AI regulation with enforcement teeth." color={C.orange} />
          <TimelineItem date="Aug 2026" title="EU AI Act — High-Risk Obligations" desc="Articles 9, 12, 14 enforceable. Risk mgmt, audit trails, human oversight." color={C.red} />
          <TimelineItem date="Q3 2026+" title="NIST AI Agent Security Framework" desc="Expected from RFI 2026-00206. Toolkit already maps." color={C.dim} />
        </FadeIn>

        <div style={{ marginTop: 64, paddingTop: 24, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 10, color: "#333", fontFamily: mono }}>April 2026 · Sources: MS Learn, MS Security Blog, MS OSS Blog, GitHub, OWASP GenAI</div>
          <div style={{ fontSize: 9, color: "#333" }}>INTERNAL</div>
        </div>
      </main>
    </div>
  );
}