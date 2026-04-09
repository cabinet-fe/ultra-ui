import { buildStylesDesktop, buildStylesDirectives, buildStylesPackage } from './build-styles'

const phase = process.argv[2]

if (phase === 'desktop') await buildStylesDesktop()
else if (phase === 'directives') await buildStylesDirectives()
else if (phase === 'package') await buildStylesPackage()
else {
  console.error('用法: cli-build-styles.ts <desktop|directives|package>（由 index 依次子进程调用）')
  process.exit(1)
}
