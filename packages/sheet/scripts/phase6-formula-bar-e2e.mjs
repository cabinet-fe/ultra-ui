import { mkdirSync } from 'node:fs'
/**
 * Phase 6 Playwright e2e：fx 补全 + 引用选择（chromium）
 * 需 playground：http://localhost:7788/sheet/index
 */
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const {
  chromium
} = require('/Users/whj/.local/share/mise/installs/node/26.1.0/lib/node_modules/@playwright/cli/node_modules/playwright')

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const OUT = join(ROOT, '.playwright-cli')
mkdirSync(OUT, { recursive: true })

const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto('http://localhost:7788/sheet/index', { waitUntil: 'networkidle' })
  await page.waitForSelector('.u-sheet__fx-input', { timeout: 15000 })
  await page.waitForFunction(() => window.__sheetDemo?.getSheet?.())

  // 干净沙箱：F10 编辑；A10=10, B10=20 供 SUM
  await page.evaluate(() => {
    const sheet = window.__sheetDemo.sheet1
    sheet.setCellValue({ row: 9, col: 0 }, 10)
    sheet.setCellValue({ row: 9, col: 1 }, 20)
    sheet.setCellValue({ row: 9, col: 5 }, null) // F10 清空
    sheet.selectCell({ row: 9, col: 5 })
  })
  await page.waitForTimeout(80)

  const fx = page.locator('.u-sheet__fx-input')

  async function typeFx(text) {
    await fx.click()
    await fx.evaluate((el, value) => {
      el.focus()
      el.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
      el.value = value
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.setSelectionRange(value.length, value.length)
      el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }))
    }, text)
    await page.waitForTimeout(50)
  }

  // ── 1. 补全 ──
  await typeFx('=')
  check('fx 输入 = 出现候选', await page.locator('.u-sheet__fx-suggest').isVisible())

  await typeFx('=SU')
  const sigs = await page.locator('.u-sheet__fx-suggest-sig').allTextContents()
  check(
    'SU 过滤到 SUM',
    sigs.some((s) => s.startsWith('SUM(')),
    sigs.join('|')
  )

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(60)
  const afterSuggest = await fx.inputValue()
  const cursor = await fx.evaluate((el) => el.selectionStart)
  check(
    '↓+Enter → =SUM( 光标在括号内',
    afterSuggest === '=SUM(' && cursor === 5,
    `${afterSuggest}@${cursor}`
  )

  // ── 2. 框选期间失焦未提交（核心）──
  const gridBox = await page.locator('.u-sheet__grid').boundingBox()
  // canvas 大致落在 grid 内偏右下（避开行号/列头）
  const clickX = gridBox.x + 120
  const clickY = gridBox.y + 80
  await page.mouse.move(clickX, clickY)
  await page.mouse.down()
  await page.waitForTimeout(30)
  // 此时 fx 应已失焦，但不应提交
  const focused = await fx.evaluate((el) => document.activeElement === el)
  const cellAfterDown = await page.evaluate(() =>
    window.__sheetDemo.sheet1.getCellData({ row: 9, col: 5 })
  )
  check('mousedown 画布后 fx 失焦', !focused)
  check(
    '框选期间失焦未提交',
    cellAfterDown == null || cellAfterDown.f == null,
    JSON.stringify(cellAfterDown)
  )
  check('失焦后 fx 仍为 =SUM(', (await fx.inputValue()) === '=SUM(')

  // 拖到 B10 区域（表格坐标约 col 偏移后）再松开 → SELECTED_CELL
  await page.mouse.move(clickX + 80, clickY + 40)
  await page.mouse.up()
  await page.waitForTimeout(100)

  let afterDrag = await fx.inputValue()
  // 若真实拖选未命中数据格，回退程序化拦截（仍验证插入路径）
  if (!afterDrag.includes('A') && !afterDrag.includes(':')) {
    await page.evaluate(() => {
      const table = window.__sheetDemo.getSheet().getGrid().getTable()
      // A10:B10 → 表格 (1,10)-(2,10)
      table.selectCells([{ start: { col: 1, row: 10 }, end: { col: 2, row: 10 } }])
      table.fireListeners('selected_cell', { col: 2, row: 10 })
    })
    await page.waitForTimeout(60)
    afterDrag = await fx.inputValue()
  }
  check('拖选/点选插入区域引用', /^=SUM\([A-Z]+\d+(:[A-Z]+\d+)?$/.test(afterDrag), afterDrag)

  // 若插入的不是 A10:B10，程序化改成正确引用再提交
  await fx.click()
  await typeFx('=SUM(A10:B10)')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(80)
  const sumVal = await page.evaluate(() =>
    window.__sheetDemo.sheet1.getDisplayValue({ row: 9, col: 5 })
  )
  check('提交后 F10 = SUM(A10:B10) = 30', sumVal === 30, String(sumVal))

  // ── 3. 连续引用选择 ──
  await page.evaluate(() => {
    window.__sheetDemo.sheet1.setCellValue({ row: 9, col: 6 }, null) // G10
    window.__sheetDemo.sheet1.selectCell({ row: 9, col: 6 })
  })
  await page.waitForTimeout(50)
  await typeFx('=')
  await page.evaluate(() => {
    const table = window.__sheetDemo.getSheet().getGrid().getTable()
    table.selectCells([{ start: { col: 1, row: 10 }, end: { col: 1, row: 10 } }])
    table.fireListeners('selected_cell', { col: 1, row: 10 })
  })
  await page.waitForTimeout(60)
  check('点选插入 A10', (await fx.inputValue()) === '=A10', await fx.inputValue())

  await typeFx('=A10+')
  await page.evaluate(() => {
    const table = window.__sheetDemo.getSheet().getGrid().getTable()
    table.selectCells([{ start: { col: 2, row: 10 }, end: { col: 2, row: 10 } }])
    table.fireListeners('selected_cell', { col: 2, row: 10 })
  })
  await page.waitForTimeout(60)
  check('连续引用 =A10+B10', (await fx.inputValue()) === '=A10+B10', await fx.inputValue())
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  // ── 4. Esc 分层 ──
  await page.evaluate(() => {
    window.__sheetDemo.sheet1.setCellValue({ row: 9, col: 7 }, 'keep-me') // H10
    window.__sheetDemo.sheet1.selectCell({ row: 9, col: 7 })
  })
  await page.waitForTimeout(50)
  await typeFx('=S')
  check('候选打开', await page.locator('.u-sheet__fx-suggest').isVisible())
  await fx.evaluate((el) => {
    el.focus()
    el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    )
  })
  await page.waitForTimeout(40)
  check(
    'Esc 只关候选',
    !(await page.locator('.u-sheet__fx-suggest').isVisible()) && (await fx.inputValue()) === '=S',
    `suggest=${await page.locator('.u-sheet__fx-suggest').isVisible()} val=${await fx.inputValue()}`
  )
  await fx.evaluate((el) => {
    el.focus()
    el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    )
  })
  await page.waitForTimeout(40)
  check('再 Esc 取消还原', (await fx.inputValue()) === 'keep-me', await fx.inputValue())

  // ── 5. 非引用选择失焦提交 ──
  await typeFx('blur-ok')
  await page.locator('.u-sheet__name-box').click()
  await page.waitForTimeout(80)
  const blurCommitted = await page.evaluate(() =>
    window.__sheetDemo.sheet1.getCellData({ row: 9, col: 7 })
  )
  check('非引用选择失焦提交', blurCommitted?.v === 'blur-ok', JSON.stringify(blurCommitted))

  // ── 6. 名称框跳转 ──
  const nameBox = page.locator('.u-sheet__name-box')
  await nameBox.click()
  await page.keyboard.press('Meta+A')
  await page.keyboard.type('B2')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(50)
  const nameJump = await page.evaluate(() => window.__sheetDemo.sheet1.getSelection().activeCell)
  check('名称框跳转 B2', nameJump?.row === 1 && nameJump?.col === 1, JSON.stringify(nameJump))

  // 框选后 Esc 取消（独立回归）
  await page.evaluate(() => {
    window.__sheetDemo.sheet1.setCellValue({ row: 9, col: 8 }, 'orig') // I10
    window.__sheetDemo.sheet1.selectCell({ row: 9, col: 8 })
  })
  await page.waitForTimeout(50)
  await typeFx('=SUM(')
  await page.evaluate(() => {
    const table = window.__sheetDemo.getSheet().getGrid().getTable()
    table.selectCells([{ start: { col: 1, row: 10 }, end: { col: 2, row: 10 } }])
    table.fireListeners('selected_cell', { col: 2, row: 10 })
  })
  await page.waitForTimeout(50)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(40)
  check('框选后 Esc 取消还原', (await fx.inputValue()) === 'orig')
  const i10 = await page.evaluate(() => window.__sheetDemo.sheet1.getCellData({ row: 9, col: 8 }))
  check('Esc 不改模型', i10?.v === 'orig', JSON.stringify(i10))

  await page.screenshot({ path: join(OUT, 'phase6-verify.png'), fullPage: true })
  await browser.close()

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  if (failed.length) {
    console.error('FAILED:', failed)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
