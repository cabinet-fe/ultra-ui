import { describe, expect, it } from 'vite-plus/test'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import { UForm } from '../../form'
import UExpressionEditor from '../expression-editor.vue'

async function mountEditor(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const app = createApp({ render: () => h(UExpressionEditor, props) })
  app.mount(host)
  // 首次渲染后 editor 才上报框内空态，等一轮刷新再断言
  await nextTick()

  return {
    host,
    hint: () => host.querySelector('.u-expression-editor__hint'),
    placeholder: () => host.querySelector('.u-expression-editor__placeholder'),
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UExpressionEditor 提示行与占位文字', () => {
  it('提示行常驻：有内容时依然显示', async () => {
    const empty = await mountEditor()
    expect(empty.hint()).not.toBeNull()
    empty.unmount()

    const filled = await mountEditor({ modelValue: '你好{user}' })
    expect(filled.hint()).not.toBeNull()
    filled.unmount()
  })

  it('禁用 / 只读时不显示提示行', async () => {
    const disabled = await mountEditor({ disabled: true })
    expect(disabled.hint()).toBeNull()
    disabled.unmount()

    const readonly = await mountEditor({ readonly: true })
    expect(readonly.hint()).toBeNull()
    readonly.unmount()
  })

  it('占位文字仍随内容显隐', async () => {
    const empty = await mountEditor()
    expect(empty.placeholder()?.textContent?.trim()).toBe('请输入表达式，输入 @ 可插入变量')
    empty.unmount()

    const filled = await mountEditor({ modelValue: '你好' })
    expect(filled.placeholder()).toBeNull()
    filled.unmount()
  })
})

describe('UExpressionEditor 在 UForm 中的状态下发', () => {
  /** 挂一个 UForm + 内嵌表达式编辑器，返回可切换表单级 readonly / disabled 的句柄 */
  async function mountInForm() {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const formReadonly = ref(false)
    const formDisabled = ref(false)
    const model = ref({ expression: '' })

    const App = defineComponent({
      setup() {
        return () =>
          h(
            UForm,
            { model: model.value, readonly: formReadonly.value, disabled: formDisabled.value },
            { default: () => h(UExpressionEditor, { label: '表达式', field: 'expression' }) }
          )
      }
    })

    const app = createApp(App)
    app.mount(host)
    await nextTick()

    return {
      host,
      formReadonly,
      formDisabled,
      shell: () => host.querySelector('.u-expression-editor__shell'),
      container: () => host.querySelector('.u-expression-editor__container'),
      async settle() {
        await nextTick()
        await nextTick()
      },
      unmount() {
        app.unmount()
        host.remove()
      }
    }
  }

  it('UForm readonly 下发到视觉盒，并禁止编辑', async () => {
    const ctx = await mountInForm()
    expect(ctx.shell()?.className).not.toContain('is-readonly')

    ctx.formReadonly.value = true
    await ctx.settle()

    expect(ctx.shell()?.className).toContain('is-readonly')
    expect(ctx.container()?.getAttribute('contenteditable')).toBe('false')

    ctx.unmount()
  })

  it('UForm disabled 下发到视觉盒', async () => {
    const ctx = await mountInForm()

    ctx.formDisabled.value = true
    await ctx.settle()

    expect(ctx.shell()?.className).toContain('is-disabled')

    ctx.unmount()
  })
})
