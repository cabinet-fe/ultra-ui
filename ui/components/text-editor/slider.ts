import { setStyles } from '@ui/utils'
import { USlider } from '../slider'
import { createApp, h } from 'vue'

export default class slider {
  wrapper: HTMLDivElement | null = null
  data: { value: number }
  app: any = null

  constructor(data: { value?: number }) {
    this.data = { value: data.value || 0 }
  }

  render() {
    this.wrapper = document.createElement('div')

    this.app = createApp({
      render() {
        return h('div', [
          h('h1', ''),
          h(USlider, {
            modelValue: this.data?.value
          })
        ])
      }
    })

    this.app.mount(this.wrapper)

    setStyles(this.wrapper.querySelector('h1')!, {
      textAlign: 'center'
    })

    return this.wrapper
  }

  save(anchorElement) {
    return { ...this.data }
  }

  static get toolbox() {
    return {
      title: '滑块',
      icon: '0'
    }
  }
}
