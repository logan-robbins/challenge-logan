"use client";
import React, { useState, useEffect, useRef } from "react";

const SECTIONS = [
  "Why This Exists",
  "Request Flow",
  "Agent OS",
  "Agent Mesh",
  "Agent Runtime",
  "Agent SRE",
  "Agent Compliance",
  "Agent Marketplace",
  "Agent Lightning",
  "OWASP Top 10",
  "Deploy on Azure",
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

function SH({ id, n, title, sub }) {
  return (
    <div id={id} style={{ marginTop: 56, marginBottom: 24, scrollMarginTop: 80 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ color: C.red, fontSize: 13, fontFamily: mono, opacity: 0.6 }}>{n}</span>
        <h2 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: "#f0f0f5", fontFamily: sans, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
      {sub && <p style={{ margin: "2px 0 0 28px", color: "#666", fontSize: 15.5 }}>{sub}</p>}
      <div style={{ width: 50, height: 2, background: `linear-gradient(90deg, ${C.red}, transparent)`, marginTop: 10, marginLeft: 28 }} />
    </div>
  );
}

function Callout({ type = "info", title, children }) {
  const s = { info: { b: C.blue, bg: "rgba(79,195,247,0.05)" }, warn: { b: C.orange, bg: "rgba(255,183,77,0.05)" }, critical: { b: C.red, bg: "rgba(239,83,80,0.05)" }, success: { b: C.green, bg: "rgba(102,187,106,0.05)" } }[type] || { b: C.blue, bg: "rgba(79,195,247,0.05)" };
  return (
    <div style={{ borderLeft: `3px solid ${s.b}`, background: s.bg, borderRadius: "0 8px 8px 0", padding: "12px 18px", margin: "16px 0" }}>
      {title && <div style={{ color: s.b, fontWeight: 700, fontSize: 16, marginBottom: 4, fontFamily: sans }}>{title}</div>}
      <div style={{ color: "#bbb", fontSize: 15, lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

/* ── Vertical Flow Diagram (used in Section 2) ── */
function RequestFlowDiagram() {
  const steps = [
    { label: "User / Application", desc: "Request initiated — tool call, query, or action", color: C.blue, check: false },
    { label: "Agent OS", desc: "Policy check — is this action allowed? Pattern match + semantic intent classifier evaluate against rules", color: C.purple, check: true },
    { label: "Agent Mesh", desc: "Identity check — verify agent DID, confirm trust score meets threshold for this operation", color: C.green, check: true },
    { label: "Agent Marketplace", desc: "Supply chain check — if action uses a plugin or MCP server, verify Ed25519 signature and manifest hash", color: C.green, check: true },
    { label: "Agent Runtime", desc: "Privilege check — does the agent's ring allow this? Are resource limits (time, memory, rate) within budget?", color: C.orange, check: true },
    { label: "Agent SRE", desc: "Reliability check — is the circuit breaker closed? Is there error budget remaining?", color: C.blue, check: true },
    { label: "Tool / MCP Execution", desc: "Action executes in sandboxed environment with scoped, short-lived token", color: C.green, check: false },
    { label: "Agent Compliance", desc: "Output check — scan response for sensitive data, collect compliance evidence, write audit log", color: C.red, check: true },
  ];
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      {steps.map((s, i) => (
        <div key={i}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0, paddingTop: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              {i < steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 40, background: "#2a2a3a", marginTop: 4 }} />}
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${s.color}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", flex: 1, marginBottom: 4, display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: sans }}>{s.label}</div>
                <div style={{ fontSize: 14, color: "#999", marginTop: 3, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
              {s.check && <span style={{ fontSize: 9, fontFamily: mono, color: C.red, background: "rgba(239,83,80,0.1)", padding: "3px 8px", borderRadius: 3, flexShrink: 0, marginTop: 2 }}>CAN DENY</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Agent OS Diagram ── */
function AgentOSDiagram() {
  const rows = [
    { label: "Action Arrives", desc: "Any tool call, API request, or agent decision", color: C.blue, icon: "→" },
    { label: "Pattern Matcher", desc: "Fast rule evaluation against YAML / OPA Rego / Cedar policies", color: C.purple, icon: "⚡" },
    { label: "Semantic Intent Classifier", desc: "ML classifier detects dangerous goals regardless of phrasing — catches what pattern matching misses", color: C.orange, icon: "🧠" },
    { label: "Conflict Resolver", desc: "When multiple rules match: deny-overrides, allow-overrides, priority-first, or most-specific-wins", color: C.purple, icon: "⚖" },
  ];
  const decisions = [
    { label: "ALLOW", color: C.green, desc: "Proceed normally" },
    { label: "DENY", color: C.red, desc: "Block + audit log" },
    { label: "REQUIRE_APPROVAL", color: C.orange, desc: "Human-in-the-loop" },
    { label: "MASK", color: C.purple, desc: "Proceed, redact sensitive fields" },
  ];
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0, paddingTop: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.color }} />
            {i < rows.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 32, background: "#2a2a3a", marginTop: 3 }} />}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${r.color}`, borderRadius: "0 8px 8px 0", padding: "10px 14px", flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: r.color }}>{r.icon} {r.label}</div>
            <div style={{ fontSize: 13.5, color: "#999", marginTop: 2, lineHeight: 1.5 }}>{r.desc}</div>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 8px 36px" }}>
        <div style={{ width: 2, height: 14, background: "#2a2a3a" }} />
        <span style={{ fontSize: 10, fontFamily: mono, color: C.dim }}>↓ Decision</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginLeft: 36 }}>
        {decisions.map((d, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 6, padding: "10px", textAlign: "center", border: `1px solid ${d.color}33` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: d.color, fontFamily: mono }}>{d.label}</div>
            <div style={{ fontSize: 9.5, color: "#777", marginTop: 3 }}>{d.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, marginLeft: 36 }}>
        <div style={{ fontSize: 11, color: "#666", fontFamily: mono, marginBottom: 6 }}>Policy language options:</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ l: "YAML", d: "Simple rules" }, { l: "OPA Rego", d: "Complex conditional" }, { l: "Cedar", d: "Fine-grained RBAC/ABAC" }].map((p, i) => (
            <div key={i} style={{ background: "#0d0d14", border: `1px solid ${C.border}`, borderRadius: 5, padding: "6px 12px", fontSize: 11, color: "#aaa", textAlign: "center", flex: 1 }}>
              <div style={{ fontWeight: 700, color: C.purple, fontFamily: mono, fontSize: 10 }}>{p.l}</div>
              <div style={{ fontSize: 9.5, color: "#666", marginTop: 2 }}>{p.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Agent Mesh Diagram ── */
function AgentMeshDiagram() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      {/* Identity Creation */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontFamily: mono, color: C.green, letterSpacing: "0.08em", marginBottom: 8 }}>STEP 1 — IDENTITY CREATION</div>
        <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>
          When an agent is created, it gets a <strong style={{ color: C.green }}>Decentralized Identifier (DID)</strong> — think of it like an SSL certificate for agents. This is a cryptographic Ed25519 keypair that proves the agent is who it claims to be. No central authority needed.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {[{ l: "DID Created", d: "Unique identifier generated", c: C.green }, { l: "Ed25519 Keypair", d: "Public/private key for signing", c: C.green }, { l: "Human Sponsor", d: "A person accountable for this agent", c: C.blue }].map((x, i) => (
            <div key={i} style={{ flex: 1, background: "#0d0d14", borderRadius: 5, padding: "8px 10px", border: `1px solid ${x.c}22`, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: x.c, fontFamily: mono }}>{x.l}</div>
              <div style={{ fontSize: 9, color: "#777", marginTop: 2 }}>{x.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Score */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontFamily: mono, color: C.orange, letterSpacing: "0.08em", marginBottom: 8 }}>STEP 2 — TRUST SCORING</div>
        <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>
          Every agent has a <strong style={{ color: C.orange }}>trust score from 0 to 1000</strong> that works like a battery — it drains over time without positive signals. Good behavior recharges it. Bad behavior (policy violations, anomalies) drains it faster. The score determines what the agent can do.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 14, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {[{ range: "0–399", label: "Untrusted", color: C.red, bg: "rgba(239,83,80,0.12)" },
            { range: "400–699", label: "Standard", color: C.orange, bg: "rgba(255,183,77,0.12)" },
            { range: "700–899", label: "Elevated", color: C.blue, bg: "rgba(79,195,247,0.12)" },
            { range: "900–1000", label: "Full Trust", color: C.green, bg: "rgba(102,187,106,0.12)" },
          ].map((t, i) => (
            <div key={i} style={{ flex: 1, background: t.bg, padding: "10px 8px", textAlign: "center", borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.color }}>{t.label}</div>
              <div style={{ fontSize: 9, color: "#777", fontFamily: mono, marginTop: 2 }}>{t.range}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: "#666", marginTop: 8, textAlign: "center", fontStyle: "italic" }}>Score decays over time without positive signals. New agents start low and earn trust.</div>
      </div>

      {/* Agent-to-Agent Communication */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontFamily: mono, color: C.blue, letterSpacing: "0.08em", marginBottom: 8 }}>STEP 3 — AGENT-TO-AGENT COMMUNICATION (IATP)</div>
        <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6, marginBottom: 12 }}>
          When Agent A wants to talk to Agent B, it doesn&apos;t just &ldquo;call&rdquo; it. The <strong style={{ color: C.blue }}>Inter-Agent Trust Protocol (IATP)</strong> handles a verification handshake:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { n: "1", text: "Agent A presents its DID (digital passport) to Agent B", color: C.blue },
            { n: "2", text: "Agent B verifies the DID signature cryptographically — is this really Agent A?", color: C.blue },
            { n: "3", text: "Agent B checks Agent A's trust score against its threshold — is A trusted enough?", color: C.orange },
            { n: "4", text: "If both pass → communication proceeds. If either fails → request denied.", color: C.green },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.color, fontFamily: mono }}>{s.n}</span>
              </div>
              <div style={{ fontSize: 12, color: "#bbb", lineHeight: 1.5, paddingTop: 2 }}>{s.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Delegation */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px" }}>
        <div style={{ fontSize: 13, fontFamily: mono, color: C.purple, letterSpacing: "0.08em", marginBottom: 8 }}>STEP 4 — DELEGATION CHAINS</div>
        <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6, marginBottom: 12 }}>
          When an agent delegates work to another agent, <strong style={{ color: C.purple }}>scope always narrows — never widens</strong>. A parent with read+write can only give a child read. Revoking a parent auto-revokes all children.
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          {[{ l: "Agent A", s: "read + write", c: C.green }, { l: "Agent B", s: "read only", c: C.blue }, { l: "Agent C", s: "read (subset)", c: C.orange }].map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "#0d0d14", border: `1px solid ${a.c}33`, borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: a.c }}>{a.l}</div>
                <div style={{ fontSize: 9, color: "#777", fontFamily: mono, marginTop: 2 }}>{a.s}</div>
              </div>
              {i < 2 && <span style={{ color: "#444", fontSize: 16 }}>→</span>}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: "#666", marginTop: 10, textAlign: "center", fontStyle: "italic" }}>Scope narrows at each delegation. Revoking Agent A auto-revokes B and C.</div>
      </div>

      <Callout type="info" title="How is this implemented?">
        Agent Mesh is a library (pip package / npm module) you integrate into your agent framework. It handles the crypto, trust protocol, and delegation logic under the hood. Your agent code calls mesh.verify_peer() before communicating — the library does the DID verification, trust check, and scope enforcement automatically.
      </Callout>
    </div>
  );
}

/* ── Agent Runtime Diagram ── */
function AgentRuntimeDiagram() {
  const rings = [
    { n: "Ring 0", label: "Kernel", range: "900–1000", desc: "Full access. Can modify policies, terminate other agents.", color: C.green, w: 280 },
    { n: "Ring 1", label: "Supervisor", range: "700–899", desc: "Cross-agent communication, elevated tools.", color: C.blue, w: 230 },
    { n: "Ring 2", label: "User", range: "400–699", desc: "Standard tools within own scope.", color: C.orange, w: 180 },
    { n: "Ring 3", label: "Untrusted", range: "0–399", desc: "Read-only, fully sandboxed. Where new agents start.", color: C.red, w: 130 },
  ];
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      {/* Concentric rings */}
      <div style={{ position: "relative", width: 300, height: 300, margin: "0 auto 24px" }}>
        {rings.map((r, i) => {
          const size = r.w;
          return (
            <div key={i} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: size, height: size, borderRadius: "50%", border: `2px solid ${r.color}44`, background: `${r.color}08`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {i === rings.length - 1 && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.red, fontFamily: mono }}>NEW AGENTS</div>
                  <div style={{ fontSize: 9, color: "#666" }}>start here</div>
                </div>
              )}
            </div>
          );
        })}
        {rings.map((r, i) => (
          <div key={`label-${i}`} style={{ position: "absolute", left: "50%", top: 150 - r.w / 2 - 8, transform: "translateX(-50%)", fontSize: 9, fontFamily: mono, color: r.color, fontWeight: 700, whiteSpace: "nowrap" }}>
            {r.n}: {r.label}
          </div>
        ))}
      </div>
      {/* Ring details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {rings.map((r, i) => (
          <div key={i} style={{ background: C.card, borderLeft: `3px solid ${r.color}`, borderRadius: "0 6px 6px 0", padding: "10px 12px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: r.color, fontFamily: mono }}>{r.n} · {r.label} <span style={{ color: "#555", fontWeight: 400 }}>({r.range})</span></div>
            <div style={{ fontSize: 13, color: "#999", marginTop: 2, lineHeight: 1.5 }}>{r.desc}</div>
          </div>
        ))}
      </div>

      {/* Saga */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", marginTop: 16 }}>
        <div style={{ fontSize: 13, fontFamily: mono, color: C.orange, letterSpacing: "0.08em", marginBottom: 8 }}>SAGA ORCHESTRATION — MULTI-STEP ROLLBACK</div>
        <div style={{ fontSize: 15, color: "#ccc", lineHeight: 1.6, marginBottom: 12 }}>
          When an agent runs a sequence of steps (draft email → send → update CRM) and a later step fails, <strong style={{ color: C.orange }}>compensating actions fire in reverse</strong> to undo earlier steps. Like a database transaction, but for agent actions.
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {[{ l: "Draft", s: "✓", c: C.green }, { l: "Send", s: "✓", c: C.green }, { l: "Update CRM", s: "✗ FAIL", c: C.red }].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ background: "#0d0d14", border: `1px solid ${s.c}33`, borderRadius: 5, padding: "6px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#ccc" }}>{s.l}</div>
                <div style={{ fontSize: 9, color: s.c, fontFamily: mono, marginTop: 1 }}>{s.s}</div>
              </div>
              {i < 2 && <span style={{ color: "#444", fontSize: 14 }}>→</span>}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: C.red, textAlign: "center", marginTop: 8, fontFamily: mono }}>← Compensate: unsend email ← delete draft</div>
      </div>

      <Callout type="critical" title="Kill Switch">
        Ring 0 agents can terminate any other agent immediately. This is the emergency brake — if an agent goes rogue, it can be killed mid-execution without waiting for policy evaluation.
      </Callout>
    </div>
  );
}

/* ── Agent SRE Diagram ── */
function AgentSREDiagram() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      {/* SLO Feedback Loop */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontFamily: mono, color: C.green, letterSpacing: "0.08em", marginBottom: 10 }}>SLO FEEDBACK LOOP</div>
        <div style={{ fontSize: 15, color: "#ccc", lineHeight: 1.6, marginBottom: 14 }}>
          Each agent has a <strong style={{ color: C.green }}>Service Level Objective</strong> — for example, &ldquo;99% of actions must comply with policy.&rdquo; The 1% is the <strong style={{ color: C.orange }}>error budget</strong>. When violations burn through the budget, the agent&apos;s capabilities auto-restrict until it recovers.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { icon: "📊", label: "SLO Target", desc: "99% policy compliance (configurable per agent)", color: C.green },
            { icon: "🔥", label: "Error Budget Burns", desc: "Each policy violation consumes budget — tracked in real-time", color: C.orange },
            { icon: "🚫", label: "Budget Exhausted", desc: "Agent capabilities auto-restrict — fewer tools, lower ring", color: C.red },
            { icon: "🔄", label: "Recovery", desc: "Compliant behavior over time restores budget and capabilities", color: C.green },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: s.color }}>{s.label}</div>
                <div style={{ fontSize: 13.5, color: "#999", lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Circuit Breaker */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontFamily: mono, color: C.orange, letterSpacing: "0.08em", marginBottom: 10 }}>CIRCUIT BREAKER STATES</div>
        <div style={{ fontSize: 15, color: "#ccc", lineHeight: 1.6, marginBottom: 14 }}>
          Same pattern as microservices: consecutive failures trip the breaker, stopping the agent from hammering a failing resource. After a cooldown, a test request probes recovery.
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {[{ l: "CLOSED", d: "Normal operation", c: C.green }, { l: "OPEN", d: "Failures tripped breaker — all calls blocked", c: C.red }, { l: "HALF-OPEN", d: "Cooldown done — test request sent", c: C.orange }].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "#0d0d14", border: `1px solid ${s.c}33`, borderRadius: 6, padding: "10px 14px", textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.c, fontFamily: mono }}>{s.l}</div>
                <div style={{ fontSize: 9, color: "#777", marginTop: 3, maxWidth: 100 }}>{s.d}</div>
              </div>
              {i < 2 && <span style={{ color: "#444", fontSize: 14 }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Other SRE tools */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { title: "Chaos Engineering", desc: "9 templates: network delays, LLM failures, tool timeouts, trust manipulation, memory corruption", color: C.red },
          { title: "Progressive Delivery", desc: "Canary policy rollouts — 5% of agents first, validate, then expand to fleet", color: C.blue },
          { title: "Cost Ceiling", desc: "Cap total API spend per session or agent. Prevents runaway token consumption.", color: C.orange },
          { title: "Blast Radius Cap", desc: "Limit how many systems one agent failure can affect. Contain the damage zone.", color: C.purple },
        ].map((c, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 6, padding: "10px 14px", border: `1px solid ${C.border}`, borderLeft: `3px solid ${c.color}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.color, fontFamily: mono }}>{c.title}</div>
            <div style={{ fontSize: 13, color: "#999", marginTop: 2, lineHeight: 1.5 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Agent Compliance Diagram ── */
function AgentComplianceDiagram() {
  const steps = [
    { label: "Scan", desc: "Evaluate all 10 OWASP ASI risk categories automatically", color: C.blue },
    { label: "Grade", desc: "Score against regulatory frameworks — EU AI Act, HIPAA, SOC2, NIST AI RMF", color: C.purple },
    { label: "Collect Evidence", desc: "Gather proof artifacts for each control across all packages", color: C.orange },
    { label: "Sign Attestation", desc: "Cryptographically signed report for auditors or CI pipeline gates", color: C.green },
    { label: "Pass / Fail Gate", desc: "Binary decision — deploy or block. Machine-readable JSON output.", color: C.green },
  ];
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0, paddingTop: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
            {i < steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 28, background: "#2a2a3a", marginTop: 3 }} />}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${s.color}`, borderRadius: "0 8px 8px 0", padding: "10px 14px", flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: s.color }}>{s.label}</div>
            <div style={{ fontSize: 13.5, color: "#999", marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        </div>
      ))}
      <Callout type="warn" title="Bootstrap Integrity">
        On startup, the compliance module hashes 15 governance modules and 4 critical enforcement functions to verify the governance layer itself hasn&apos;t been tampered with. The governance code governs itself.
      </Callout>
    </div>
  );
}

/* ── Agent Marketplace Diagram ── */
function AgentMarketplaceDiagram() {
  const steps = [
    { label: "Developer Signs Plugin", desc: "Ed25519 cryptographic signature applied to plugin package + manifest", color: C.green },
    { label: "Manifest Published", desc: "Declares capabilities, required trust tier, dependencies, and hash", color: C.blue },
    { label: "Agent Discovers Plugin", desc: "Agent finds plugin at runtime — dynamic composition, not static config", color: C.purple },
    { label: "Signature Verified", desc: "Marketplace verifies Ed25519 signature against manifest hash — tamper-proof", color: C.orange },
    { label: "Trust Tier Unlocks Capabilities", desc: "Low-trust agents get read-only access. High-trust agents unlock full capabilities.", color: C.green },
  ];
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.65, marginBottom: 16 }}>
        Think of it like an <strong style={{ color: C.green }}>app store with mandatory code signing</strong>. Agents can&apos;t just use any plugin — every plugin must be signed, verified, and the agent&apos;s trust level determines what it can access.
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0, paddingTop: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
            {i < steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 28, background: "#2a2a3a", marginTop: 3 }} />}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${s.color}`, borderRadius: "0 8px 8px 0", padding: "10px 14px", flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: s.color }}>{s.label}</div>
            <div style={{ fontSize: 13.5, color: "#999", marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        </div>
      ))}
      <Callout type="info" title="Why this matters">
        Agents discover components at runtime — this is a dynamic supply chain, not a static dependency list. Without signing and verification, a compromised MCP server or swapped model endpoint could inject malicious behavior mid-execution.
      </Callout>
    </div>
  );
}

/* ── Agent Lightning Diagram ── */
function AgentLightningDiagram() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.65, marginBottom: 16 }}>
        During reinforcement learning training, agents explore actions to maximize reward. Without governance, they can learn that <strong style={{ color: C.red }}>policy-violating strategies are effective</strong>. Lightning puts a policy fence around the training loop.
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px" }}>
        <div style={{ fontSize: 13, fontFamily: mono, color: C.purple, letterSpacing: "0.08em", marginBottom: 12 }}>RL TRAINING WITH GOVERNANCE FENCE</div>
        {[
          { n: "1", label: "Agent Explores", desc: "RL agent proposes an action during training", color: C.blue },
          { n: "2", label: "Policy Engine Intercepts", desc: "Agent OS evaluates the proposed action against policies — same engine as production", color: C.purple },
          { n: "3", label: "Violation Blocked", desc: "If the action violates policy, it's blocked before executing — the agent never learns it works", color: C.red },
          { n: "4", label: "Reward Shaped", desc: "Negative reward signal for policy-violating attempts. Agent learns compliant strategies are optimal.", color: C.green },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 3 ? 10 : 0 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: s.color, fontFamily: mono }}>{s.n}</span>
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: s.color }}>{s.label}</div>
              <div style={{ fontSize: 13.5, color: "#999", lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <Callout type="success" title="Zero policy violations during training">
        The key insight: if an agent never successfully executes a policy-violating action during training, it can&apos;t learn that violations are rewarding. Governance becomes part of the agent&apos;s learned world model.
      </Callout>
    </div>
  );
}

