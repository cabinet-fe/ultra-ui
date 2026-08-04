/**
 * Phase 5 Playwright e2e：工具栏图标化 / 分组 / 导出合并（chromium）
 * 需 playground：http://localhost:7788/sheet/index
 */
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/whj/.local/share/mise/installs/node/26.1.0/lib/node_modules/@playwright/cli/node_modules/playwright'
)

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const OUT = join(ROOT, '.playwright-cli')
mkdirSync(OUT, { recursive: true })

const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const EXPECTED_IDS = [
  'undo',
  'redo',
  'border',
  'fill-color',
  'merge',
  'unmerge',
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'font-color',
  'font-size',
  'align-left',
  'align-center',
  'align-right',
  'valign-top',
  'valign-middle',
  'valign-bottom',
  'wrap-text',
  'find',
  'import',
  'export'
]

const REMOVED = [
  'insert-rows',
  'insert-cols',
  'delete-rows',
  'delete-cols',
  'freeze',
  'freeze-row',
  'freeze-col',
  'unfreeze',
  'export-xlsx',
  'export-csv',
  'demo-insert-date',
  'demo-clear-selection'
]

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  const downloads = []
  page.on('download', (d) => downloads.push(d))

  await page.goto('http://localhost:7788/sheet/index', { waitUntil: 'networkidle' })
  await page.waitForSelector('.u-sheet__tool', { timeout: 15000 })
  await page.waitForFunction(() => window.__sheetDemo?.getSheet?.())

  const toolInfo = await page.evaluate(() => {
    const tools = [...document.querySelectorAll('.u-sheet__tool')].map((btn) => ({
      id: btn.getAttribute('data-tool-id'),
      text: (btn.textContent || '').trim(),
      title: btn.getAttribute('title') || '',
      hasIcon: !!btn.querySelector('.u-sheet__tool-icon'),
      disabled: btn.disabled
    }))
    const dividers = document.querySelectorAll('.u-sheet__toolbar-divider').length
    return { tools, dividers }
  })

  check(
    '工具栏全部图标按钮（无文字）',
    toolInfo.tools.every((t) => t.hasIcon && t.text === ''),
    `count=${toolInfo.tools.length}`
  )
  check(
    '工具 id 顺序符合目标分组',
    JSON.stringify(toolInfo.tools.map((t) => t.id)) === JSON.stringify(EXPECTED_IDS),
    toolInfo.tools.map((t) => t.id).join(',')
  )
  check('组间分隔符 = 4', toolInfo.dividers === 4, `got=${toolInfo.dividers}`)
  check(
    '已移除工具不出现',
    REMOVED.every((id) => !toolInfo.tools.some((t) => t.id === id))
  )

  // tooltip：悬停可用按钮（disabled 工具 UTip.disabled=true 不弹出）
  await page.locator('[data-tool-id="find"]').hover()
  await page.waitForSelector('.u-tip__content', { state: 'visible', timeout: 3000 }).catch(() => null)
  const tipText = await page
    .locator('.u-tip__content')
    .first()
    .textContent()
    .catch(() => '')
  const nativeTitle = await page.getAttribute('[data-tool-id="find"]', 'title')
  const tipOk = !!(tipText && tipText.includes('Ctrl')) || !!(nativeTitle && nativeTitle.includes('Ctrl'))
  check('tooltip 悬停可见', tipOk, `tip=${tipText || '-'} | title=${nativeTitle || '-'}`)

  // undo/redo disabled 联动
  const undoDisabled0 = await page.isDisabled('[data-tool-id="undo"]')
  check('初始 undo disabled', undoDisabled0)
  await page.evaluate(() => {
    window.__sheetDemo.sheet1.setCellValue({ row: 0, col: 5 }, 'phase5')
  })
  await page.waitForTimeout(50)
  const undoEnabled = !(await page.isDisabled('[data-tool-id="undo"]'))
  check('写入后 undo 可用', undoEnabled)
  await page.click('[data-tool-id="undo"]')
  await page.waitForTimeout(50)
  const undone = await page.evaluate(
    () => window.__sheetDemo.sheet1.getCellData({ row: 0, col: 5 }) === undefined
  )
  check('undo 生效', undone)

  // bold active
  await page.click('[data-tool-id="bold"]')
  await page.waitForTimeout(50)
  const boldActive = await page.evaluate(() =>
    document.querySelector('[data-tool-id="bold"]')?.classList.contains('is-active')
  )
  check('加粗 active 态', !!boldActive)

  // fill / border / find / import popups
  for (const [id, selector] of [
    ['fill-color', '.u-palette'],
    ['border', '.u-sheet__popup-preset'],
    ['find', '.u-sheet__find-input'],
    ['import', '.u-file-picker']
  ]) {
    await page.click(`[data-tool-id="${id}"]`)
    await page.waitForTimeout(50)
    const open = await page.$(`.u-sheet__popup ${selector}`)
    check(`${id} 弹层打开`, !!open)
    await page.click('.u-sheet__grid')
    await page.waitForTimeout(50)
  }

  // merge
  await page.evaluate(() => {
    const sheet = window.__sheetDemo.sheet1
    sheet.selectRange({ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } })
  })
  await page.waitForTimeout(50)
  await page.click('[data-tool-id="merge"]')
  await page.waitForTimeout(50)
  const merged = await page.evaluate(
    () => window.__sheetDemo.sheet1.getCellInfo({ row: 1, col: 1 }).kind === 'merged-covered'
  )
  check('合并生效', merged)
  await page.click('[data-tool-id="unmerge"]')
  await page.waitForTimeout(50)

  // export xlsx + csv
  downloads.length = 0
  await page.click('[data-tool-id="export"]')
  await page.waitForTimeout(50)
  const exportOpts = await page.$$eval('.u-sheet__export-option', (els) =>
    els.map((el) => el.textContent?.trim())
  )
  check(
    '导出面板两选项',
    JSON.stringify(exportOpts) ===
      JSON.stringify(['导出 Excel (.xlsx)', '导出 CSV (.csv)']),
    exportOpts.join(' | ')
  )

  const [xlsxDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.click('.u-sheet__export-option >> text=导出 Excel')
  ])
  const xlsxName = xlsxDownload.suggestedFilename()
  const xlsxPath = join(OUT, xlsxName)
  await xlsxDownload.saveAs(xlsxPath)
  check('导出 xlsx 下载', xlsxName.endsWith('.xlsx'), xlsxPath)

  await page.click('[data-tool-id="export"]')
  await page.waitForTimeout(50)
  const [csvDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.click('.u-sheet__export-option >> text=导出 CSV')
  ])
  const csvName = csvDownload.suggestedFilename()
  const csvPath = join(OUT, csvName)
  await csvDownload.saveAs(csvPath)
  check('导出 csv 下载', csvName.endsWith('.csv'), csvPath)

  // context menu freeze / insert regression（菜单构建已有单测；此处冒烟 setFrozen 联动）
  await page.evaluate(() => {
    window.__sheetDemo.sheet1.setFrozen(1, 0)
  })
  await page.waitForTimeout(50)
  const frozenOk = await page.evaluate(() => {
    const sheet = window.__sheetDemo.sheet1
    const table = window.__sheetDemo.getSheet().getGrid().getTable()
    return sheet.frozen.rows === 1 && table.frozenRowCount === 2
  })
  check('冻结模型→VTable 联动（菜单入口依赖阶段2）', frozenOk)

  await page.evaluate(() => {
    const sheet = window.__sheetDemo.sheet1
    const before = sheet.rows || 30
    sheet.insertRows(1, 2)
    window.__phase5Insert = { before, after: sheet.rows }
  })
  const insertOk = await page.evaluate(
    () => window.__phase5Insert.after === window.__phase5Insert.before + 2
  )
  check('插入行 API 可用（菜单入口依赖阶段2）', insertOk)

  await page.screenshot({ path: join(OUT, 'phase5-toolbar.png'), fullPage: false })

  await browser.close()

  const failed = results.filter((r) => !r.ok)
  writeFileSync(join(OUT, 'phase5-toolbar-results.json'), JSON.stringify(results, null, 2))
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  if (failed.length) {
    console.error('FAILED:', failed)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
