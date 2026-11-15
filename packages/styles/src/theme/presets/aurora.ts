import { darkTheme } from './dark'

/** 极光（极夜深林底 + 极光青翠 + 冰晶折光浮雕与毛玻璃滤镜），天生适合深色 */
export const auroraTheme = darkTheme.new({
  color: {
    primary: '#14B8A6', // 极光青翠
    success: '#22C55E', // 极光绿
    warning: '#EAB308', // 极光黄
    danger: '#F43F5E', // 珊瑚红
    info: '#38BDF8', // 冰川蓝
    disabled: '#162C34',
    default: '#162C34'
  },
  bg: {
    color: {
      bottom: '#071114', // 极夜深林
      middle: '#0C1B20',
      top: '#12262E',
      hover: '#1A3540'
    },
    filter: { blur: 'blur(16px)', saturate: 'saturate(180%)' }
  },
  'text-color': {
    title: '#ECFEFF', // 冰晶白
    main: '#CCFBF1',
    second: '#7DD3C0',
    placeholder: '#5EA89A',
    assist: '#33625B',
    disabled: '#3E6E68'
  },
  border: { color: '#1F424D', mutedColor: '#2D5C6B' },
  radius: { small: 6, default: 10, large: 14 },
  shadow: {
    color: '#0000008C',
    x: 0,
    y: 4,
    blur: 20,
    spread: 0,
    emboss: 'inset 0 1px 0 0 rgba(153, 246, 228, 0.16), 0 2px 6px 0 rgba(0, 0, 0, 0.45)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
    lg: '0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 0 20px 0 rgba(20, 184, 166, 0.14)'
  }
})
