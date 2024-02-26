import { createToggle } from '../helper/create-toggle'

describe('工具帮助', () => {
  test('创建状态切换方法', () => {
    const [active, toggle] = createToggle()
    expect(active.value).toBe(false)
    toggle(true)
    expect(active.value).toBe(true)
    toggle(active => !active)
    expect(active.value).toBe(false)
    toggle(active => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(!active)
        }, 300)
      })
    })
    expect(active.value).toBe(false)
    setTimeout(() => {
      expect(active.value).toBe(true)
    }, 300)
  })
})
