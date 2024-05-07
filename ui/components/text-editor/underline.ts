import { setStyles } from '@ui/utils'

export default class MarkerTool {
  button: HTMLButtonElement | null
  state: boolean

  static get isInline() {
    return true
  }

  constructor() {
    this.button = null
    this.state = false
  }

  render() {
    this.button = document.createElement('button')
    this.button.type = 'button'
    this.button.textContent = '-'

    setStyles(this.button, {
      border: 0,
      cursor: 'pointer'
    })

    return this.button
  }

  surround(range) {
    if (this.state) return

    /** 文字 */
    const selectedText = range.extractContents()

    const color = document.createElement('underline')

    color.appendChild(selectedText)

    setStyles(color, {
      textDecoration: 'underline',
      boxShadow: '0 1px 4px 0 #ccc'
    })

    range.insertNode(color)
  }

  checkState(selection) {
    const text = selection.anchorNode

    if (!text) {
      return
    }

    const anchorElement = text instanceof Element ? text : text.parentElement

    this.state = !!anchorElement.closest('underline')
  }
}
