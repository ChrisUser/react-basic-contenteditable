import "./App.css"
import ContentEditable from "../lib/components/contenteditable"
import { useState } from "react"

function App() {
  const [content, setContent] = useState("")
  return (
    <div>
      <div style={{ whiteSpace: "pre-wrap" }}>{content}</div>
      <ContentEditable
        placeholder="Type here"
        onChange={(content) => setContent(content)}
      />
    </div>
  )
}

export default App
