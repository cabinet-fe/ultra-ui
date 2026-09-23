import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import { UForm } from '../../form'
import UConditionEditor from '../condition-editor.vue'

describe('UConditionEditor 在 UForm 中的状态下发', () => {
  async function mountInForm() {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const formReadonly = ref(false)
    const formDisabled = ref(false)
    const model = ref({ condition: undefined as unknown })

    const App = defineComponent({
      setup() {
        return () =>
          h(
            UForm,
            { model: model.value, readonly: formReadonly.value, disabled: formDisabled.value },
            { default: () => h(UConditionEditor, { label: '条件', field: 'condition' }) }
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
      root: () => host.querySelector('.u-condition-editor'),
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

  it('UForm 的 readonly / disabled 下发到根节点', async () => {
    const ctx = await mountInForm()
    expect(ctx.root()?.className).not.toContain('is-readonly')

    ctx.formReadonly.value = true
    await ctx.settle()
    expect(ctx.root()?.className).toContain('is-readonly')

    ctx.formDisabled.value = true
    await ctx.settle()
    expect(ctx.root()?.className).toContain('is-disabled')

    ctx.unmount()
  })
})
