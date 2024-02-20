import ContentEditable from "../lib/ContentEditable"
import "./App.css"
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
