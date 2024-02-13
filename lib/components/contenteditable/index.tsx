import React from "react"

interface ContenteditableProps {
  placeholder?: string
}

const Contenteditable: React.FC<ContenteditableProps> = (props) => {
  return (
    <div
      contentEditable
      dir="auto"
      role="textbox"
      aria-label={props.placeholder || ""}
    />
  )
}

export default Contenteditable
