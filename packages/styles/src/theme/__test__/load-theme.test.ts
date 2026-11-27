// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import { currentTheme, loadTheme } from '../load-theme'
import { darkTheme, lightTheme } from '../presets'

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function hasMountedTransitionSheet(baseSheetCount: number): boolean {
  return (
    document.adoptedStyleSheets.length > baseSheetCount ||
    document.getElementById('ultra-ui-theme-transition') !== null
  )
}

describe('loadTheme', () => {
  const originalStartViewTransition = document.startViewTransition
  const originalAnimate = document.documentElement.animate
  const originalMatchMedia = window.matchMedia
  const originalInnerWidth = window.innerWidth
  const originalInnerHeight = window.innerHeight

  beforeEach(() => {
    currentTheme.value = undefined
    document.documentElement.removeAttribute('data-theme')
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      configurable: true
    })
  })

  afterEach(() => {
    currentTheme.value = undefined
    document.startViewTransition = originalStartViewTransition
    document.documentElement.animate = originalAnimate
    Object.defineProperty(window, 'matchMedia', { value: originalMatchMedia, configurable: true })
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true })
    vi.restoreAllMocks()
  })

  it('skips view transition on initial load when currentTheme is undefined', () => {
    const startViewTransition = vi.fn()
    document.startViewTransition = startViewTransition

    loadTheme(lightTheme)

    expect(startViewTransition).not.toHaveBeenCalled()
    expect(currentTheme.value).toBe(lightTheme)
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('runs circular ripple view transition from viewport center on subsequent switch', async () => {
    loadTheme(lightTheme)
    const baseSheetCount = document.adoptedStyleSheets.length
    const replaceSyncSpy = vi.spyOn(CSSStyleSheet.prototype, 'replaceSync')

    const ready = createDeferred()
    const finished = createDeferred()
    const animate = vi.fn()
    document.documentElement.animate = animate

    document.startViewTransition = vi.fn((cb) => {
      void Promise.resolve(cb())
      return {
        ready: ready.promise,
        finished: finished.promise,
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn()
      } as unknown as ViewTransition
    })

    loadTheme(darkTheme)

    expect(document.startViewTransition).toHaveBeenCalledTimes(1)
    expect(hasMountedTransitionSheet(baseSheetCount)).toBe(true)
    expect(
      replaceSyncSpy.mock.calls.some(
        ([css]) =>
          css.includes('::view-transition-old(root)') && css.includes('::view-transition-new(root)')
      )
    ).toBe(true)

    await Promise.resolve()
    expect(currentTheme.value).toBe(darkTheme)
    expect(document.documentElement.dataset.theme).toBe('dark')

    ready.resolve()
    await ready.promise
    await Promise.resolve()

    const expectedRadius = Math.hypot(500, 400)
    expect(animate).toHaveBeenCalledWith(
      { clipPath: ['circle(0px at 500px 400px)', `circle(${expectedRadius}px at 500px 400px)`] },
      {
        duration: 400,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        pseudoElement: '::view-transition-new(root)'
      }
    )

    finished.resolve()
    await finished.promise
    await Promise.resolve()
    expect(hasMountedTransitionSheet(baseSheetCount)).toBe(false)
  })

  it('falls back synchronously when transition is false, startViewTransition is missing, or reduced-motion is active', () => {
    loadTheme(lightTheme)

    const startViewTransition = vi.fn()
    document.startViewTransition = startViewTransition

    loadTheme(darkTheme, false)
    expect(startViewTransition).not.toHaveBeenCalled()
    expect(currentTheme.value).toBe(darkTheme)

    Object.defineProperty(document, 'startViewTransition', { value: undefined, configurable: true })
    loadTheme(lightTheme)
    expect(currentTheme.value).toBe(lightTheme)
    expect(document.documentElement.dataset.theme).toBe('light')

    document.startViewTransition = startViewTransition
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: true }),
      configurable: true
    })
    loadTheme(darkTheme)
    expect(startViewTransition).not.toHaveBeenCalled()
    expect(currentTheme.value).toBe(darkTheme)

    Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true })
    expect(() => loadTheme(lightTheme, false)).not.toThrow()
    expect(currentTheme.value).toBe(lightTheme)
  })

  it('keeps transition style mounted until the latest rapid transition finishes', async () => {
    loadTheme(lightTheme)
    const baseSheetCount = document.adoptedStyleSheets.length

    const firstReady = createDeferred()
    const firstFinished = createDeferred()
    const secondReady = createDeferred()
    const secondFinished = createDeferred()
    const animate = vi.fn()
    document.documentElement.animate = animate

    let callCount = 0
    document.startViewTransition = vi.fn((cb) => {
      callCount += 1
      void Promise.resolve(cb())
      if (callCount === 1) {
        return {
          ready: firstReady.promise,
          finished: firstFinished.promise,
          updateCallbackDone: Promise.resolve(),
          skipTransition: vi.fn()
        } as unknown as ViewTransition
      }
      return {
        ready: secondReady.promise,
        finished: secondFinished.promise,
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn()
      } as unknown as ViewTransition
    })

    loadTheme(darkTheme)
    loadTheme(lightTheme)

    firstReady.resolve()
    firstFinished.resolve()
    await firstReady.promise
    await firstFinished.promise
    await Promise.resolve()

    expect(animate).not.toHaveBeenCalled()
    expect(hasMountedTransitionSheet(baseSheetCount)).toBe(true)

    secondReady.resolve()
    await secondReady.promise
    await Promise.resolve()
    expect(animate).toHaveBeenCalledTimes(1)

    secondFinished.resolve()
    await secondFinished.promise
    await Promise.resolve()
    expect(hasMountedTransitionSheet(baseSheetCount)).toBe(false)
  })
})
