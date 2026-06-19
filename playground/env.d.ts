// 供 lint typeCheck 识别 import.meta.glob / import.meta.env，无需在根目录安装 vite
interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  glob<T = unknown>(
    pattern: string,
    options?: {
      eager?: boolean
      import?: string
      query?: string | Record<string, string | number | boolean>
    }
  ): Record<string, () => Promise<T>>
}
