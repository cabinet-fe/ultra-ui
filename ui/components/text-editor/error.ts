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
    this.button.textContent = 'x'

    setStyles(this.button, {
      border: 0,
      cursor: 'pointer',
      backgroundColor: 'transparent'
    })

    return this.button
  }

  surround(range) {
    if (this.state) return
    console.log(1111, 'anchorElement')
    const selectedText = range.extractContents()

    const color = document.createElement('color')

    color.appendChild(selectedText)

    setStyles(color, {
      color: 'red'
    })

    range.insertNode(color)
  }

  checkState(selection) {
    const text = selection.anchorNode

    if (!text) {
      return
    }

    const anchorElement = text instanceof Element ? text : text.parentElement

    this.state = !!anchorElement.closest('color')
  }
}
