"use client";
import { useState, useRef, useEffect } from "react";

const mono = "'JetBrains Mono', 'Fira Mono', monospace";
const C = {
  bg: "#08080e",
  card: "#111118",
  border: "#1a1a28",
  text: "#c8c8d8",
  muted: "#666",
  orange: "#f97316",
  user: "#1a1208",
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
      alignItems: "center", justifyContent: "center", fontFamily: mono,
    }}>
      <div style={{ width: 360 }}>
        <div style={{ color: C.orange, fontSize: 11, letterSpacing: "0.12em", marginBottom: 12 }}>
          HELP · CLAUDE ASSISTANT
        </div>
        <div style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
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
              width: "100%", background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 6, color: C.text, fontFamily: mono, fontSize: 14,
              padding: "10px 12px", outline: "none", boxSizing: "border-box",
            }}
          />
          {gateError && (
            <div style={{ color: "#ef5350", fontSize: 12, marginTop: 8 }}>Wrong password.</div>
          )}
          <button type="submit" style={{
            marginTop: 12, width: "100%", background: C.orange, border: "none",
            borderRadius: 6, color: "#000", fontFamily: mono, fontSize: 13,
            fontWeight: 700, padding: "10px", cursor: "pointer",
          }}>
            Continue →
          </button>
        </form>
      </div>
    </div>
  );
}

function Message({ msg, streaming }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 16, padding: "0 16px",
    }}>
      <div style={{
        maxWidth: "72%",
        background: isUser ? C.user : "transparent",
        border: isUser ? `1px solid #2a1a08` : "none",
        borderRadius: isUser ? 8 : 0,
        padding: isUser ? "10px 14px" : "0",
        color: isUser ? C.orange : C.text,
        fontFamily: mono, fontSize: 13, lineHeight: 1.7,
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>
        {msg.content}
        {streaming && !isUser && (
          <span style={{
            display: "inline-block", width: 8, height: 14,
            background: C.text, marginLeft: 2, verticalAlign: "text-bottom",
            animation: "blink 1s step-end infinite",
          }} />
        )}
      </div>
    </div>
  );
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
  const [streaming, setStreaming] = useState(false);
  const [gateError, setGateError] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

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
    setStreaming(false);
    textareaRef.current?.focus();
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, password }),
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
        });
      }
    } catch {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, content: "Error: connection failed." }];
      });
    }

    setStreaming(false);
  }

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
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a1a28; border-radius: 2px; }
      `}</style>
      <div style={{
        minHeight: "100vh", background: C.bg, display: "flex",
        flexDirection: "column", fontFamily: mono,
      }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px", borderBottom: `1px solid ${C.border}`,
          position: "sticky", top: 0, background: C.bg, zIndex: 10,
        }}>
          <div style={{ color: C.orange, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>
            HELP
          </div>
          <button
            onClick={handleNewChat}
            style={{
              background: "transparent", border: `1px solid ${C.border}`,
              borderRadius: 6, color: C.muted, fontFamily: mono, fontSize: 11,
              padding: "5px 12px", cursor: "pointer", letterSpacing: "0.06em",
            }}
          >
            New Chat
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 24, paddingBottom: 8 }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: "center", color: C.muted, fontSize: 12,
              marginTop: 80, letterSpacing: "0.06em",
            }}>
              Ask anything. BrightData and Microsoft Learn available.
            </div>
          )}
          {messages.map((msg, i) => (
            <Message
              key={i}
              msg={msg}
              streaming={streaming && i === messages.length - 1 && msg.role === "assistant"}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          borderTop: `1px solid ${C.border}`, padding: "12px 16px",
          background: C.bg,
        }}>
          <div style={{
            display: "flex", gap: 8, alignItems: "flex-end",
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "8px 12px",
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
              }}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none",
                color: streaming ? C.muted : C.text, fontFamily: mono,
                fontSize: 13, lineHeight: 1.6, resize: "none",
                minHeight: 22, maxHeight: 180, overflowY: "auto",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={streaming || !input.trim()}
              style={{
                background: streaming || !input.trim() ? C.border : C.orange,
                border: "none", borderRadius: 5, color: "#000",
                fontFamily: mono, fontSize: 11, fontWeight: 700,
                padding: "5px 12px", cursor: streaming || !input.trim() ? "default" : "pointer",
                whiteSpace: "nowrap", alignSelf: "flex-end",
                transition: "background 0.15s",
              }}
            >
              {streaming ? "…" : "Send"}
            </button>
          </div>
          <div style={{ color: C.muted, fontSize: 10, marginTop: 6, textAlign: "center" }}>
            Enter ↵ send · Shift+Enter newline
          </div>
        </div>
      </div>
    </>
  );
}
