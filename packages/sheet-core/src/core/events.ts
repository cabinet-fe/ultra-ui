/**
 * 包内轻量类型化事件发射器（core 内部基建，不对外导出实现细节）。
 */

export type EventHandler<T> = (payload: T) => void

export class TypedEventEmitter<EventMap extends Record<string, unknown>> {
  private handlers = new Map<keyof EventMap, Set<EventHandler<EventMap[keyof EventMap]>>>()

  /** 订阅事件，返回取消订阅函数 */
  on<K extends keyof EventMap>(type: K, handler: EventHandler<EventMap[K]>): () => void {
    let set = this.handlers.get(type)
    if (!set) {
      set = new Set()
      this.handlers.set(type, set)
    }
    set.add(handler as EventHandler<EventMap[keyof EventMap]>)
    return () => this.off(type, handler)
  }

  off<K extends keyof EventMap>(type: K, handler: EventHandler<EventMap[K]>): void {
    this.handlers.get(type)?.delete(handler as EventHandler<EventMap[keyof EventMap]>)
  }

  emit<K extends keyof EventMap>(type: K, payload: EventMap[K]): void {
    const set = this.handlers.get(type)
    if (!set) return
    // Set 迭代天然容忍遍历中取消订阅
    for (const handler of set) {
      ;(handler as EventHandler<EventMap[K]>)(payload)
    }
  }
}
