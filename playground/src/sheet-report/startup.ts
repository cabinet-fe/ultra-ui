import type { ReportTemplate } from '@veltra/sheet'

export const LAST_TEMPLATE_ID_KEY = 'ultra-ui:sheet-report:lastTemplateId'

export interface NamedTemplateRecord {
  id: string
  name: string
  template: ReportTemplate
}

export type StartupTemplateSource = 'named' | 'seed' | 'empty'

export interface StartupTemplateResult {
  source: StartupTemplateSource
  template?: ReportTemplate
  activeTemplateId: string | null
  templateName: string
}

export function readLastTemplateId(storage: Pick<Storage, 'getItem'>): string | null {
  const value = storage.getItem(LAST_TEMPLATE_ID_KEY)
  return value && value.trim() ? value : null
}

export function writeLastTemplateId(
  storage: Pick<Storage, 'setItem' | 'removeItem'>,
  id: string | null
): void {
  if (!id) storage.removeItem(LAST_TEMPLATE_ID_KEY)
  else storage.setItem(LAST_TEMPLATE_ID_KEY, id)
}

/**
 * 启动时模板优先级：上次打开的命名模板 → 工作区种子空白网格 → 空设计态。
 * 命名模板拉取失败时 `namedTemplate` 传 null，退回种子。
 */
export function resolveStartupTemplate(options: {
  lastTemplateId: string | null
  namedTemplate: NamedTemplateRecord | null
  seedTemplate: ReportTemplate | undefined
}): StartupTemplateResult {
  const { lastTemplateId, namedTemplate, seedTemplate } = options
  if (lastTemplateId && namedTemplate && namedTemplate.id === lastTemplateId) {
    return {
      source: 'named',
      template: namedTemplate.template,
      activeTemplateId: namedTemplate.id,
      templateName: namedTemplate.name
    }
  }
  if (seedTemplate) {
    return {
      source: 'seed',
      template: seedTemplate,
      activeTemplateId: null,
      templateName: '未命名模板'
    }
  }
  return { source: 'empty', activeTemplateId: null, templateName: '未命名模板' }
}
