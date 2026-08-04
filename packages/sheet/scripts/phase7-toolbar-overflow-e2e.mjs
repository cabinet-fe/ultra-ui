/**
 * Phase 7 Playwright e2e：工具栏单行溢出滚动（窄窗口箭头导航 / 滚轮横滚，chromium）
 * 需 playground：http://localhost:7788/sheet/index
 *
 * playwright 模块解析：优先环境变量 PLAYWRIGHT_MODULE_PATH，其次探测常见安装位置
 * （macOS mise @playwright/cli / Windows Temp 内临时安装）。
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

const CANDIDATES = [
  process.env.PLAYWRIGHT_MODULE_PATH,
  // macOS：mise 安装的 @playwright/cli 内嵌 playwright
  '/Users/whj/.local/share/mise/installs/node/26.1.0/lib/node_modules/@playwright/cli/node_modules/playwright',
  // Windows：本地临时安装（见会话历史）
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
    // Windows
    join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1067', 'chrome-win', 'chrome.exe'),
    join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1055', 'chrome-win', 'chrome.exe'),
    // macOS
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
    await page.waitForTimeout(600) // 等 ResizeObserver 初始测量

    const toolbarHeight = () =>
      page.locator('.u-sheet__toolbar').evaluate((el) => el.getBoundingClientRect().height)

    // ─── 场景 1：宽视口 ─────────────────────────────────────
    const navWide = await page.locator('.u-sheet__toolbar-nav').count()
    check('宽视口（1280px）不渲染导航箭头', navWide === 0, `count=${navWide}`)
    check('宽视口工具栏单行（不换行）', (await toolbarHeight()) < 60)

    // 工具按钮全部在滚动视口内
    const toolsInScroll = await page
      .locator('.u-sheet__toolbar-scroll .u-sheet__tool')
      .count()
    check('工具按钮位于滚动视口内', toolsInScroll >= 20, `count=${toolsInScroll}`)

    // ─── 场景 2：容器变窄 → 箭头出现且仍单行 ────────────────
    // playground 页面非窄屏响应式设计，改为强制 sheet 容器宽度触发溢出
    await page.evaluate(() => {
      const sheet = document.querySelector('.sheet-demo__sheet')
      if (sheet) sheet.style.width = '320px'
    })
    await page.waitForTimeout(400)
    const navNarrow = await page.locator('.u-sheet__toolbar-nav').count()
    check('窄容器（320px）渲染左右箭头', navNarrow === 2, `count=${navNarrow}`)
    check('窄容器工具栏仍单行（不换行挤压 grid）', (await toolbarHeight()) < 60)
    const scrollClientWidth = await page
      .locator('.u-sheet__toolbar-scroll')
      .evaluate((el) => el.clientWidth)
    check('滚动视口有可用宽度', scrollClientWidth > 200, `clientWidth=${scrollClientWidth}`)

    // 左箭头初始禁用（未滚动），右箭头可用
    check('初始左箭头禁用', await page.locator('.u-sheet__toolbar-nav').nth(0).isDisabled())
    check('初始右箭头可用', !(await page.locator('.u-sheet__toolbar-nav').nth(1).isDisabled()))

    const scrollLeft = () =>
      page.locator('.u-sheet__toolbar-scroll').evaluate((el) => el.scrollLeft)

    // ─── 场景 3：点击右箭头步进滚动 ─────────────────────────
    const before = await scrollLeft()
    await page.locator('.u-sheet__toolbar-nav').nth(1).click()
    await page.waitForTimeout(600) // smooth 滚动
    const after = await scrollLeft()
    check('点击右箭头后 scrollLeft 增加', after > before, `${before} → ${after}`)
    check('滚动后左箭头可用', !(await page.locator('.u-sheet__toolbar-nav').nth(0).isDisabled()))

    // ─── 场景 4：滚轮横滚（纵向滚轮驱动水平滚动）─────────────
    await page.locator('.u-sheet__toolbar-scroll').hover()
    await page.mouse.wheel(0, 160)
    await page.waitForTimeout(300)
    const wheelAfter = await scrollLeft()
    check('滚轮纵向滚动驱动工具栏横滚', wheelAfter > after, `${after} → ${wheelAfter}`)

    // ─── 场景 5：滚动到底后最右工具可见 ─────────────────────
    await page
      .locator('.u-sheet__toolbar-scroll')
      .evaluate((el) => (el.scrollLeft = el.scrollWidth))
    await page.waitForTimeout(300)
    const exportBox = await page.locator('[data-tool-id="export"]').boundingBox()
    const scrollBox = await page.locator('.u-sheet__toolbar-scroll').boundingBox()
    const visible =
      !!exportBox &&
      !!scrollBox &&
      exportBox.x >= scrollBox.x - 1 &&
      exportBox.x + exportBox.width <= scrollBox.x + scrollBox.width + 1
    check('滚动到底后 export 按钮完整可见', visible)

    await page.screenshot({ path: join(OUT, 'phase7-toolbar-overflow.png'), fullPage: false })

    await browser.close()

    const failed = results.filter((r) => !r.ok)
    writeFileSync(join(OUT, 'phase7-toolbar-overflow-results.json'), JSON.stringify(results, null, 2))
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
