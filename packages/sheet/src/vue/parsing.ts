import type { InjectionKey, Ref } from 'vue'

/**
 * xlsx 解析中状态：import-popup 写入（worker 解析 3~5s 期间 true），
 * sheet.vue 读取并挂 v-loading。
 *
 * 用 provide/inject 而非 emit：选文件后面板关闭（v-if 卸载 import-popup），
 * 卸载组件的 emit 无法送达父组件（实测 parsing 收不到）；inject 拿到的是
 * 父作用域 ref 对象，卸载后修改 ref.value 仍驱动父组件响应式更新。
 */
export const SHEET_PARSING_KEY: InjectionKey<Ref<boolean>> = Symbol('sheet-parsing')

/** 解析进度（worker 分片构建期间 done/total；readXlsx 同步解析段无进度） */
export const SHEET_PARSE_PROGRESS_KEY: InjectionKey<Ref<{ done: number; total: number }>> =
  Symbol('sheet-parse-progress')
