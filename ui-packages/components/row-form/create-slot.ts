import { defineComponent, h, ref } from 'vue'

//高阶组件渲染slot虚拟节点 绑定ref
export default slots => {
  // console.log(slots, 'slots')
  return defineComponent({
    setup(props, context) {
      // console.log(props, context)
      const slotRef = ref(null)
      const [defaultSlot] = slots?.header()
      // expose ref
      context.expose({
        slotRef
      })
      return () => h(defaultSlot)
    }
  })
}
