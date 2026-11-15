import { darkTheme } from './dark'

/** 黑金（暖黑曜石底 + 香槟流金 + 流金微浮雕），天生适合深色 */
export const gildedTheme = darkTheme.new({
  color: {
    primary: '#D99B26', // 香槟流金
    success: '#84CC16', // 橄榄绿
    warning: '#F59E0B', // 赤铜琥珀
    danger: '#EF4444', // 绯红
    info: '#2DD4BF', // 暖青
    disabled: '#28211C',
    default: '#28211C'
  },
  bg: {
    color: {
      bottom: '#110E0C', // 暖黑曜石
      middle: '#191512',
      top: '#231D19',
      hover: '#2F2722'
    }
  },
  'text-color': {
    title: '#F7F3EB', // 暖象牙白
    main: '#DED6C8',
    second: '#A69B8A',
    placeholder: '#877C6C',
    assist: '#544B40',
    disabled: '#61574B'
  },
  border: { color: '#382F29', mutedColor: '#52443A' },
  radius: { small: 4, default: 6, large: 10 },
  shadow: {
    color: '#00000099',
    x: 0,
    y: 3,
    blur: 14,
    spread: -2,
    emboss: 'inset 0 1px 0 0 rgba(251, 191, 36, 0.14), 0 1px 3px 0 rgba(0, 0, 0, 0.55)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.6)',
    lg: '0 10px 30px 0 rgba(0, 0, 0, 0.68), 0 3px 8px 0 rgba(0, 0, 0, 0.45)'
  },
  button: { 'primary-text-color': '#191512' }
})
