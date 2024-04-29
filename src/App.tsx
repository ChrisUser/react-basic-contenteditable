import ContentEditable from "../lib/ContentEditable"
import "./App.css"
import { useEffect, useState } from "react"

const App = () => {
  const [emptyContent, setEmptyContent] = useState<string | undefined>(
    undefined
  )
  const [content, setContent] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [isBlurred, setIsBlurred] = useState(false)
  const [keyDown, setKeyDown] = useState("")
  const [keyUp, setKeyUp] = useState("")
  const [messageHistory, setMessageHistory] = useState<string[]>([
    "Type something and press on 'Send' to send another message...",
  ])

  const truncateString = (str: string, limit: number) => {
    return str.length > limit ? str.slice(0, limit) + "..." : str
  }

  useEffect(() => {
    setEmptyContent(undefined)
  }, [emptyContent])

  const saveMessageInHistory = (message: string) => {
    setMessageHistory([...messageHistory, message])
    setContent("")
    setEmptyContent("")
  }

  return (
    <div className="full-width main-container">
      <div className="full-width message-history-container">
        {messageHistory.map((message, index) => (
          <div key={index} className="message-item">
            {message}
          </div>
        ))}
      </div>
      <ContentEditable
        placeholder="Type here"
        containerClassName="full-width input-container"
        contentEditableClassName="full-width input-element"
        placeholderClassName="input-placeholder"
        updatedContent={emptyContent}
        onChange={(content) => setContent(content)}
        onFocus={() => {
          setIsFocused(true)
          setIsBlurred(false)
        }}
        onBlur={() => {
          setIsFocused(false)
          setIsBlurred(true)
        }}
        onKeyDown={(e) => setKeyDown(e.key)}
        onKeyUp={(e) => setKeyUp(e.key)}
      />
      <div className="full-width metrics-section">
        <div className="metrics-section__left-box">
          <div>
            Content:{" "}
            <b className="current-message-text">
              {truncateString(content, 200)}
            </b>
          </div>
          <div>
            Is focused:{" "}
            <b className={isFocused ? "truthy" : "falsy"}>
              {isFocused ? "true" : "false"}
            </b>
          </div>
          <div>
            Is blurred:{" "}
            <b className={isBlurred ? "truthy" : "falsy"}>
              {isBlurred ? "true" : "false"}
            </b>
          </div>
          <div>
            Key down: <b>{keyDown}</b>
          </div>
          <div>
            Key up: <b>{keyUp}</b>
          </div>
        </div>
        <div>
          <button onClick={() => saveMessageInHistory(content)}>Send</button>
        </div>
      </div>
    </div>
  )
}

export default App
