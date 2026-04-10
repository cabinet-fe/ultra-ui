// 生成一个初始化的组件
import { input } from '@inquirer/prompts'
import pc from 'picocolors'

import { renderIndexFile, renderStyleFile, renderTypeFile, renderVueFile } from './render-file'
const validTag = new Set([
  'div',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'button',
  'a',
  'span',
  'input',
  'textarea',
  'li',
  'ul',
  'ol',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'select',
  'option'
])

// 交互问题
const componentName = await input({
  message: '输入文件名(<component-name>):',
  validate(input) {
    if (!input) return '文件名不能为空'
    let isLower = /[a-z-]+/.test(input)
    if (!isLower) return '文件名称应满足英文小写，多个单词使用中划线拼接'
    return true
  },
  theme: { prefix: pc.green('必填') }
})

const rootElement = await input({
  message: '根元素(默认div):',
  validate(input) {
    if (input && !validTag.has(input)) return '元素名不合法'
    return true
  }
})

const componentDesc = await input({ message: '文件描述', theme: { prefix: pc.gray('选填') } })

const answer = { componentName, rootElement, componentDesc }

renderVueFile(answer)
renderTypeFile(answer)
renderIndexFile(answer)
renderStyleFile(answer)
