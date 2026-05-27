// 供 lint typeCheck 识别 import.meta.glob，无需在根目录安装 vite
interface ImportMeta {
  glob<T = unknown>(
    pattern: string,
    options?: {
      eager?: boolean
      import?: string
      query?: string | Record<string, string | number | boolean>
    }
  ): Record<string, () => Promise<T>>
}
