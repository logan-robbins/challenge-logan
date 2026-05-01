"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

async function uploadFile(file, password) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("password", password);
  const resp = await fetch("/api/upload", { method: "POST", body: fd });
  if (!resp.ok) {
    const msg = await resp.text();
    throw new Error(`Upload failed (${resp.status}): ${msg}`);
  }
  return resp.json();
}

const sans = "-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', ui-monospace, 'SF Mono', Menlo, monospace";

const C = {
  bg: "#0a0a0f",
  elevated: "#15151f",
  surface: "#1c1c28",
  border: "#2a2a3a",
  borderStrong: "#3a3a4e",
  text: "#f1f1f3",
  textMuted: "#a1a1aa",
  textDim: "#71717a",
  accent: "#fb923c",
  accentBg: "rgba(251, 146, 60, 0.12)",
  accentBorder: "rgba(251, 146, 60, 0.35)",
  userBg: "rgba(251, 146, 60, 0.08)",
  userBorder: "rgba(251, 146, 60, 0.25)",
  codeBg: "#0d1117",
  inlineCodeBg: "rgba(255, 255, 255, 0.08)",
  error: "#f87171",
};

function PasswordGate({ onAuth, gateError }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    onAuth(value.trim());
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: sans, color: C.text,
    }}>
      <div style={{ width: 380 }}>
        <div style={{ color: C.accent, fontSize: 11, letterSpacing: "0.14em", marginBottom: 12, fontWeight: 600 }}>
          HELP · CLAUDE ASSISTANT
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, letterSpacing: "-0.01em" }}>
          Enter password
        </div>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="password"
            style={{
              width: "100%", background: C.elevated, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontFamily: sans, fontSize: 14,
              padding: "11px 14px", outline: "none", boxSizing: "border-box",
            }}
          />
          {gateError && (
            <div style={{ color: C.error, fontSize: 13, marginTop: 10 }}>Wrong password.</div>
          )}
          <button type="submit" style={{
            marginTop: 14, width: "100%", background: C.accent, border: "none",
            borderRadius: 8, color: "#0a0a0f", fontFamily: sans, fontSize: 14,
            fontWeight: 700, padding: "11px", cursor: "pointer",
          }}>
            Continue →
          </button>
        </form>
      </div>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  return (
    <button
      onClick={copy}
      style={{
        position: "absolute", top: 8, right: 8,
        background: copied ? C.accent : C.surface,
        border: `1px solid ${copied ? C.accent : C.borderStrong}`,
        borderRadius: 6, color: copied ? "#0a0a0f" : C.textMuted,
        fontFamily: sans, fontSize: 11, fontWeight: 600,
        padding: "4px 10px", cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function extractText(node) {
  if (node == null || node === false) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && node.props) {
    return extractText(node.props.children);
  }
  return "";
}

const markdownComponents = {
  h1: ({ children }) => <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 24, marginBottom: 12, color: C.text, letterSpacing: "-0.01em" }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 22, marginBottom: 10, color: C.text, letterSpacing: "-0.01em" }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 18, marginBottom: 8, color: C.text }}>{children}</h3>,
  h4: ({ children }) => <h4 style={{ fontSize: 14, fontWeight: 700, marginTop: 14, marginBottom: 6, color: C.text }}>{children}</h4>,
  p: ({ children }) => <p style={{ margin: "10px 0", lineHeight: 1.7, color: C.text }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: "10px 0", paddingLeft: 24, lineHeight: 1.7 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: "10px 0", paddingLeft: 24, lineHeight: 1.7 }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: "4px 0", color: C.text }}>{children}</li>,
  strong: ({ children }) => <strong style={{ fontWeight: 700, color: C.text }}>{children}</strong>,
  em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: "underline", textDecorationColor: C.accentBorder }}>{children}</a>,
  blockquote: ({ children }) => <blockquote style={{ borderLeft: `3px solid ${C.accentBorder}`, paddingLeft: 14, margin: "12px 0", color: C.textMuted, fontStyle: "italic" }}>{children}</blockquote>,
  hr: () => <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "20px 0" }} />,
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "12px 0" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>{children}</table>
    </div>
  ),
  th: ({ children }) => <th style={{ border: `1px solid ${C.border}`, padding: "8px 12px", background: C.elevated, textAlign: "left", fontWeight: 700, color: C.text }}>{children}</th>,
  td: ({ children }) => <td style={{ border: `1px solid ${C.border}`, padding: "8px 12px", color: C.text }}>{children}</td>,
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    if (!match) {
      return (
        <code style={{
          fontFamily: mono, fontSize: "0.9em",
          background: C.inlineCodeBg, padding: "2px 6px",
          borderRadius: 4, color: C.text,
        }} {...props}>{children}</code>
      );
    }
    const codeText = extractText(children).replace(/\n$/, "");
    return (
      <div style={{ position: "relative", margin: "12px 0" }}>
        <div style={{
          position: "absolute", top: 8, left: 12,
          color: C.textDim, fontFamily: mono, fontSize: 11,
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>{match[1]}</div>
        <CopyButton text={codeText} />
        <pre style={{
          background: C.codeBg, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: "32px 14px 14px",
          overflow: "auto", margin: 0,
          fontFamily: mono, fontSize: 13, lineHeight: 1.6,
        }}>
          <code className={className} {...props}>{children}</code>
        </pre>
      </div>
    );
  },
};

