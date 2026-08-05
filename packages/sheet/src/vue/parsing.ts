import type { InjectionKey, Ref } from 'vue'

/**
 * xlsx 解析中状态（历史 inject key，现由 import-file 直接写 sheet.vue 持有的 ref）。
 * 保留导出以便测试或扩展仍可 provide/inject。
 */
export const SHEET_PARSING_KEY: InjectionKey<Ref<boolean>> = Symbol('sheet-parsing')

/** 解析进度（worker 分片构建期间 done/total；readXlsx 同步解析段无进度） */
export const SHEET_PARSE_PROGRESS_KEY: InjectionKey<Ref<{ done: number; total: number }>> =
  Symbol('sheet-parse-progress')
