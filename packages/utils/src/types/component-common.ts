export type ComponentSize = 'small' | 'default' | 'large'

export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface ComponentProps {
  size?: ComponentSize
}

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

export interface ValidateRule {
  required?: boolean | string
  length?: number | [number, string]
  min?: number | [number, string]
  max?: number | [number, string]
  minLen?: number | [number, string]
  maxLen?: number | [number, string]
  match?: RegExp | [RegExp, string] | string
  preset?: PresetRule
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

export interface FormComponentProps extends ComponentProps {
  tips?: string
  /** 所占列的大小 */
  span?:
    | number
    | 'full'
    | ({
        [key in BreakpointName]?: 'full' | number
      } & { default: number | 'full' })
  label?: string
  field?: string
  disabled?: boolean
  readonly?: boolean
  rules?: ValidateRule
}

export interface PropsWithServerQuery {
  api?: string
  query?: Record<string, any>
}
