import { TreeNode } from 'cat-kit/fe'
// import { reactive } from 'vue'

export class CustomTreeNode<
  Val extends Record<string, any>
> extends TreeNode<Val> {
  override parent: CustomTreeNode<Val> | null = null

  override children?: CustomTreeNode<Val>[] = undefined

  visible = true
  expanded = true
  loading = false
  loaded = false

  // props = reactive({
  //   visible: true,
  //   expanded: true,
  //   loading: false,
  //   loaded: false
  // })

  constructor(val: Val, index: number, parent?: any) {
    super(val, index)
    if (parent) {
      this.parent = parent
    }
  }
}
