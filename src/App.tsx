import ContentEditable from "../lib/ContentEditable"
import type { ContentEditableHandle } from "../lib/ContentEditable"
import "./App.css"
import { useEffect, useRef, useState } from "react"

const EMOJIS = ["👋", "🔥", "💡", "🚀", "✨", "🎉", "❤️", "👍"]

const App = () => {
  // --- Chat demo state ---
  const [emptyContent, setEmptyContent] = useState<string | undefined>(
    undefined
  )
  const [content, setContent] = useState("")
  const [messageHistory, setMessageHistory] = useState<string[]>([
    "Welcome! This demo showcases every feature of react-basic-contenteditable.",
    "Try typing, pasting, using undo/redo, and the controls below.",
  ])
  const chatRef = useRef<ContentEditableHandle>(null)

  useEffect(() => {
    setEmptyContent(undefined)
  }, [emptyContent])

  const sendMessage = () => {
    if (!content.trim()) return
    setMessageHistory((prev) => [...prev, content])
    setContent("")
    setEmptyContent("")
  }

  // --- Single-line demo state ---
  const [titleText, setTitleText] = useState("")

  // --- Disabled demo state ---
  const [isDisabled, setIsDisabled] = useState(true)

  // --- Sanitize demo state ---
  const [sanitizedText, setSanitizedText] = useState("")

  // --- Custom tag demo state ---
  const [quoteText, setQuoteText] = useState("")

  // --- Event log state ---
  const [events, setEvents] = useState<string[]>([])
  const logEvent = (name: string, detail?: string) => {
    setEvents((prev) =>
      [`${name}${detail ? ": " + detail : ""}`, ...prev].slice(0, 8)
    )
  }

  return (
    <div className="demo-root">
      <header className="demo-header">
        <h1>react-basic-contenteditable</h1>
        <p className="demo-subtitle">Interactive feature showcase</p>
      </header>

      <div className="demo-grid">
        {/* ── Chat / Multi-line ─────────────────────────── */}
        <section className="demo-card demo-card--wide">
          <div className="card-header">
            <h2>Chat input</h2>
            <span className="badge">multiLine + maxLength + ref API</span>
          </div>

          <div className="chat-messages">
            {messageHistory.map((msg, i) => (
              <div key={i} className="chat-bubble">
                {msg}
              </div>
            ))}
          </div>

          <div className="chat-input-row">
            <ContentEditable
              ref={chatRef}
              placeholder="Type a message..."
              containerClassName="chat-input-container"
              contentEditableClassName="chat-input"
              placeholderClassName="chat-placeholder"
              charsCounterClassName="chat-counter"
              updatedContent={emptyContent}
              maxLength={200}
              autoFocus
              onChange={(c) => setContent(c)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              onPaste={() => logEvent("onPaste")}
              onFocus={() => logEvent("onFocus")}
              onBlur={() => logEvent("onBlur")}
              spellCheck={false}
              data-testid="chat-editor"
            />
          </div>

          <div className="chat-toolbar">
            <div className="emoji-row">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  className="btn btn--emoji"
                  title={`Insert ${e}`}
                  onClick={() => chatRef.current?.insertAtCaret(e)}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="chat-actions">
              <button
                className="btn btn--ghost"
                onClick={() => chatRef.current?.clear()}
              >
                Clear
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => chatRef.current?.focus()}
              >
                Focus
              </button>
              <button className="btn btn--primary" onClick={sendMessage}>
                Send
              </button>
            </div>
          </div>
        </section>

        {/* ── Single-line ──────────────────────────────── */}
        <section className="demo-card">
          <div className="card-header">
            <h2>Single-line input</h2>
            <span className="badge">multiLine=false</span>
          </div>
          <ContentEditable
            placeholder="Editable title..."
            containerClassName="single-container"
            contentEditableClassName="single-input"
            placeholderClassName="single-placeholder"
            multiLine={false}
            onChange={(c) => setTitleText(c)}
          />
          <p className="demo-hint">
            Enter key is blocked. Pasted newlines become spaces.
          </p>
          {titleText && (
            <div className="output-preview">
              <span className="output-label">Value:</span> {titleText}
            </div>
          )}
        </section>

        {/* ── Custom tag ───────────────────────────────── */}
        <section className="demo-card">
          <div className="card-header">
            <h2>Custom tagName</h2>
            <span className="badge">tagName="blockquote"</span>
          </div>
          <ContentEditable
            tagName="blockquote"
            placeholder="Write a quote..."
            containerClassName="quote-container"
            contentEditableClassName="quote-input"
            placeholderClassName="quote-placeholder"
            onChange={(c) => setQuoteText(c)}
            style={{
              fontStyle: "italic",
              borderLeft: "3px solid #6366f1",
              padding: "0.75rem 1rem",
              margin: 0,
              background: "#f0f0ff",
              borderRadius: "0 0.35rem 0.35rem 0",
            }}
          />
          {quoteText && (
            <div className="output-preview">
              <span className="output-label">Rendered as:</span>{" "}
              {"<blockquote>"}
            </div>
          )}
        </section>

        {/* ── Disabled ─────────────────────────────────── */}
        <section className="demo-card">
          <div className="card-header">
            <h2>Disabled state</h2>
            <span className="badge">disabled prop</span>
          </div>
          <ContentEditable
            placeholder="Cannot type here"
            containerClassName="disabled-container"
            contentEditableClassName={`disabled-input ${isDisabled ? "disabled-input--off" : ""}`}
            placeholderClassName="disabled-placeholder"
            disabled={isDisabled}
          />
          <button
            className="btn btn--outline toggle-btn"
            onClick={() => setIsDisabled((d) => !d)}
          >
            {isDisabled ? "Enable editing" : "Disable editing"}
          </button>
        </section>

        {/* ── Sanitize ─────────────────────────────────── */}
        <section className="demo-card">
          <div className="card-header">
            <h2>Sanitize callback</h2>
            <span className="badge">sanitize prop</span>
          </div>
          <ContentEditable
            placeholder="Try typing numbers..."
            containerClassName="sanitize-container"
            contentEditableClassName="sanitize-input"
            placeholderClassName="sanitize-placeholder"
            sanitize={(text) => text.replace(/[0-9]/g, "")}
            onChange={(c) => setSanitizedText(c)}
          />
          <p className="demo-hint">
            Numbers are stripped in real time via{" "}
            <code>sanitize={"{(t) => t.replace(/[0-9]/g, '')}"}</code>
          </p>
          {sanitizedText && (
            <div className="output-preview">
              <span className="output-label">Output:</span> {sanitizedText}
            </div>
          )}
        </section>

        {/* ── Custom style ─────────────────────────────── */}
        <section className="demo-card">
          <div className="card-header">
            <h2>Inline style override</h2>
            <span className="badge">style prop</span>
          </div>
          <ContentEditable
            placeholder="Styled via props..."
            containerClassName="styled-container"
            placeholderClassName="styled-placeholder"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              borderRadius: "1rem",
              padding: "1rem 1.25rem",
              fontSize: "1.05rem",
              minHeight: "3rem",
            }}
          />
          <p className="demo-hint">
            Internal defaults are merged with your <code>style</code> object.
            Your values take precedence.
          </p>
        </section>

        {/* ── Event log ────────────────────────────────── */}
        <section className="demo-card">
          <div className="card-header">
            <h2>Event log</h2>
            <span className="badge">onFocus / onBlur / onPaste</span>
          </div>
          <div className="event-log">
            {events.length === 0 && (
              <span className="event-log__empty">
                Interact with the chat input above...
              </span>
            )}
            {events.map((ev, i) => (
              <div key={i} className="event-log__entry">
                {ev}
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="demo-footer">
        <span>
          Undo <kbd>Ctrl/Cmd+Z</kbd> &middot; Redo{" "}
          <kbd>Ctrl/Cmd+Shift+Z</kbd>
        </span>
      </footer>
    </div>
  )
}

export default App
