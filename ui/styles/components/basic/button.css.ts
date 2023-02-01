import { style } from '@vanilla-extract/css'
import { vars } from '../../theme/contract.css'

const buttonBase = style({
  display: 'inline-block'
})

type ButtonType = keyof typeof vars['color']

const buttonType: ButtonType[] = ['primary', 'info', 'success', 'warning', 'danger']

const button = buttonType.reduce((acc, cur) => {
  acc[cur] = style([buttonBase, {
    backgroundColor: vars.color[cur].default
  }])
  return acc
}, {} as Record<ButtonType, string>)

export { button }
