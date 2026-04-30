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

async function uploadZip(file, password) {
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

function ZipChip({ header }) {
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
      <span style={{ color: C.text, fontWeight: 600 }}>{header}</span>
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
          if (p.type === "document") {
            const meta = p._meta;
            const header = meta
              ? `${meta.name} — ${meta.fileCount} files, ${formatBytes(meta.totalSize)}`
              : (p.title || "Document");
            return <ZipChip key={i} header={header} />;
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

function Message({ msg, streaming, status }) {
  const isUser = msg.role === "user";
  const empty = !msg.content || (typeof msg.content === "string" && !msg.content.trim());

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
        {!isUser && streaming && status && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginTop: empty ? 0 : 8,
            color: C.textMuted, fontSize: 12,
            background: C.elevated, border: `1px solid ${C.border}`,
            borderRadius: 999, padding: "5px 12px",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: C.accent,
              animation: "pulse 1.2s ease-in-out infinite",
            }} />
            {status}
          </div>
        )}
        {!isUser && streaming && !status && empty && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            color: C.textMuted, fontSize: 12,
            background: C.elevated, border: `1px solid ${C.border}`,
            borderRadius: 999, padding: "5px 12px",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: C.accent,
              animation: "pulse 1.2s ease-in-out infinite",
            }} />
            Working…
          </div>
        )}
        {!isUser && streaming && !empty && (
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
  const [streaming, setStreaming] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);
  const [status, setStatus] = useState("");
  const [gateError, setGateError] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleAuth(pw) {
    sessionStorage.setItem("help_chat_password", pw);
    setPassword(pw);
    setGateError(false);
  }

  function handleNewChat() {
    setMessages([]);
    setInput("");
    setAttachments([]);
    setStreaming(false);
    setStatus("");
    textareaRef.current?.focus();
  }

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const newAtts = [];
    for (const file of files) {
      const ext = file.name.split(".").pop().toLowerCase();
      if (file.type.startsWith("image/")) {
        if (file.size > 5 * 1024 * 1024) continue;
        const base64 = await fileToBase64(file);
        newAtts.push({
          kind: "image",
          name: file.name,
          media_type: file.type,
          data: base64,
        });
      } else if (ext === "zip" || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
        setUploadingZip(true);
        try {
          const data = await uploadZip(file, password);
          newAtts.push({
            kind: "zip",
            name: data.name,
            file_id: data.file_id,
            fileCount: data.fileCount,
            totalSize: data.totalSize,
          });
        } catch (err) {
          console.error("zip upload failed", err);
          alert(`Zip upload failed: ${err.message}`);
        } finally {
          setUploadingZip(false);
        }
      }
    }
    setAttachments((prev) => [...prev, ...newAtts]);
  }

  function removeAttachment(i) {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
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
      } else if (att.kind === "zip") {
        userContent.push({
          type: "document",
          source: { type: "file", file_id: att.file_id },
          title: att.name,
          _meta: { kind: "zip", name: att.name, fileCount: att.fileCount, totalSize: att.totalSize },
        });
      }
    }
    if (text) userContent.push({ type: "text", text });

    const userMsg = attachments.length === 0
      ? { role: "user", content: text }
      : { role: "user", content: userContent };

    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setAttachments([]);
    setStreaming(true);
    setStatus("");

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const apiMessages = newMessages.map((m) => {
      if (typeof m.content === "string") return m;
      const cleaned = m.content.map((c) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
        const { _meta, ...rest } = c;
        return rest;
      });
      return { ...m, content: cleaned };
    });

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, password }),
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
            if (evt.t === "status") {
              setStatus(evt.v);
            } else if (evt.t === "text") {
              setStatus("");
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, content: last.content + evt.v }];
              });
            } else if (evt.t === "done") {
              setStatus("");
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, content: "Error: connection failed." }];
      });
    }

    setStreaming(false);
    setStatus("");
  }, [input, attachments, streaming, messages, password]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!password) {
    return <PasswordGate onAuth={handleAuth} gateError={gateError} />;
  }

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
          <div style={{ color: C.accent, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em" }}>
            HELP
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
              <div>Live web search via BrightData · Microsoft &amp; Azure docs · drop in images.</div>
            </div>
          )}
          {messages.map((msg, i) => (
            <Message
              key={i}
              msg={msg}
              streaming={streaming && i === messages.length - 1 && msg.role === "assistant"}
              status={streaming && i === messages.length - 1 && msg.role === "assistant" ? status : ""}
            />
          ))}
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
                        <span style={{ color: C.textMuted, fontSize: 11 }}>{att.fileCount} files · {formatBytes(att.totalSize)}</span>
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
              accept="image/*,.zip,application/zip"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={streaming || uploadingZip}
              title={uploadingZip ? "Uploading…" : "Attach image or zip"}
              style={{
                background: "transparent", border: "none", color: uploadingZip ? C.accent : C.textMuted,
                cursor: streaming || uploadingZip ? "default" : "pointer",
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
              disabled={streaming || uploadingZip || (!input.trim() && attachments.length === 0)}
              style={{
                background: streaming || uploadingZip || (!input.trim() && attachments.length === 0) ? C.border : C.accent,
                border: "none", borderRadius: 8,
                color: streaming || uploadingZip || (!input.trim() && attachments.length === 0) ? C.textDim : "#0a0a0f",
                fontFamily: sans, fontSize: 13, fontWeight: 700,
                padding: "7px 14px",
                cursor: streaming || uploadingZip || (!input.trim() && attachments.length === 0) ? "default" : "pointer",
                whiteSpace: "nowrap", alignSelf: "flex-end",
                transition: "background 0.15s",
              }}
            >
              {streaming ? "…" : uploadingZip ? "Uploading" : "Send"}
            </button>
          </div>
          <div style={{ color: C.textDim, fontSize: 11, marginTop: 8, textAlign: "center" }}>
            Enter ↵ to send · Shift+Enter for newline · Drag to resize
          </div>
        </div>
      </div>
    </>
  );
}
