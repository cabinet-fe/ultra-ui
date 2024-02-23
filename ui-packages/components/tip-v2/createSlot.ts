import {defineComponent} from "vue"
type CallFun = (vnodeEl: HTMLElement) => void
type Funs = Record<
  "handleMouseOver" | "handleMouseOut" | "handleClick",
  CallFun
>
export default function createSlot({
  handleMouseOver,
  handleMouseOut,
  handleClick,
}: Funs) {
  return defineComponent({
    props: ["vnode"],
    setup(props, ctx) {},
    mounted() {
    },
    render(props: any, ctx: any) {
      return props.vnode
    },
  })
}
