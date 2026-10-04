import { type BEM } from '@veltra/utils'
import type { ComputedRef, InjectionKey, Ref } from 'vue'

/** 走马灯页上下文：页注册到容器换页数，取激活态渲染 aria */
export interface CarouselContext {
  cls: BEM<'carousel'>
  /** 已注册页的 uid，顺序即插槽渲染顺序 */
  itemUids: Ref<number[]>
  /** 当前激活页索引（已收敛到页数范围内） */
  current: ComputedRef<number>
  register: (uid: number) => void
  unregister: (uid: number) => void
}

export const CarouselDIKey: InjectionKey<CarouselContext> = Symbol('Carousel')
