// 生成一个初始化的组件
import inquirer from 'inquirer'
import { renderIndexFile, renderStyleFile, renderTypeFile, renderVueFile } from './render-file'
import pc from 'picocolors'
import type { ComponentCtx } from './type'

const validTag = new Set([
  'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'button', 'a', 'span', 'input', 'textarea',
  'li', 'ul', 'ol', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'select', 'option'
])

// 交互问题
const answer = await inquirer.prompt<ComponentCtx>([
  {
    type: 'input',
    name: 'componentName',
    message: '输入文件名(<component-name>):',
    validate(input) {
      if (!input) return '文件名不能为空'
      let isLower = /[a-z-]+/.test(input)
      if (!isLower) return '文件名称应满足英文小写，多个单词使用中划线拼接'
      return true
    },
    prefix: pc.green('必填')
  },
  {
    type: 'input',
    name: 'rootElement',
    message: '根元素(默认div):',
    validate(input) {
      if (input && !validTag.has(input)) return '元素名不合法'
      return true
    }
  },
  {
    type: 'input',
    name: 'componentDesc',
    message: '文件描述:',
    prefix: pc.gray('选填')
  }
])

renderVueFile(answer)
renderTypeFile(answer)
renderIndexFile(answer)
renderStyleFile(answer)
