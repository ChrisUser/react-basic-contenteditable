import ContentEditable from "../lib/ContentEditable"
import "./App.css"
import { useState } from "react"

function App() {
  const [content, setContent] = useState("")
  return (
    <div className="main-container full-width">
      <div style={{ whiteSpace: "pre-wrap" }}>{content}</div>
      <ContentEditable
        placeholder="Type here"
        containerClassName="full-width input-container"
        contentEditableClassName="full-width input-element"
        placeholderClassName="input-placeholder"
        onChange={(content) => setContent(content)}
      />
    </div>
  )
}

export default App
