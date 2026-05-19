import { lightTheme } from './light'

export const heroLightTheme = lightTheme.new({
  color: {
    primary: '#7828c8', // purple
    success: '#17c964',
    warning: '#f5a524',
    danger: '#f31260',
    info: '#006fee',
    disabled: '#f4f4f5',
    default: '#f4f4f5'
  },
  border: { width: 2, color: '#dcdfe6', mutedColor: 'transparent' },
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
    color: 'rgba(0, 0, 0, 0.08)',
    x: 0,
    y: 4,
    blur: 14,
    spread: 0,
    emboss: '0 2px 4px 0 #0000000a,0 1px 2px 0 #0000000f,0 0 3px 0px #0000000f'
  }
})

export const heroDarkTheme = heroLightTheme.new({
  color: { primary: '#9353d3', disabled: '#27272a', default: '#27272a' },
  bg: {
    color: {
      bottom: '#000000',
      middle: '#18181b',
      top: '#27272a',
      hover: '#3f3f46',
      black: '#000000'
    }
  },
  border: { color: '#3f3f46', mutedColor: 'transparent' },
  'text-color': {
    title: '#ECEDEE',
    main: '#ECEDEE',
    second: '#A1A1AA',
    placeholder: '#71717A',
    assist: '#71717A',
    disabled: '#71717A',
    white: '#FFFFFF'
  },
  shadow: {
    color: 'rgba(0, 0, 0, 0.2)',
    x: 0,
    y: 4,
    blur: 14,
    spread: 0,
    emboss: '0 2px 4px 0 #0000000a,0 1px 2px 0 #0000000f,0 0 1px 0 #0000000f'
  }
})
