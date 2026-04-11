import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react"

const MAX_UNDO_STACK_SIZE = 100

// Feature detection for contenteditable="plaintext-only" (SSR-safe)
const supportsPlaintextOnly = (() => {
  if (typeof document === "undefined") return false
  try {
    const div = document.createElement("div")
    div.contentEditable = "plaintext-only"
    return div.contentEditable === "plaintext-only"
  } catch {
    return false
  }
})()

const isContentWithinMaxLength = (
  content: string,
  maxLength?: number
): boolean => {
  if (!maxLength) return true
  return content.length <= maxLength
}

export interface ContentEditableHandle {
  focus: () => void
  blur: () => void
  insertAtCaret: (text: string) => void
  clear: () => void
  getCaretPosition: () => number
}

interface ContentEditableOwnProps {
  containerClassName?: string
  contentEditableClassName?: string
  placeholderClassName?: string
  charsCounterClassName?: string
  placeholder?: string
  disabled?: boolean
  updatedContent?: string
  maxLength?: number
  autoFocus?: boolean
  tagName?: string
  multiLine?: boolean
  sanitize?: (content: string) => string
  onChange?: (content: string, meta?: { caretPosition: number }) => void
  onKeyUp?: (e: React.KeyboardEvent) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onFocus?: (e: React.FocusEvent) => void
  onBlur?: (e: React.FocusEvent) => void
  onPaste?: (e: React.ClipboardEvent) => void
  onContentExternalUpdate?: (content: string) => void
}

export type ContentEditableProps = ContentEditableOwnProps &
  Omit<
    React.HTMLAttributes<HTMLElement>,
    keyof ContentEditableOwnProps | "contentEditable"
  >