/* ── OWASP Radar ── */
function OWASPRadar({ hovered, setHovered }) {
  const risks = [
    { id: "ASI01", label: "Goal Hijack", pkg: "Agent OS", sev: 0.95, angle: 0 },
    { id: "ASI02", label: "Tool Misuse", pkg: "Agent OS", sev: 0.88, angle: 36 },
    { id: "ASI03", label: "Identity Abuse", pkg: "Agent Mesh", sev: 0.85, angle: 72 },
    { id: "ASI04", label: "Supply Chain", pkg: "Marketplace", sev: 0.78, angle: 108 },
    { id: "ASI05", label: "Data Leakage", pkg: "Agent OS", sev: 0.82, angle: 144 },
    { id: "ASI06", label: "Memory Poison", pkg: "Agent OS", sev: 0.75, angle: 180 },
    { id: "ASI07", label: "Multi-Agent", pkg: "Agent Mesh", sev: 0.72, angle: 216 },
    { id: "ASI08", label: "Cascading Fail", pkg: "Agent SRE", sev: 0.80, angle: 252 },
    { id: "ASI09", label: "Trust Exploit", pkg: "Agent Runtime", sev: 0.68, angle: 288 },
    { id: "ASI10", label: "Rogue Agents", pkg: "Agent Runtime", sev: 0.90, angle: 324 },
  ];
  const cx = 200, cy = 200, maxR = 150;
  const toR = d => (d - 90) * Math.PI / 180;
  const pts = risks.map(r => {
    const rad = toR(r.angle), d = r.sev * maxR;
    return { ...r, px: cx + Math.cos(rad) * d, py: cy + Math.sin(rad) * d, lx: cx + Math.cos(rad) * (maxR + 30), ly: cy + Math.sin(rad) * (maxR + 30) };
  });
  return (
    <div>
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
      {/* Risk → Package mapping table */}
      <div style={{ maxWidth: 700, margin: "16px auto 0" }}>
        {risks.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.red, fontFamily: mono, width: 42 }}>{r.id}</span>
            <span style={{ fontSize: 14, color: "#ccc", flex: 1 }}>{r.label}</span>
            <span style={{ fontSize: 10, color: C.blue, fontFamily: mono, background: C.blue + "15", padding: "2px 8px", borderRadius: 3 }}>{r.pkg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Deploy on Azure ── */
function DeployDiagram() {
  const options = [
    { title: "AKS Sidecar", desc: "Deploy the policy engine as a sidecar container alongside your agents. Transparent governance — agents don't even know it's there. Best for teams already running Kubernetes.", color: C.blue, icon: "☸" },
    { title: "Foundry Agent Service", desc: "Built-in middleware integration for agents built on Microsoft Foundry. Zero infrastructure setup — governance plugs into the managed runtime.", color: C.green, icon: "🏗" },
    { title: "Container Apps", desc: "Run governance-enabled agents in a serverless container environment. No cluster management — Azure handles scaling. Best for smaller teams.", color: C.purple, icon: "📦" },
  ];
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((o, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${o.color}`, borderRadius: "0 8px 8px 0", padding: "14px 18px" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: o.color }}>{o.icon} {o.title}</div>
            <div style={{ fontSize: 14.5, color: "#999", marginTop: 4, lineHeight: 1.6 }}>{o.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MAIN APP ── */
export default function App() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(null);
  useEffect(() => {
    let raf = 0;
    const h = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        let best = 0;
        for (let i = SECTIONS.length - 1; i >= 0; i--) {
          const el = document.getElementById(`s${i}`);
          if (el && el.getBoundingClientRect().top < 160) { best = i; break; }
        }
        setActive(prev => prev !== best ? best : prev);
      });
    };
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => { window.removeEventListener("scroll", h); cancelAnimationFrame(raf); };
  }, []);
  const go = i => document.getElementById(`s${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: sans }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      <nav style={{ position: "fixed", top: 0, left: 0, width: 230, height: "100vh", background: "#0a0a12", borderRight: "1px solid #131320", padding: "24px 0", zIndex: 100, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 18px 18px", borderBottom: "1px solid #131320" }}>
          <div style={{ fontSize: 11, color: C.red, fontFamily: mono, letterSpacing: "0.1em", marginBottom: 4 }}>TEAM RUNBOOK</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#e8e8f0", lineHeight: 1.25 }}>Agent Governance<br/>Toolkit</div>
          <div style={{ fontSize: 10, color: "#444", marginTop: 5, fontFamily: mono }}>Microsoft OSS · MIT License</div>
        </div>
        <div style={{ padding: "14px 10px", flex: 1 }}>
          {SECTIONS.map((s, i) => (
            <button key={i} onClick={() => go(i)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", background: active === i ? "rgba(239,83,80,0.07)" : "none", border: "none", borderRadius: 5, padding: "6px 10px", marginBottom: 2, cursor: "pointer" }}>
              <span style={{ fontSize: 10, fontFamily: mono, color: active === i ? C.red : "#3a3a4a", width: 18 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontSize: 13.5, color: active === i ? "#e0e0e8" : "#666", fontWeight: active === i ? 600 : 400 }}>{s}</span>
            </button>
          ))}
        </div>
      </nav>

      <main style={{ marginLeft: 230, padding: "36px 64px 100px 52px", maxWidth: 1100 }}>
        {/* ── Section 0: Why This Exists ── */}
        <div id="s0" style={{ scrollMarginTop: 20 }}>
          <FadeIn>
            <span style={{ fontSize: 11, color: C.red, fontFamily: mono, letterSpacing: "0.12em" }}>APRIL 2026 · MICROSOFT OSS · MIT LICENSE</span>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: "#f4f4fa", margin: "6px 0 16px", lineHeight: 1.12, letterSpacing: "-0.03em" }}>Microsoft Agent Governance Toolkit</h1>
            <div style={{ display: "flex", gap: 16, marginBottom: 16, fontFamily: mono, fontSize: 12 }}>
              <a href="https://github.com/microsoft/agent-governance-toolkit" target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none" }}>github.com/microsoft/agent-governance-toolkit</a>
              <a href="https://opensource.microsoft.com/blog/2026/04/02/introducing-the-agent-governance-toolkit-open-source-runtime-security-for-ai-agents/" target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none" }}>Announcement Blog Post</a>
            </div>
            <p style={{ fontSize: 16, color: "#999", lineHeight: 1.7, margin: "0 0 16px" }}>
              Open-source runtime security governance for autonomous AI agents. Seven independently installable packages that intercept every agent action and enforce policy at sub-millisecond latency. Covers all 10 OWASP Agentic AI risks.
            </p>
            <Callout type="warn" title="This is not a native Azure service">
              The Agent Governance Toolkit is a <strong>separate open-source project</strong> (MIT license) you install alongside your Azure stack. It integrates with Azure AI Foundry, AKS, and Container Apps, but it is not built into any Azure service. You pip/npm install it and deploy it as middleware or a sidecar.
            </Callout>
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "6px 16px", marginBottom: 32 }}>
              {[
                { pkg: "Agent OS", desc: "Policy engine — intercepts and evaluates every action", color: C.purple },
                { pkg: "Agent Mesh", desc: "Cryptographic identity and dynamic trust scoring", color: C.green },
                { pkg: "Agent Runtime", desc: "Privilege rings, resource limits, kill switch", color: C.orange },
                { pkg: "Agent SRE", desc: "SLOs, circuit breakers, chaos engineering", color: C.blue },
                { pkg: "Agent Compliance", desc: "Regulatory grading and signed attestation", color: C.red },
                { pkg: "Agent Marketplace", desc: "Plugin signing and supply chain verification", color: C.green },
                { pkg: "Agent Lightning", desc: "Governance during RL training", color: C.purple },
              ].map((p, i) => (
                <React.Fragment key={i}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: p.color, fontFamily: mono, padding: "5px 0" }}>{p.pkg}</span>
                  <span style={{ fontSize: 14, color: "#888", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>{p.desc}</span>
                </React.Fragment>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* ── Section 1: Request Flow ── */}
        <SH id="s1" n="01" title="Request Flow" sub="How a single agent action traverses the full governance stack" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 16, marginBottom: 20 }}>Every agent action passes through multiple checkpoints before execution. Each checkpoint can independently block the request. Every decision logs to an immutable audit chain.</p>
          <RequestFlowDiagram />
        </FadeIn>

        {/* ── Section 2: Agent OS ── */}
        <SH id="s2" n="02" title="Agent OS" sub="The policy kernel — intercepts every action at sub-millisecond latency" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 16, marginBottom: 20 }}>Agent OS is the core of the toolkit. It sits in the execution path of every agent action and evaluates it against configurable rules. Stateless by design — deploy as an AKS sidecar, behind a load balancer, or serverless. Two evaluation layers: fast pattern matching and a semantic intent classifier that catches dangerous goals regardless of how they&apos;re phrased.</p>
          <AgentOSDiagram />
        </FadeIn>

        {/* ── Section 3: Agent Mesh ── */}
        <SH id="s3" n="03" title="Agent Mesh" sub="Cryptographic identity and trust scoring for agents" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 16, marginBottom: 20 }}>Agent Mesh answers: &ldquo;Is this agent who it claims to be, and should it be trusted right now?&rdquo; Every agent gets a cryptographic identity. Trust isn&apos;t binary — it&apos;s a score that changes based on behavior.</p>
          <AgentMeshDiagram />
        </FadeIn>

        {/* ── Section 4: Agent Runtime ── */}
        <SH id="s4" n="04" title="Agent Runtime" sub="CPU-inspired privilege isolation for agents" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 16, marginBottom: 20 }}>Borrowed directly from how CPUs isolate processes. Four privilege rings with increasing access. New agents start at the outermost ring (most restricted) and earn their way inward through compliant behavior. Each ring enforces resource limits: max execution time, memory caps, CPU throttling, request rate.</p>
          <AgentRuntimeDiagram />
        </FadeIn>

        {/* ── Section 5: Agent SRE ── */}
        <SH id="s5" n="05" title="Agent SRE" sub="Production reliability patterns applied to agent behavior" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 16, marginBottom: 20 }}>Agents treated like production services. The same error-budget model that SRE teams use for infrastructure is applied to agent behavior. When an agent burns through its error budget, it doesn&apos;t crash — its capabilities progressively restrict until it demonstrates recovery.</p>
          <AgentSREDiagram />
        </FadeIn>

        {/* ── Section 6: Agent Compliance ── */}
        <SH id="s6" n="06" title="Agent Compliance" sub="Automated governance verification with signed attestation" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 16, marginBottom: 20 }}>Automated grading against regulatory frameworks. Evidence collection across all 10 OWASP categories. Signed attestation output for auditors or CI/CD pipeline gates. Designed to run in your deployment pipeline — deploy only if all controls pass.</p>
          <AgentComplianceDiagram />
        </FadeIn>

        {/* ── Section 7: Agent Marketplace ── */}
        <SH id="s7" n="07" title="Agent Marketplace" sub="Supply chain security for agent plugins and tools" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 16, marginBottom: 20 }}>Agents discover and compose tools at runtime — this is a dynamic supply chain. Without verification, a compromised MCP server or swapped model endpoint could inject malicious behavior. Marketplace provides mandatory code signing and trust-tiered capability gating.</p>
          <AgentMarketplaceDiagram />
        </FadeIn>

        {/* ── Section 8: Agent Lightning ── */}
        <SH id="s8" n="08" title="Agent Lightning" sub="Governance for reinforcement learning training" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 16, marginBottom: 20 }}>Most governance focuses on production. Lightning extends it to training time — ensuring agents can&apos;t learn that policy violations are rewarding strategies during reinforcement learning.</p>
          <AgentLightningDiagram />
        </FadeIn>

        {/* ── Section 9: OWASP Top 10 ── */}
        <SH id="s9" n="09" title="OWASP Agentic Top 10" sub="The risk taxonomy the toolkit is built against — hover to explore" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 16, marginBottom: 16 }}>Published December 2025 by 100+ experts. The first formal taxonomy of autonomous agent risks. Every risk maps to a specific package in the toolkit.</p>
          <OWASPRadar hovered={hovered} setHovered={setHovered} />
          <Callout type="critical" title="Core principle: Least Agency">
            Only grant agents the minimum autonomy, tool access, and credential scope required — and no more. Agentic failures aren&apos;t &ldquo;bad output&rdquo; — they&apos;re <strong>bad outcomes</strong> with real system consequences.
          </Callout>
        </FadeIn>

        {/* ── Section 10: Deploy on Azure ── */}
        <SH id="s10" n="10" title="Deploy on Azure" sub="Three paths to production" />
        <FadeIn>
          <p style={{ color: "#999", lineHeight: 1.7, fontSize: 16, marginBottom: 20 }}>The toolkit is framework-agnostic but designed for Azure. Three deployment options.</p>
          <DeployDiagram />
        </FadeIn>

        <div style={{ marginTop: 64, paddingTop: 24, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 10, color: "#333", fontFamily: mono }}>April 2026 · Source: <a href="https://opensource.microsoft.com/blog/2026/04/02/introducing-the-agent-governance-toolkit-open-source-runtime-security-for-ai-agents/" style={{ color: "#555" }} target="_blank" rel="noopener noreferrer">Microsoft OSS Blog</a> · <a href="https://github.com/microsoft/agent-governance-toolkit" style={{ color: "#555" }} target="_blank" rel="noopener noreferrer">GitHub</a></div>
        </div>
      </main>
    </div>
  );
}
