/** 活体球生命状态：驱动动画节奏（平静 / 思考 / 输出） */
export type AiOrbStatus = 'idle' | 'thinking' | 'speaking'

export interface AiOrbProps {
  /** 球体直径（px），默认 48 */
  size?: number
  /** 生命状态，默认 idle */
  status?: AiOrbStatus
}
