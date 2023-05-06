const theme = {
  base: {
    color1: '',
    color2: ''
  },
  text: {
    size: ''
  }
}

type Theme = typeof theme

export default function cssVar<
  K extends keyof Theme,
  KK extends keyof Theme[K]
>(key: K, key2: KK) {
  return
}
