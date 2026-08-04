/**
 * Phase 8 Playwright e2e：弹层面板锚点跟随触发按钮（UDropdown + floating-ui，chromium）
 * 需 playground：http://localhost:7788/sheet/index
 *
 * 验证点：
 * - 面板左缘对齐触发按钮（alignment: start），top = 按钮底 + 6px offset
 * - 不同按钮打开 → 面板跟随不同位置
 * - 窄容器下右侧按钮打开 → 面板不超出可视区（flip/shift 边界处理）
 * - 工具栏滚动 → 面板自动关闭（usePop 监听触发元素 scroll）
 * - 点击面板外 / 再点同按钮 → 关闭
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

const CANDIDATES = [
  process.env.PLAYWRIGHT_MODULE_PATH,
  '/Users/whj/.local/share/mise/installs/node/26.1.0/lib/node_modules/@playwright/cli/node_modules/playwright',
  join(process.env.LOCALAPPDATA || '', 'Temp', 'sheet-check', 'node_modules', 'playwright')
].filter(Boolean)

const PW_PATH = CANDIDATES.find((p) => p && existsSync(p))
if (!PW_PATH) {
  console.error('未找到 playwright 模块，请设置 PLAYWRIGHT_MODULE_PATH 指向 playwright 包目录')
  process.exit(1)
}
const { chromium } = require(PW_PATH)

/** 探测 ms-playwright 缓存中已下载的 chromium 完整版可执行文件（版本漂移兜底） */
function findChromiumExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1067', 'chrome-win', 'chrome.exe'),
    join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1055', 'chrome-win', 'chrome.exe'),
    '/Users/whj/Library/Caches/ms-playwright/chromium-1067/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    '/Users/whj/Library/Caches/ms-playwright/chromium-1055/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
  ]
  return candidates.find((p) => p && existsSync(p))
}

const CHROMIUM_PATH = findChromiumExecutable()

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const OUT = join(ROOT, '.playwright-cli')
mkdirSync(OUT, { recursive: true })

const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const URL = 'http://localhost:7788/sheet/index'

async function main() {
  const launchOptions = CHROMIUM_PATH ? { executablePath: CHROMIUM_PATH } : {}
  const browser = await chromium.launch(launchOptions)
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await page.goto(URL)
    await page.waitForSelector('.u-sheet__toolbar')
    await page.waitForTimeout(600)

    const popupBox = () =>
      page.locator('#pop-container .u-sheet__popup').boundingBox()
    const toolBox = (id) => page.locator(`[data-tool-id="${id}"]`).boundingBox()

    // ─── 场景 1：面板左缘对齐触发按钮（alignment: start + offset 6）────
    await page.locator('[data-tool-id="fill-color"]').click()
    await page.waitForSelector('#pop-container .u-sheet__popup')
    await page.waitForTimeout(300)
    let box = await popupBox()
    let btn = await toolBox('fill-color')
    check(
      'fill-color 面板左缘对齐按钮',
      !!box && !!btn && Math.abs(box.x - btn.x) <= 2,
      `popup.x=${box?.x?.toFixed(1)} btn.x=${btn?.x?.toFixed(1)}`
    )
    check(
      'fill-color 面板位于按钮正下方（offset 6px）',
      !!box && !!btn && Math.abs(box.y - (btn.y + btn.height) - 6) <= 3,
      `popup.y=${box?.y?.toFixed(1)} btn.bottom=${btn ? (btn.y + btn.height).toFixed(1) : ''}`
    )
    check('面板渲染 UPalette', (await page.locator('#pop-container .u-palette').count()) > 0)

    // ─── 场景 2：不同按钮 → 面板跟随 ─────────────────────────────
    await page.locator('[data-tool-id="fill-color"]').click() // 同按钮 toggle 关闭
    await page.waitForTimeout(300)
    check('再点同按钮关闭面板', (await page.locator('#pop-container .u-sheet__popup').count()) === 0)

    await page.locator('[data-tool-id="font-color"]').click()
    await page.waitForSelector('#pop-container .u-sheet__popup')
    await page.waitForTimeout(300)
    box = await popupBox()
    btn = await toolBox('font-color')
    check(
      'font-color 面板左缘对齐按钮（位置跟随）',
      !!box && !!btn && Math.abs(box.x - btn.x) <= 2,
      `popup.x=${box?.x?.toFixed(1)} btn.x=${btn?.x?.toFixed(1)}`
    )

    // ─── 场景 3：窄容器下右侧按钮 → 面板不超出可视区（flip/shift 边界）─────
    // 先关闭当前面板
    await page.mouse.click(10, 500) // 点面板外关闭
    await page.waitForTimeout(300)
    await page.evaluate(() => {
      const sheet = document.querySelector('.sheet-demo__sheet')
      if (sheet) sheet.style.width = '320px'
    })
    await page.waitForTimeout(400)
    // export 按钮已滚出可视区：force 点击（不触发自动滚动，保持工具栏位置）
    await page.locator('[data-tool-id="export"]').click({ force: true })
    await page.waitForTimeout(400)
    box = await popupBox()
    const viewport = page.viewportSize()
    check(
      '窄容器下 export 面板不超出视口右缘（flip/shift 生效）',
      !!box && box.x + box.width <= viewport.width + 1,
      `right=${box ? (box.x + box.width).toFixed(1) : ''} vw=${viewport.width}`
    )
    check('窄容器下 export 面板仍在视口内', !!box && box.x >= 0 && box.y >= 0)

    // ─── 场景 4：工具栏滚动 → 面板自动关闭（usePop scroll 监听）────
    // 注意：场景 3 的 force click 会把工具栏滚到底（playwright 自动滚动），
    // 此时 wheel 无法再滚动（scrollLeft 已到上限，scroll 事件不触发），
    // 故用 JS 回滚触发 scroll 事件验证「滚动自动关闭」
    await page
      .locator('.u-sheet__toolbar-scroll')
      .evaluate((el) => (el.scrollLeft = 0))
    await page.waitForTimeout(600)
    check(
      '工具栏滚动后面板自动关闭',
      (await page.locator('#pop-container .u-sheet__popup').count()) === 0
    )

    // ─── 场景 5：点击面板外关闭 ───────────────────────────────
    await page.locator('[data-tool-id="border"]').click()
    await page.waitForSelector('#pop-container .u-sheet__popup')
    await page.waitForTimeout(300)
    await page.locator('.u-sheet__grid').click({ position: { x: 200, y: 200 } })
    await page.waitForTimeout(300)
    check('点击面板外关闭', (await page.locator('#pop-container .u-sheet__popup').count()) === 0)

    await page.screenshot({ path: join(OUT, 'phase8-popup-anchor.png'), fullPage: false })

    await browser.close()

    const failed = results.filter((r) => !r.ok)
    writeFileSync(join(OUT, 'phase8-popup-anchor-results.json'), JSON.stringify(results, null, 2))
    console.log(`\n${results.length - failed.length}/${results.length} passed`)
    if (failed.length) {
      console.error('FAILED:', failed)
      process.exit(1)
    }
  } catch (err) {
    await browser.close()
    throw err
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
