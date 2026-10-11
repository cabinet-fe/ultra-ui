import type { AiProviderConfig, ComponentProps, DeconstructValue } from '@veltra/utils'

/** AI 按钮变体 */
export type AiButtonVariant = 'default' | 'pre-input'

/** AI 图标按钮组件属性 */
export interface AiButtonProps extends ComponentProps {
  /**
   * 服务商配置：字段级覆盖 `useConfig` 全局 `ai` 配置
   * （实例字段 > 全局字段 > 默认值，`stream` 缺省 false）
   */
  provider?: Partial<AiProviderConfig>
  /** 系统提示词，存在时作为首条 system 消息 */
  systemPrompt?: string
  /** 用户提示词，作为 user 消息 */
  prompt?: string
  /**
   * 变体
   * - `default`：点击即发起请求
   * - `pre-input`：点击展开气泡，经 `#pre-input` 插槽收集补充输入，确认后才发起请求
   * @default 'default'
   */
  variant?: AiButtonVariant
}

/** AI 图标按钮组件定义的事件 */
export interface AiButtonEmits {
  /** 生成成功：一次性为完整文本，流式为全部增量拼接的完整文本 */
  (event: 'success', text: string): void
  /** 生成失败：网络错误、非 2xx 响应、流中断（组件不自动提示） */
  (event: 'error', error: Error): void
  /** 流式文本增量 */
  (event: 'delta', chunk: string): void
  /** pre-input 变体确认（随后发起请求） */
  (event: 'confirm'): void
  /** pre-input 变体取消（不发起请求） */
  (event: 'cancel'): void
}

/** AI 图标按钮组件暴露的属性和方法(组件内部使用) */
export interface _AiButtonExposed {}

/** AI 图标按钮组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AiButtonExposed = DeconstructValue<_AiButtonExposed>
