import { compileString } from 'sass-embedded'
import { describe, expect, it } from 'vitest'

const compileScss = (source: string) =>
  compileString(source, { syntax: 'scss', url: new URL('./__test__.scss', import.meta.url) }).css

describe('mixins', () => {
  it('is-not appends a negated state selector to the current selector', () => {
    const css = compileScss(`
      @use '../mixins' as m;

      .u-input {
        @include m.is-not(disabled) {
          &:hover {
            border-color: red;
          }
        }
      }
    `)

    expect(css).toContain('.u-input:not(.is-disabled):hover')
  })

  it('is-not supports multiple negated state selectors', () => {
    const css = compileScss(`
      @use '../mixins' as m;

      .u-expression-editor {
        @include m.is-not(disabled, readonly) {
          &:focus-within {
            border-color: red;
          }
        }
      }
    `)

    expect(css).toContain('.u-expression-editor:not(.is-disabled):not(.is-readonly):focus-within')
  })
})
