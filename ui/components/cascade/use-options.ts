import { Tree } from "cat-kit/fe"
interface Options<O extends Record<string, any>> {
  options?: O[]
  labelKey?: string
  valueKey?: string
  childrenKey?: string
}

export function useOptions<O extends Record<string, any>>(props: Options<O>) {
  let options: Record<string, any> = []
  /**首次加载 */
  Tree.dft(
    props.options!,
    (node) => {
      console.log(node)
      options.push(node)
    },
    props.childrenKey
  )
  /**回显数据 */
  // props.options?.some((item) => {
  //   Tree.dft(item!, (node) => {
  //     console.log(node)
  //   })
  // })
  return {
    options,
  }
}
