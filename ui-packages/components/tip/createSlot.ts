import {defineComponent} from "vue"

// 定义一个类型，用于表示处理特定事件的函数
type CallFun = (vnodeEl: HTMLElement) => void

// 定义一个类型，包含三个处理事件的函数
type Funs = Record<
  "handleMouseOver" | "handleMouseOut" | "handleClick",
  CallFun
>

// 创建并导出一个工厂函数，用于创建 Vue 组件
export default function createSlot({
  handleMouseOver,
  handleMouseOut,
  handleClick,
}: Funs) {
  return defineComponent({
    // 定义组件的属性
    props: ["vnode"],
    // 设置组件
    setup(props, ctx) {
      // 这里可以添加其他逻辑
    },
    // 组件挂载后执行的生命周期钩子函数
    mounted() {
      // 这里可以添加一些初始化逻辑
    },
    // 渲染函数，用于动态渲染组件的子节点
    render(props: any, ctx: any) {
      // 返回传入的 vnode，实现动态渲染
      return props.vnode
    },
  })
}
