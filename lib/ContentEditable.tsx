import React, { useState, useEffect, useRef, useCallback } from "react"

interface ContentEditableProps {
  containerClassName?: string
  contentEditableClassName?: string
  placeholderClassName?: string
  placeholder?: string
  disabled?: boolean
  updatedContent?: string
  onChange?: (content: string) => void
  onKeyUp?: (e: React.KeyboardEvent) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onFocus?: (e: React.FocusEvent) => void
  onBlur?: (e: React.FocusEvent) => void
  onContentExternalUpdate?: (content: string) => void
}

const ContentEditable: React.FC<ContentEditableProps> = ({
  containerClassName,
  contentEditableClassName,
  placeholderClassName,
  placeholder,
  disabled,
  updatedContent,
  onChange,
  onKeyUp,
  onKeyDown,
  onFocus,
  onBlur,
  onContentExternalUpdate,
}) => {
  const [content, setContent] = useState("")
  const divRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (updatedContent !== null && updatedContent !== undefined) {
      setContent(updatedContent)
      if (divRef.current) divRef.current.innerText = updatedContent
      if (onContentExternalUpdate) onContentExternalUpdate(updatedContent)
    }
  }, [updatedContent, onContentExternalUpdate])

  useEffect(() => {
    if (divRef.current) {
      divRef.current.style.height = "auto"
      if (onChange) onChange(content)
    }
  }, [content, onChange])

  /**
   * Checks if the caret is on the last line of a contenteditable element
   * @param element - The HTMLDivElement to check
   * @returns A boolean indicating whether the caret is on the last line or `false` when the caret is part of a selection
   */
  const isCaretOnLastLine = useCallback((element: HTMLDivElement): boolean => {
    if (element.ownerDocument.activeElement !== element) return false

    // Get the client rect of the current selection
    const window = element.ownerDocument.defaultView

    if (!window) return false

    const selection = window.getSelection()

    if (!selection || selection.rangeCount === 0) return false

    const originalCaretRange = selection.getRangeAt(0)

    // Bail if there is a selection
    if (originalCaretRange.toString().length > 0) return false

    const originalCaretRect = originalCaretRange.getBoundingClientRect()

    // Create a range at the end of the last text node
    const endOfElementRange = document.createRange()
    endOfElementRange.selectNodeContents(element)

    // The endContainer might not be an actual text node,
    // try to find the last text node inside
    let endContainer = endOfElementRange.endContainer
    let endOffset = 0

    while (endContainer.hasChildNodes() && !(endContainer instanceof Text)) {
      if (!endContainer.lastChild) continue

      endContainer = endContainer.lastChild
      endOffset = endContainer instanceof Text ? endContainer.length : 0
    }

    endOfElementRange.setEnd(endContainer, endOffset)
    endOfElementRange.setStart(endContainer, endOffset)
    const endOfElementRect = endOfElementRange.getBoundingClientRect()

    return originalCaretRect.bottom === endOfElementRect.bottom
  }, [])

  /**
   * Handles the caret scroll behavior based on keyboard events
   * @param e - The keyboard event
   */
  const handleCaretScroll = useCallback(
    (e: KeyboardEvent) => {
      if (!divRef.current) return
      const focus = divRef.current
      switch (e.keyCode) {
        case 38:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((focus as any).selectionStart === 0) focus.scrollTop = 0
          break
        case 13:
        case 40:
          if (isCaretOnLastLine(focus)) focus.scrollTop = focus.scrollHeight
          break
        default:
          break
      }
    },
    [isCaretOnLastLine]
  )

  function handlePasteEvent(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clipboardData = e.clipboardData || (window as any).clipboardData
    const plainText = clipboardData.getData("text/plain")

    // Get the current selection
    const sel: Selection | null = window.getSelection()
    if (sel && sel.rangeCount) {
      // Get the first range of the selection
      const range = sel.getRangeAt(0)

      // Delete the contents of the range (this is the selected text)
      range.deleteContents()

      // Create a new text node containing the pasted text
      const textNode = document.createTextNode(plainText)

      // Insert the text node into the range, which will replace the selected text
      range.insertNode(textNode)

      // Move the caret to the end of the new text
      range.setStartAfter(textNode)
      sel.removeAllRanges()
      sel.addRange(range)

      setContent(divRef.current?.innerText ?? "")
    } else {
      // If there's no selection, just insert the text at the current caret position
      insertTextAtCaret(plainText)
    }
  }

  /**
   * Inserts the specified text at the current caret position in the contentEditable element
   * @param text - The text to be inserted
   */
  function insertTextAtCaret(text: string) {
    if (!divRef.current) return
    const currentCaretPos = getCaretPosition(divRef.current)

    divRef.current.innerText =
      divRef.current.innerText.slice(0, currentCaretPos) +
      text +
      divRef.current.innerText.slice(currentCaretPos)

    setContent(divRef.current.innerText)
    divRef.current.scrollTop = divRef.current.scrollHeight
    setCaretPosition(divRef.current, currentCaretPos + text.length)
  }

  // Note: setSelectionRange and createTextRange are not supported by contenteditable elements

  /**
   * Sets the caret position within the contentEditable element
   * If the element is empty, it will be focused
   *
   * @param elem - The contentEditable element
   * @param pos - The position to set the caret to
   */
  function setCaretPosition(elem: HTMLElement, pos: number) {
    // Create a new range
    const range = document.createRange()

    // Get the child node of the div
    const childNode = elem.childNodes[0]

    if (childNode != null) {
      // Set the range to the correct position within the text
      range.setStart(childNode, pos)
      range.setEnd(childNode, pos)

      // Get the selection object
      const sel: Selection | null = window.getSelection()
      if (!sel) return
      // Remove any existing selections
      sel.removeAllRanges()

      // Add the new range (this will set the cursor position)
      sel.addRange(range)
    } else {
      // If the div is empty, focus it
      elem.focus()
    }
  }

  /**
   * Retrieves the caret position within the contentEditable element
   * @param editableDiv - The contentEditable element
   * @returns The caret position as a number
   */
  function getCaretPosition(editableDiv: HTMLElement) {
    let caretPos = 0,
      range
    if (window.getSelection) {
      const sel: Selection | null = window.getSelection()
      if (sel && sel.rangeCount) {
        range = sel.getRangeAt(0)
        if (range.commonAncestorContainer.parentNode === editableDiv) {
          caretPos = range.endOffset
        }
      }
    } else if (document.getSelection() && document.getSelection()?.getRangeAt) {
      range = document.getSelection()?.getRangeAt(0)
      if (range && range.commonAncestorContainer.parentNode === editableDiv) {
        const tempEl = document.createElement("span")
        editableDiv.insertBefore(tempEl, editableDiv.firstChild)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tempRange: any = range.cloneRange()
        tempRange.moveToElementText(tempEl)
        tempRange.setEndPoint("EndToEnd", range)
        caretPos = tempRange.text.length
      }
    }
    return caretPos
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (onKeyDown) onKeyDown(e)
    if ((e.key === "Delete" || e.key === "Backspace") && isAllTextSelected()) {
      e.preventDefault()
      if (divRef.current) {
        divRef.current.innerText = ""
        setContent("")
      }
    }
  }

  const isAllTextSelected = (): boolean => {
    const sel: Selection | null = window.getSelection()

    // Matches newline characters that are either followed by another newline
    // character (\n) or the end of the string ($).
    const newlineCount = (divRef.current?.innerText.match(/\n(\n|$)/g) || [])
      .length
    return sel
      ? sel.toString().length + newlineCount ===
          divRef.current?.innerText.length
      : false
  }

  useEffect(() => {
    document.addEventListener("keyup", handleCaretScroll)
    return () => document.removeEventListener("keyup", handleCaretScroll)
  }, [handleCaretScroll])

  return (
    <div
      className={containerClassName}
      style={{ display: "flex", alignItems: "center", position: "relative" }}
    >
      <div
        ref={divRef}
        contentEditable
        defaultValue={content}
        aria-disabled={disabled}
        dir="auto"
        role="textbox"
        aria-label={placeholder ?? ""}
        className={contentEditableClassName}
        style={{
          padding: "0.85rem",
          overflow: "auto",
          height: "auto",
          textAlign: "initial",
          wordBreak: "break-word",
          unicodeBidi: "plaintext",
        }}
        onInput={(e: React.FormEvent<HTMLDivElement>) => {
          if (disabled) return
          setContent(e.currentTarget.innerText)
        }}
        onPaste={(e) => {
          if (disabled) return
          handlePasteEvent(e)
        }}
        onFocus={(e) => {
          if (onFocus) onFocus(e)
        }}
        onBlur={(e) => {
          if (onBlur) onBlur(e)
        }}
        onKeyUp={(e) => {
          if (disabled) return
          if (onKeyUp) onKeyUp(e)
        }}
        onKeyDown={(e) => {
          if (disabled) return
          handleKeyDown(e)
        }}
      />
      {!content && (
        <span
          dir="auto"
          className={placeholderClassName}
          style={{
            position: "absolute",
            pointerEvents: "none",
            textAlign: "initial",
          }}
        >
          {placeholder ?? ""}
        </span>
      )}
    </div>
  )
}

export default ContentEditable
