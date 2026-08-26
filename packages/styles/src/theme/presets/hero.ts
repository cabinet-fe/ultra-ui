import { lightTheme } from './light'

/** HeroUI 风格，天生适合浅色 */
export const heroTheme = lightTheme.new({
  color: {
    primary: '#7828c8', // purple
    success: '#17c964',
    warning: '#f5a524',
    danger: '#f31260',
    info: '#006fee',
    disabled: '#f4f4f5',
    default: '#f4f4f5'
  },
  border: { width: 2, color: '#dcdfe6', mutedColor: '#e4e4e7' },
  'text-color': {
    title: '#11181C',
    main: '#11181C',
    second: '#71717A',
    placeholder: '#A1A1AA',
    assist: '#A1A1AA',
    disabled: '#A1A1AA',
    white: '#FFFFFF'
  },
  radius: { small: 8, default: 12, large: 14 },
  shadow: {
    color: '#00000014',
    x: 0,
    y: 4,
    blur: 14,
    spread: 0,
    emboss: '0 2px 4px 0 #0000000a,0 1px 2px 0 #0000000f,0 0 3px 0px #0000000f'
  },
  button: { 'default-bg': '#ebebec' }
})
