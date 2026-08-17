/** 活体球生命状态：驱动常态动画（平静 / 思考 / 输出） */
export type AiOrbStatus = 'idle' | 'thinking' | 'speaking'

/**
 * 瞬时表情：播放约 1-2s 后自动回到 status 驱动的常态。
 * - happy：成功 / 回答完毕 —— 先睁大眼睛，再弯眼大笑 + 点头
 * - shock：惊讶 —— 睁大眼睛 + 小嘴微张 + 轻微后仰
 * - frustrated：受挫（如工具调用失败）—— 闭紧眼睛 + 摇头 + 嘴角下撇
 */
export type AiOrbReaction = 'happy' | 'shock' | 'frustrated'

export interface AiOrbProps {
  /** 球体直径（px），默认 48 */
  size?: number
  /** 生命状态，默认 idle */
  status?: AiOrbStatus
}

export interface AiOrbEmits {
  /** 点击球体（球体同时会做 Q 弹反馈） */
  (e: 'click'): void
}

export interface AiOrbExposed {
  /** 播放一次瞬时表情（对应阶段性事件，如回答完毕 / 工具调用失败） */
  react: (reaction: AiOrbReaction) => void
}
