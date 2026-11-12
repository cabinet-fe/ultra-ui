import { mixColor } from '../helper'
import { lightTheme } from './light'

/** 报刊（新闻纸底 + 油墨黑 + 报头红点缀，细栏线、零圆角、墨线浮层），天生适合浅色 */
export const newspaperTheme = lightTheme.new({
  color: {
    primary: '#1E1C18', // 油墨黑
    success: '#3E6B47', // 墨绿
    warning: '#96660D', // 琥珀墨
    danger: '#B3352C', // 报头红
    info: '#35598F', // 靛青
    disabled: '#ECEAE2',
    default: '#ECEAE2'
  },
  bg: { color: { bottom: '#ECEBE5', middle: '#F4F3ED', top: '#FCFBF7', hover: '#E0DED4' } },
  'text-color': {
    title: '#171512', // 油墨
    main: '#2C2925',
    second: '#5F5B54',
    placeholder: '#757066',
    assist: '#C6C2B8',
    disabled: '#9E9A91'
  },
  border: { width: 1, color: '#D9D6CC', mutedColor: '#8F8B80' }, // 细栏线
  radius: { small: 0, default: 0, large: 0 },
  shadow: {
    color: 'rgba(23, 21, 18, 0.4)',
    x: 0,
    y: 1,
    blur: 2,
    spread: 0,
    sm: '0 1px 2px 0 rgba(23, 21, 18, 0.2)',
    // 浮层：1px 墨线压边 + 极淡纸影，像一叠刚印好的纸
    lg: '0 1px 0 0 #171512, 0 12px 24px 0 rgba(23, 21, 18, 0.12)'
  },
  transition: { fast: '0.06s', normal: '0.1s', slow: '0.15s' },
  nav: {
    // 油墨侧栏（深变体）：油墨 + 报头红微调暖；浅变体回落到新闻纸底（bg middle）
    variants: { dark: { 'bg-color': mixColor('#171512', '#B3352C', 0.15) } }
  }
})
