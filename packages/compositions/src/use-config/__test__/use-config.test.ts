import { describe, expect, it } from 'vite-plus/test'

import { useConfig } from '../index'

describe('useConfig', () => {
  it('setConfig 可设置全局 ai 配置，config.ai 可读', () => {
    const { config, setConfig } = useConfig()
    setConfig({
      ai: { url: 'https://api.example.com/v1/chat/completions', apiKey: 'sk-1', model: 'gpt-4o' }
    })

    expect(config.ai).toMatchObject({
      url: 'https://api.example.com/v1/chat/completions',
      apiKey: 'sk-1',
      model: 'gpt-4o'
    })
  })

  it('多次 setConfig 部分字段按字段级合并，不互相覆盖', () => {
    const { config, setConfig } = useConfig()
    setConfig({ ai: { url: 'https://api.example.com/v1/chat/completions' } })
    setConfig({ ai: { model: 'gpt-4o-mini' } })
    setConfig({ ai: { stream: true } })

    expect(config.ai).toMatchObject({
      url: 'https://api.example.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      stream: true
    })
  })

  it('ai 更新不影响其它全局配置键', () => {
    const { config, setConfig } = useConfig()
    setConfig({ animation: false, ai: { reasoningLevel: 'high' } })

    expect(config.animation).toBe(false)
    expect(config.ai.reasoningLevel).toBe('high')
    expect(config.form).toEqual({ labelWidth: 100 })
  })
})
