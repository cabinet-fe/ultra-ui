// 生成一个初始化的组件
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fs, question } from 'zx'

const UI_PATH = fileURLToPath(new URL('../ui', import.meta.url))

const typeMaps = (await fs.readdir(UI_PATH, { withFileTypes: true })).filter(dirent => {
  return dirent.isDirectory()
}).reduce((acc, cur) => {
  const descPath = resolve(UI_PATH, cur.name, 'desc.json')
  if (!fs.existsSync(descPath)) return
  let json = fs.readJSONSync(descPath, {
    encoding: 'utf-8'
  })

  console.log(json)

  // acc[json.name] = cur.name

  return acc
}, {} satisfies Record<string, any>)

console.log(typeMaps)
// const typeMaps = {
//   基础: 'basic',
//   数据: 'data',
//   反馈: 'feedback',
//   表单: 'form',
//   集成: 'integrated',
//   导航: 'navigation'
// } as const

// type TypeMap = typeof typeMaps

// await fs.readdir('')

// type ReverseObj<T extends { [key: string]: any }> = keyof {
//   [key in T[keyof T]]: keyof T
// }

// const componentType = typeMaps[
//   await question('组件类型', {
//     choices: Object.values(typeMaps)
//   })
// ] as ReverseObj<TypeMap>
