import { VNode } from "vue"

/** 虚拟dom渲染组件属性 */
export interface NodeRenderProps {
  content: null | undefined | Array<VNode> | VNode
}

/** 虚拟dom渲染暴露的属性和方法 */
export interface NodeRenderExposed {}