const ContentEditable = forwardRef<ContentEditableHandle, ContentEditableProps>(
  (
    {
      containerClassName,
      contentEditableClassName,
      placeholderClassName,
      charsCounterClassName,
      placeholder,
      disabled,
      updatedContent,
      maxLength,
      autoFocus,
      tagName = "div",
      multiLine = true,
      sanitize,
      onChange,
      onKeyUp,
      onKeyDown,
      onFocus,
      onBlur,
      onPaste,
      onContentExternalUpdate,
      style,
      className,
      ...rest
    },
    ref
  ) => {
    const [content, setContent] = useState("")
    const divRef = useRef<HTMLElement | null>(null)
    const undoStack = useRef<string[]>([])
    const redoStack = useRef<string[]>([])
    const lastCaretPosition = useRef(0)

    useImperativeHandle(ref, () => ({
      focus: () => divRef.current?.focus(),
      blur: () => divRef.current?.blur(),
      insertAtCaret: (text: string) => {
        if (!divRef.current) return
        divRef.current.focus()
        insertTextAtCaret(text, lastCaretPosition.current)
      },
      clear: () => {
        if (!divRef.current) return
        divRef.current.innerText = ""
        setContent("")
      },
      getCaretPosition: () => {
        if (!divRef.current) return 0
        const pos = getCaretPositionFromElement(divRef.current)
        return pos >= 0 ? pos : lastCaretPosition.current
      },
    }))

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
        if (onChange && isContentWithinMaxLength(content, maxLength)) {
          onChange(content, { caretPosition: lastCaretPosition.current })
        }
      }
    }, [content, onChange, maxLength])

    useEffect(() => {
      if (divRef.current && autoFocus) {
        divRef.current.focus()
      }
    }, [autoFocus])

    useEffect(() => {
      undoStack.current.push(content)
      if (undoStack.current.length > MAX_UNDO_STACK_SIZE) {
        undoStack.current.shift()
      }
    }, [content])

    // Enable contenteditable="plaintext-only" when supported (via DOM for React 18 compat)
    useEffect(() => {
      if (divRef.current && !disabled && supportsPlaintextOnly) {
        divRef.current.contentEditable = "plaintext-only"
      }
    }, [disabled])

    // --- Helper functions ---

    function getCaretPositionFromElement(editableDiv: HTMLElement): number {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return -1
      const range = sel.getRangeAt(0)
      if (!editableDiv.contains(range.endContainer)) return -1
      const preCaretRange = document.createRange()
      preCaretRange.selectNodeContents(editableDiv)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      return preCaretRange.toString().length
    }

    function setCaretPosition(elem: HTMLElement, pos: number) {
      const sel = window.getSelection()
      if (!sel) return

      const walker = document.createTreeWalker(elem, NodeFilter.SHOW_TEXT)
      let remaining = pos
      let node: Node | null = null

      while ((node = walker.nextNode())) {
        const len = (node as Text).length
        if (remaining <= len) {
          const range = document.createRange()
          range.setStart(node, remaining)
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
          return
        }
        remaining -= len
      }

      // Offset exceeds content — place caret at the end
      setCaretAtTheEnd(elem)
    }

    function setCaretAtTheEnd(editableDiv: HTMLElement) {
      const range = document.createRange()
      const sel = window.getSelection()
      if (sel) {
        range.selectNodeContents(editableDiv)
        range.collapse(false)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }

    function insertTextAtCaret(text: string, position?: number) {
      if (!divRef.current) return
      let currentCaretPos: number
      if (position !== undefined) {
        currentCaretPos = position
      } else {
        const pos = getCaretPositionFromElement(divRef.current)
        currentCaretPos = pos >= 0 ? pos : lastCaretPosition.current
      }

      // Place caret at the target position, then insert via Range API
      // This preserves the DOM structure (text nodes, <br>, <div> lines)
      setCaretPosition(divRef.current, currentCaretPos)

      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        range.deleteContents()
        const textNode = document.createTextNode(text)
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      }

      setContent(divRef.current.innerText)
      divRef.current.scrollTop = divRef.current.scrollHeight

      const newPos = currentCaretPos + text.length
      lastCaretPosition.current = newPos
    }

    function isCaretOnLastLine(element: HTMLElement): boolean {
      if (element.ownerDocument.activeElement !== element) return false
      const win = element.ownerDocument.defaultView
      if (!win) return false
      const selection = win.getSelection()
      if (!selection || selection.rangeCount === 0) return false

      const originalCaretRange = selection.getRangeAt(0)
      if (originalCaretRange.toString().length > 0) return false
      const originalCaretRect = originalCaretRange.getBoundingClientRect()

      const endOfElementRange = document.createRange()
      endOfElementRange.selectNodeContents(element)
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
    }

    function isAllTextSelected(): boolean {
      const sel = window.getSelection()
      const newlineCount = (divRef.current?.innerText.match(/\n(\n|$)/g) || [])
        .length
      return sel
        ? sel.toString().length + newlineCount ===
            divRef.current?.innerText.length
        : false
    }

    // --- Event handlers ---

    function handlePasteEvent(e: React.ClipboardEvent<HTMLElement>) {
      e.preventDefault()
      if (onPaste) onPaste(e)

      const plainText = e.clipboardData.getData("text/plain")
      const processedPaste = multiLine
        ? plainText
        : plainText.replace(/\n/g, " ")

      const sel = window.getSelection()
      const currentContent = divRef.current?.innerText || ""

      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0)
        const selectedText = range.toString()

        const availableSpace = maxLength
          ? maxLength - (currentContent.length - selectedText.length)
          : processedPaste.length
        let truncatedText = processedPaste.slice(0, availableSpace)
        if (sanitize) truncatedText = sanitize(truncatedText)

        if (truncatedText.length > 0) {
          range.deleteContents()
          const textNode = document.createTextNode(truncatedText)
          range.insertNode(textNode)
          range.setStartAfter(textNode)
          sel.removeAllRanges()
          sel.addRange(range)

          const newContent = divRef.current?.innerText ?? ""
          setContent(newContent)
          if (divRef.current) {
            const pos = getCaretPositionFromElement(divRef.current)
            if (pos >= 0) lastCaretPosition.current = pos
          }
        }
      } else {
        const availableSpace = maxLength
          ? maxLength - currentContent.length
          : processedPaste.length
        let truncatedText = processedPaste.slice(0, availableSpace)
        if (sanitize) truncatedText = sanitize(truncatedText)

        if (truncatedText.length > 0) {
          insertTextAtCaret(truncatedText)
        }
      }
    }

    function handleCaretScroll(e: React.KeyboardEvent) {
      if (!divRef.current) return
      const focus = divRef.current
      switch (e.key) {
        case "ArrowUp":
          if (getCaretPositionFromElement(focus) <= 0) focus.scrollTop = 0
          break
        case "Enter":
        case "ArrowDown":
          if (isCaretOnLastLine(focus)) focus.scrollTop = focus.scrollHeight
          break
      }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
      if (onKeyDown) onKeyDown(e)
      if (!divRef.current) return

      const isModifier = e.ctrlKey || e.metaKey

      // Undo
      if (isModifier && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        if (undoStack.current.length > 1) {
          redoStack.current.push(undoStack.current.pop() as string)
          const previousContent =
            undoStack.current[undoStack.current.length - 1]
          setContent(previousContent)
          if (divRef.current) {
            divRef.current.innerText = previousContent
            setCaretAtTheEnd(divRef.current)
          }
        }
        return
      }

      // Redo
      if (
        (isModifier && e.key === "y") ||
        (isModifier && e.shiftKey && (e.key === "z" || e.key === "Z"))
      ) {
        e.preventDefault()
        if (redoStack.current.length > 0) {
          const nextContent = redoStack.current.pop() as string
          undoStack.current.push(nextContent)
          setContent(nextContent)
          if (divRef.current) {
            divRef.current.innerText = nextContent
            setCaretAtTheEnd(divRef.current)
          }
        }
        return
      }

      // Prevent Enter in single-line mode
      if (!multiLine && e.key === "Enter") {
        e.preventDefault()
        return
      }

      // Handle Delete/Backspace edge cases
      if (
        (["Delete", "Backspace"].includes(e.key) && isAllTextSelected()) ||
        (e.key === "Backspace" && content.length === 1) ||
        (e.key === "Delete" &&
          getCaretPositionFromElement(divRef.current) === 0 &&
          content.length === 1)
      ) {
        e.preventDefault()
        divRef.current.innerText = ""
        setContent("")
      }
    }

    // --- Render ---

    const EditableTag = tagName as React.ElementType

    const mergedClassName =
      [contentEditableClassName, className].filter(Boolean).join(" ") ||
      undefined

    const mergedStyle: React.CSSProperties = {
      padding: "0.85rem",
      overflow: "auto",
      height: "auto",
      textAlign: "initial",
      wordBreak: "break-word",
      unicodeBidi: "plaintext",
      flex: 1,
      minWidth: 0,
      ...style,
    }

    return (
      <div
        className={containerClassName}
        style={{ display: "flex", alignItems: "center", position: "relative" }}
      >
        <EditableTag
          dir="auto"
          role="textbox"
          aria-label={placeholder ?? ""}
          aria-multiline={multiLine}
          aria-disabled={disabled}
          {...rest}
          ref={divRef}
          className={mergedClassName}
          style={mergedStyle}
          contentEditable={!disabled}
          onInput={(e: React.FormEvent<HTMLElement>) => {
            const raw = e.currentTarget.innerText
            if (disabled || !isContentWithinMaxLength(raw, maxLength)) {
              if (divRef.current) {
                divRef.current.innerText = content
                setCaretAtTheEnd(divRef.current)
              }
              return
            }
            const processed = sanitize ? sanitize(raw) : raw
            if (processed !== raw && divRef.current) {
              divRef.current.innerText = processed
              setCaretAtTheEnd(divRef.current)
            }
            setContent(processed)
            if (divRef.current) {
              if (processed !== raw) {
                lastCaretPosition.current = processed.length
              } else {
                const pos = getCaretPositionFromElement(divRef.current)
                if (pos >= 0) lastCaretPosition.current = pos
              }
            }
          }}
          onPaste={(e: React.ClipboardEvent<HTMLElement>) => {
            if (disabled) return
            handlePasteEvent(e)
          }}
          onFocus={(e: React.FocusEvent<HTMLElement>) => {
            if (onFocus) onFocus(e)
          }}
          onBlur={(e: React.FocusEvent<HTMLElement>) => {
            if (divRef.current) {
              const pos = getCaretPositionFromElement(divRef.current)
              if (pos >= 0) lastCaretPosition.current = pos
            }
            if (onBlur) onBlur(e)
          }}
          onClick={() => {
            if (divRef.current) {
              const pos = getCaretPositionFromElement(divRef.current)
              if (pos >= 0) lastCaretPosition.current = pos
            }
          }}
          onKeyUp={(e: React.KeyboardEvent<HTMLElement>) => {
            if (disabled) return
            if (divRef.current) {
              const pos = getCaretPositionFromElement(divRef.current)
              if (pos >= 0) lastCaretPosition.current = pos
            }
            if (onKeyUp) onKeyUp(e)
            handleCaretScroll(e)
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
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
        {!!maxLength && (
          <span
            dir="auto"
            className={charsCounterClassName}
            style={{
              marginLeft: "1rem",
            }}
          >
            {`${content.length ?? 0}/${maxLength}`}
          </span>
        )}
      </div>
    )
  }
)

ContentEditable.displayName = "ContentEditable"

export default ContentEditable
