// type ItemSize = (index: number) => number

// interface VirtualizerOption {
//   /** 长度 */
//   length: number
//   /** 缓冲数量 */
//   buffer?: number
//   /** 每项高度 */
//   itemSize?: ItemSize
// }

// class Virtualizer {
//   private length = 0
//   private buffer = 5
//   private itemSize: ItemSize = () => 36

//   constructor(option?: VirtualizerOption) {
//     // if (!option) return
//     Object.keys(option).forEach(key => {
//       const optionVal = option[key]
//       if (optionVal !== undefined) {
//         this[key] = option[key]
//       }
//     })
//   }

//   updateS
// }

// class VirtualContainer {
//   private container: HTMLElement

//   private handleScroll = (e: Event) => {}

//   constructor(container: string | HTMLElement) {
//     if (typeof container === 'string') {
//       container = document.querySelector(container) as HTMLElement
//     }
//     if (container) {
//       this.container = container
//     } else {
//       console.warn(`container is empty`)
//       return
//     }

//     this.container.addEventListener('scroll', this.handleScroll, {
//       passive: true
//     })
//   }

//   destroy() {
//     this.container.removeEventListener('scroll', this.handleScroll)
//   }
// }
