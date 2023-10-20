const fs = require('fs')
const { resolve } = require('path')

fs.readdirSync(resolve(__dirname, 'components')).forEach(fileName => {
  const filePath = resolve(__dirname, 'components', fileName)

  fs.copyFileSync(filePath, resolve(__dirname, 'components', fileName.replace('.ts', '.d.ts')))
  fs.rmSync(filePath)
})
