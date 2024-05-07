import { setStyles } from '@ui/utils'

export default class Stars {
  wrapper: HTMLDivElement | null = null
  data: { text: string } = { text: '' }

  constructor(data: { text?: string }) {}

  render() {
    this.wrapper = document.createElement('h1')

    this.wrapper.innerHTML = '******'

    setStyles(this.wrapper, {
      textAlign: 'center',
      fontSize: '20px'
    })

    this.data.text = this.wrapper.textContent || ''

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
