import type { ExpressionEditorProps } from "@ui/types";
import type { BEM } from "@ui/utils";
import type { InjectionKey } from "vue";
import type { LexicalEditor } from "lexical";

export const ExpressionEditorDIKey: InjectionKey<{
  /** 组件的 BEM 类名 */
  cls: BEM<"expression-editor">;
  /** 组件的 props */
  editorProps: ExpressionEditorProps;
  /** 编辑器实例 */
  editor: LexicalEditor;
  /** 更新变量节点 */
  updateVariableNode: (oldValue: string, newValue: string) => void;
}> = Symbol("ExpressionEditorDIKey");
