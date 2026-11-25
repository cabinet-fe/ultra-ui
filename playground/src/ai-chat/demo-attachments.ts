import type { ChatAttachment } from '@veltra/ai'

const SVG_CARD_BLUE = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="320" height="200" rx="16" fill="url(#g1)"/>
  <circle cx="84" cy="76" r="28" fill="rgba(255,255,255,0.28)"/>
  <rect x="44" y="128" width="160" height="14" rx="7" fill="rgba(255,255,255,0.85)"/>
  <rect x="44" y="152" width="110" height="10" rx="5" fill="rgba(255,255,255,0.55)"/>
</svg>`

const SVG_CARD_VIOLET = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
  <defs>
    <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="320" height="200" rx="16" fill="url(#g2)"/>
  <path d="M36 150 L108 82 L162 126 L220 66 L284 150 Z" fill="rgba(255,255,255,0.35)"/>
  <circle cx="232" cy="54" r="18" fill="rgba(255,255,255,0.75)"/>
</svg>`

const toSvgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

export function createSampleImageAttachment(variant: 'blue' | 'violet' = 'blue'): ChatAttachment {
  const isBlue = variant === 'blue'
  const svg = isBlue ? SVG_CARD_BLUE : SVG_CARD_VIOLET
  return {
    name: isBlue ? 'architecture-diagram.svg' : 'design-preview.svg',
    mimeType: 'image/svg+xml',
    size: svg.length,
    dataUrl: toSvgDataUrl(svg)
  }
}

export function createSampleAttachments(): ChatAttachment[] {
  const specText = '{\n  "service": "veltra-ai",\n  "version": "1.0.0"\n}\n'
  return [
    createSampleImageAttachment('blue'),
    createSampleImageAttachment('violet'),
    {
      name: 'api-contract.json',
      mimeType: 'application/json',
      size: 2480,
      dataUrl: '',
      textContent: specText
    },
    { name: 'quarterly-report.pdf', mimeType: 'application/pdf', size: 1_482_752, dataUrl: '' }
  ]
}