function FileChip({ att }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: C.surface, border: `1px solid ${C.borderStrong}`,
      borderRadius: 8, padding: "8px 12px", marginBottom: 8,
      fontSize: 12, color: C.textMuted,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <div>
        <span style={{ color: C.text, fontWeight: 600 }}>{att.name}</span>
        {att.sizeFormatted && (
          <span style={{ marginLeft: 6 }}>{att.sizeFormatted} → {att.mountPath}</span>
        )}
      </div>
    </div>
  );
}

function MessageContent({ msg }) {
  const isUser = msg.role === "user";

  if (isUser) {
    const parts = Array.isArray(msg.content) ? msg.content : [{ type: "text", text: msg.content }];
    return (
      <>
        {parts.map((p, i) => {
          if (p.type === "image") {
            return (
              <img
                key={i}
                src={`data:${p.source.media_type};base64,${p.source.data}`}
                alt="upload"
                style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 6, marginBottom: 8, display: "block" }}
              />
            );
          }
          if (p.type === "file_resource") {
            return <FileChip key={i} att={p} />;
          }
          return (
            <div key={i} style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: C.text }}>
              {p.text}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
      {typeof msg.content === "string" ? msg.content : ""}
    </ReactMarkdown>
  );
}

function fmtBytes(n) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function ArtifactCard({ artifact, password }) {
  const url = `/api/download?file_id=${artifact.id}&name=${encodeURIComponent(artifact.filename)}&password=${encodeURIComponent(password)}`;
  return (
    <a
      href={url}
      download={artifact.filename}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        background: C.surface, border: `1px solid ${C.accentBorder}`,
        borderRadius: 10, padding: "10px 14px", marginTop: 8,
        textDecoration: "none", color: C.text,
        fontFamily: sans, fontSize: 13,
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = C.accentBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = C.surface; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <div>
        <div style={{ fontWeight: 600, color: C.text }}>{artifact.filename}</div>
        {artifact.size > 0 && (
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{fmtBytes(artifact.size)}</div>
        )}
      </div>
      <span style={{ marginLeft: "auto", fontSize: 11, color: C.accent, fontWeight: 600 }}>Download</span>
    </a>
  );
}

function fmtElapsed(s) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

function Message({ msg, streaming, status, elapsed, password }) {
  const isUser = msg.role === "user";
  const empty = !msg.content || (typeof msg.content === "string" && !msg.content.trim());
  const label = status || "Working…";
  const showTimer = streaming && !isUser && elapsed > 0;

  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 18, padding: "0 16px",
    }}>
      <div style={{
        maxWidth: isUser ? "78%" : "100%",
        width: isUser ? "auto" : "100%",
        background: isUser ? C.userBg : "transparent",
        border: isUser ? `1px solid ${C.userBorder}` : "none",
        borderRadius: isUser ? 12 : 0,
        padding: isUser ? "12px 16px" : "0",
        fontFamily: sans, fontSize: 14, color: C.text,
      }}>
        <MessageContent msg={msg} />
        {!isUser && msg.artifacts && msg.artifacts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em" }}>
              ARTIFACTS
            </div>
            {msg.artifacts.map((a) => (
              <ArtifactCard key={a.id} artifact={a} password={password} />
            ))}
          </div>
        )}
        {!isUser && streaming && (empty || status) && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginTop: empty ? 0 : 8,
            color: C.textMuted, fontSize: 12,
            background: C.elevated, border: `1px solid ${C.border}`,
            borderRadius: 999, padding: "5px 12px",
            maxWidth: "100%",
          }}>
            <span style={{
              flexShrink: 0,
              width: 6, height: 6, borderRadius: "50%", background: C.accent,
              animation: "pulse 1.2s ease-in-out infinite",
            }} />
            <span style={{
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: label.startsWith("$") || label.startsWith("search:") ? mono : sans,
              fontSize: label.startsWith("$") || label.startsWith("search:") ? 11 : 12,
            }}>{label}</span>
            {showTimer && (
              <span style={{ flexShrink: 0, color: C.textDim, fontFamily: mono, fontSize: 11 }}>
                {fmtElapsed(elapsed)}
              </span>
            )}
          </div>
        )}
        {!isUser && streaming && !empty && !status && (
          <span style={{
            display: "inline-block", width: 7, height: 14,
            background: C.text, marginLeft: 2, verticalAlign: "text-bottom",
            animation: "blink 1s step-end infinite",
          }} />
        )}
      </div>
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = String(result).split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ClaudeChat() {
  const [password, setPassword] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("help_chat_password") || "";
    }
    return "";
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [pendingFileResources, setPendingFileResources] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const streamStartRef = useRef(null);
  const [gateError, setGateError] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!streaming) {
      setElapsed(0);
      streamStartRef.current = null;
      return;
    }
    streamStartRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - streamStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [streaming]);

  function handleAuth(pw) {
    sessionStorage.setItem("help_chat_password", pw);
    setPassword(pw);
    setGateError(false);
  }

  function handleNewChat() {
    setMessages([]);
    setInput("");
    setAttachments([]);
    setPendingFileResources([]);
    setSessionId(null);
    setStreaming(false);
    setStatus("");
    setElapsed(0);
    textareaRef.current?.focus();
  }

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const newAtts = [];
    const newFileResources = [];

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        if (file.size > 5 * 1024 * 1024) continue;
        const base64 = await fileToBase64(file);
        newAtts.push({
          kind: "image",
          name: file.name,
          media_type: file.type,
          data: base64,
        });
      } else {
        setUploading(true);
        try {
          const data = await uploadFile(file, password);
          newAtts.push({
            kind: "file_resource",
            name: data.name,
            sizeFormatted: data.sizeFormatted,
            mountPath: data.mountPath,
          });
          newFileResources.push({ file_id: data.file_id, mount_path: data.mountPath });
        } catch (err) {
          console.error("file upload failed", err);
          alert(`Upload failed: ${err.message}`);
        } finally {
          setUploading(false);
        }
      }
    }

    setAttachments((prev) => [...prev, ...newAtts]);
    setPendingFileResources((prev) => [...prev, ...newFileResources]);
  }

  function removeAttachment(i) {
    const att = attachments[i];
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
    if (att.kind === "file_resource") {
      setPendingFileResources((prev) =>
        prev.filter((f) => f.mount_path !== att.mountPath)
      );
    }
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || streaming) return;

    const userContent = [];
    for (const att of attachments) {
      if (att.kind === "image") {
        userContent.push({
          type: "image",
          source: { type: "base64", media_type: att.media_type, data: att.data },
        });
      } else if (att.kind === "file_resource") {
        userContent.push({
          type: "file_resource",
          name: att.name,
          sizeFormatted: att.sizeFormatted,
          mountPath: att.mountPath,
        });
      }
    }
    if (text) userContent.push({ type: "text", text });

    const userMsg = userContent.length === 1 && userContent[0].type === "text"
      ? { role: "user", content: text }
      : { role: "user", content: userContent };

    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setAttachments([]);
    const outgoingFileResources = [...pendingFileResources];
    setPendingFileResources([]);
    setStreaming(true);
    setStatus("");

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const apiMessages = newMessages.map((m) => {
      if (typeof m.content === "string") return m;
      const cleaned = m.content
        .filter((c) => c.type !== "file_resource")
        .map(({ _meta, ...rest }) => rest);
      return { ...m, content: cleaned };
    });

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          password,
          sessionId,
          pendingFileResources: outgoingFileResources,
        }),
      });

      if (resp.status === 401) {
        sessionStorage.removeItem("help_chat_password");
        setPassword("");
        setGateError(true);
        setMessages(messages);
        setStreaming(false);
        return;
      }

      if (!resp.ok) {
        setMessages([...newMessages, { role: "assistant", content: "Error: request failed." }]);
        setStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedText = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.t === "session") {
              setSessionId(evt.v);
            } else if (evt.t === "status") {
              setStatus(evt.v);
            } else if (evt.t === "text") {
              receivedText = true;
              setStatus("");
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, content: last.content + evt.v }];
              });
            } else if (evt.t === "artifacts") {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, artifacts: evt.v }];
              });
            } else if (evt.t === "done") {
              setStatus("");
              break;
            } else if (evt.t === "error") {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, content: `Error: ${evt.v}` }];
              });
            }
          } catch {}
        }
      }

      if (!receivedText) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), {
            ...last,
            content: "_No response text was returned. The agent may still be working — try asking for an update._",
          }];
        });
      }
    } catch {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, content: "Error: connection failed." }];
      });
    }

    setStreaming(false);
    setStatus("");
  }, [input, attachments, pendingFileResources, streaming, messages, password, sessionId]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!password) {
    return <PasswordGate onAuth={handleAuth} gateError={gateError} />;
  }

  const busy = streaming || uploading;

  return (
    <>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.borderStrong}; }
        .hljs { background: transparent !important; padding: 0 !important; }
      `}</style>
      <div style={{
        minHeight: "100vh", background: C.bg, display: "flex",
        flexDirection: "column", fontFamily: sans, color: C.text,
      }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px", borderBottom: `1px solid ${C.border}`,
          position: "sticky", top: 0, background: C.bg, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ color: C.accent, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em" }}>
              HELP
            </div>
            {sessionId && (
              <div style={{ color: C.textDim, fontSize: 11, fontFamily: mono }}>
                {sessionId.slice(0, 16)}…
              </div>
            )}
          </div>
          <button
            onClick={handleNewChat}
            style={{
              background: "transparent", border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.textMuted, fontFamily: sans, fontSize: 12,
              padding: "6px 14px", cursor: "pointer", fontWeight: 600,
            }}
          >
            New Chat
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 24, paddingBottom: 8 }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: "center", color: C.textMuted, fontSize: 14,
              marginTop: 80, padding: "0 24px",
            }}>
              <div style={{ color: C.text, fontSize: 24, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.01em" }}>
                Ask anything
              </div>
              <div>Managed agent with bash, file ops, web search · Microsoft docs · upload files.</div>
            </div>
          )}
          {messages.map((msg, i) => {
            const isActiveAssistant = streaming && i === messages.length - 1 && msg.role === "assistant";
            return (
              <Message
                key={i}
                msg={msg}
                streaming={isActiveAssistant}
                status={isActiveAssistant ? status : ""}
                elapsed={isActiveAssistant ? elapsed : 0}
                password={password}
              />
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          borderTop: `1px solid ${C.border}`, padding: "12px 16px",
          background: C.bg,
        }}>
          {attachments.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              {attachments.map((att, i) => (
                <div key={i} style={{ position: "relative" }}>
                  {att.kind === "image" ? (
                    <img
                      src={`data:${att.media_type};base64,${att.data}`}
                      alt={att.name}
                      style={{ height: 60, borderRadius: 6, border: `1px solid ${C.border}`, display: "block" }}
                    />
                  ) : (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: 8, padding: "10px 14px", height: 60, boxSizing: "border-box",
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ color: C.text, fontWeight: 600, fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</span>
                        <span style={{ color: C.textMuted, fontSize: 11 }}>{att.sizeFormatted} → {att.mountPath}</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(i)}
                    style={{
                      position: "absolute", top: -6, right: -6,
                      width: 20, height: 20, borderRadius: "50%",
                      background: C.surface, border: `1px solid ${C.borderStrong}`,
                      color: C.text, fontSize: 12, cursor: "pointer", lineHeight: 1,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{
            display: "flex", gap: 10, alignItems: "flex-end",
            background: C.elevated, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "10px 12px",
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.zip,.csv,.json,.txt,.md,.py,.ts,.js,.tsx,.jsx,.pdf,.docx,.xlsx"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              title={uploading ? "Uploading…" : "Attach file"}
              style={{
                background: "transparent", border: "none", color: uploading ? C.accent : C.textMuted,
                cursor: busy ? "default" : "pointer",
                padding: 4, display: "flex", alignItems: "center",
                opacity: streaming ? 0.4 : 1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
              }}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              placeholder="Ask anything…"
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none",
                color: C.text, fontFamily: sans,
                fontSize: 14, lineHeight: 1.5, resize: "none",
                minHeight: 22, maxHeight: 200, overflowY: "auto",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={busy || (!input.trim() && attachments.length === 0)}
              style={{
                background: busy || (!input.trim() && attachments.length === 0) ? C.border : C.accent,
                border: "none", borderRadius: 8,
                color: busy || (!input.trim() && attachments.length === 0) ? C.textDim : "#0a0a0f",
                fontFamily: sans, fontSize: 13, fontWeight: 700,
                padding: "7px 14px",
                cursor: busy || (!input.trim() && attachments.length === 0) ? "default" : "pointer",
                whiteSpace: "nowrap", alignSelf: "flex-end",
                transition: "background 0.15s",
              }}
            >
              {streaming ? "…" : uploading ? "Uploading" : "Send"}
            </button>
          </div>
          <div style={{ color: C.textDim, fontSize: 11, marginTop: 8, textAlign: "center" }}>
            Enter ↵ to send · Shift+Enter for newline · Attach images, zips, docs, code
          </div>
        </div>
      </div>
    </>
  );
}
