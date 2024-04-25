import pico from 'picocolors'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const msgPath = path.resolve('.git/COMMIT_EDITMSG')
const msg = readFileSync(msgPath, 'utf-8').trim()

const commitRE =
  /^(feat|fix|docs|dx|style|refactor|perf|build|ci|chore|types|release)(\(.+\))?: .{1,50}/

if (!commitRE.test(msg)) {
  console.log(msg)
  console.error(
    `  ${pico.white(pico.bgRed(' ERROR '))} ${pico.red(
      `提交格式不正确。`
    )}
    `
  )
  process.exit(1)
}
