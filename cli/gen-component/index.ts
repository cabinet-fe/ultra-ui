// 生成一个初始化的组件
// import { resolve } from 'node:path'
import inquirer from 'inquirer'
// import fs from 'fs/promises'
// import { existsSync, readFileSync } from 'node:fs'
import { renderIndexFile, renderStyleFile, renderTypeFile, renderVueFile } from './render-file'
// import { UI_PATH } from '../shared'
import pc from 'picocolors'
import type { ComponentCtx } from './type'

// // 组件类型目录
// const componentDirs = await fs.readdir(UI_PATH, {
//   withFileTypes: true,
//   encoding: 'utf-8'
// })

// // 组件类型选项
// const componentTypeChoices = componentDirs
//   .filter(dirent => {
//     return dirent.isDirectory()
//   })
//   .map(dirent => {
//     const descPath = resolve(UI_PATH, dirent.name, 'desc.json')

//     if (!existsSync(descPath)) return null
//     let json = JSON.parse(readFileSync(descPath, 'utf-8'))

//     return {
//       name: json.name,
//       value: dirent.name,
//       short: json.name
//     }
//   })
//   .filter(item => !!item)

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
