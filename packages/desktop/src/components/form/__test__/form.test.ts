import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, reactive, ref } from 'vue'

import { UInput } from '../../input'
import { USelect } from '../../select'
import { UForm } from '../index'

const behaviorOptions = [
  { label: '事件', value: 'event' },
  { label: '接口', value: 'api' }
]

describe('UForm field events', () => {
  it('编程写入触发 field:update，不依赖用户操作', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const model = reactive({ behavior: 'event' })
    const updates: { field: string; value: unknown }[] = []

    const app = createApp({
      render() {
        return h(
          UForm,
          {
            model,
            'onField:update': (field: string, value: unknown) => {
              updates.push({ field, value })
            }
          },
          {
            default: () =>
              h(USelect, { field: 'behavior', label: '行为', options: behaviorOptions })
          }
        )
      }
    })

    app.mount(host)
    updates.length = 0

    model.behavior = 'api'
    await nextTick()

    expect(updates.some((item) => item.field === 'behavior' && item.value === 'api')).toBe(true)

    app.unmount()
    host.remove()
  })

  it('父级重渲染时动态 props 同步到插槽控件', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const model = reactive({ username: '' })
    const disabled = ref(false)
    const placeholder = ref('第一次')

    const app = createApp({
      render() {
        return h(
          UForm,
          { model },
          {
            default: () =>
              h(UInput, {
                field: 'username',
                label: '账号',
                disabled: disabled.value,
                placeholder: placeholder.value
              })
          }
        )
      }
    })

    app.mount(host)

    const input = () => host.querySelector('input')!
    expect(input().disabled).toBe(false)
    expect(input().placeholder).toBe('第一次')

    disabled.value = true
    placeholder.value = '第二次'
    await nextTick()

    expect(input().disabled).toBe(true)
    expect(input().placeholder).toBe('第二次')

    app.unmount()
    host.remove()
  })
})

/** 用 setup 期间生成的 id 断言实例身份 */
let probeSeq = 0
const Probe = defineComponent({
  name: 'Probe',
  props: { field: String, label: String, modelValue: String },
  setup(props) {
    const id = `p${++probeSeq}`
    return () =>
      h('div', { class: 'probe', 'data-field': props.field, 'data-id': id }, [
        h('span', { class: 'probe-value' }, props.modelValue ?? '')
      ])
  }
})

describe('UForm slot identity', () => {
  it('中间字段卸载后不复用相邻控件实例', async () => {
    probeSeq = 0
    const host = document.createElement('div')
    document.body.appendChild(host)

    const model = reactive({ a: 'A', b: 'B', c: 'C' })
    const showB = ref(true)

    const app = createApp({
      render() {
        return h(
          UForm,
          { model },
          {
            default: () => [
              h(Probe, { field: 'a', label: 'A' }),
              showB.value ? h(Probe, { field: 'b', label: 'B' }) : null,
              h(Probe, { field: 'c', label: 'C' })
            ]
          }
        )
      }
    })

    app.mount(host)

    const idOf = (field: string) =>
      host.querySelector(`[data-field="${field}"]`)?.getAttribute('data-id')

    const cId = idOf('c')
    expect(cId).toBe('p3')

    showB.value = false
    await nextTick()

    expect(host.querySelector('[data-field="b"]')).toBeNull()
    expect(idOf('c')).toBe(cId)
    expect(host.querySelector('[data-field="c"] .probe-value')!.textContent).toBe('C')

    app.unmount()
    host.remove()
  })

  it('重复 field 各自保有独立实例', async () => {
    probeSeq = 0
    const host = document.createElement('div')
    document.body.appendChild(host)

    const model = reactive({ name: '同名' })

    const app = createApp({
      render() {
        return h(
          UForm,
          { model },
          {
            default: () => [
              h(Probe, { field: 'name', label: '左' }),
              h(Probe, { field: 'name', label: '右' })
            ]
          }
        )
      }
    })

    app.mount(host)

    const probes = [...host.querySelectorAll('.probe')]
    expect(probes).toHaveLength(2)
    expect(probes[0]!.getAttribute('data-id')).toBe('p1')
    expect(probes[1]!.getAttribute('data-id')).toBe('p2')
    expect(probes[0]!.querySelector('.probe-value')!.textContent).toBe('同名')
    expect(probes[1]!.querySelector('.probe-value')!.textContent).toBe('同名')

    app.unmount()
    host.remove()
  })

  it('showModified 变更前副本不抢走编辑控件', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const model = reactive({ name: '新值' })
    const initialModel = { name: '旧值' }

    const app = createApp({
      render() {
        return h(
          UForm,
          { model, initialModel, showModified: true },
          { default: () => h(UInput, { field: 'name', label: '名称' }) }
        )
      }
    })

    app.mount(host)
    await nextTick()

    const live = host.querySelector('input') as HTMLInputElement | null
    expect(live).toBeTruthy()
    expect(live!.value).toBe('新值')
    expect(host.querySelector('.u-form__data-before')?.textContent).toContain('旧值')

    app.unmount()
    host.remove()
  })
})
