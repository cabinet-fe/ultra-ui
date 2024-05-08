import { setStyles } from '@ui/utils'

export default class Stars {
  wrapper: HTMLDivElement | null = null
  data: { text: string } = { text: '' }

  constructor(data: { text?: string }) {
    this.data = { text: String(this.wrapper) ?? '' }
  }

  render() {
    this.wrapper = document.createElement('h1')

    this.wrapper.innerHTML = '******'

    setStyles(this.wrapper, {
      textAlign: 'center',
      fontSize: '20px'
    })

    return this.wrapper
  }

  save() {
    return { ...this.data }
  }

  static get toolbox() {
    return {
      title: '分隔符',
      icon: `*`
    }
  }
}
