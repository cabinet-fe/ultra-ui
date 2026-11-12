import { darkTheme } from './dark'

/** 玄墨（玄黑底 + 宣纸白字 + 朱砂点印，晕染式缓动），天生适合深色 */
export const xuanmoTheme = darkTheme.new({
  color: {
    primary: '#A8443A', // 矿物朱砂
    success: '#6B9C7B', // 黛绿
    warning: '#C6A261', // 缃黄
    danger: '#E0796F', // 绛红
    info: '#7B9BC0', // 黛蓝
    disabled: '#26262B',
    default: '#26262B'
  },
  bg: {
    color: {
      bottom: '#0A0A0C', // 玄黑
      middle: '#121215', // 松烟
      top: '#1A1A1E',
      hover: '#232228'
    }
  },
  'text-color': {
    title: '#F3F0E9', // 宣纸白
    main: '#DAD5CB',
    second: '#A19D94',
    placeholder: '#8A867D',
    assist: '#4C4A44',
    disabled: '#57544D'
  },
  // mutedColor 与卡片底对比 ~2.6:1，保证输入控件清晰可见
  border: { color: '#383634', mutedColor: '#4E4C47' },
  radius: { small: 3, default: 6, large: 10 },
  shadow: {
    color: '#00000085',
    x: 0,
    y: 3,
    blur: 14,
    spread: -2,
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.6)',
    lg: '0 10px 30px 0 rgba(0, 0, 0, 0.65), 0 3px 8px 0 rgba(0, 0, 0, 0.4)'
  },
  transition: {
    fast: '0.18s',
    normal: '0.3s',
    slow: '0.45s',
    ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)'
  }
})
