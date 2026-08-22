import { Sheet } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import { buildFilledReportPrintHtml } from '../print'

/** 基础填充表：表头 + 两列数据 */
function createFilledSheet(name = '销售报表'): Sheet {
  const sheet = new Sheet(name)
  sheet.setCells([
    { addr: { row: 0, col: 0 }, data: { v: '客户' } },
    { addr: { row: 0, col: 1 }, data: { v: '金额' } },
    { addr: { row: 1, col: 0 }, data: { v: '甲公司' } },
    { addr: { row: 1, col: 1 }, data: { v: 100 } }
  ])
  return sheet
}

describe('buildFilledReportPrintHtml', () => {
  it('输出完整打印文档：值为文本、默认 A4 纵向、缺省标题取 sheet 名', () => {
    const html = buildFilledReportPrintHtml(createFilledSheet())

    expect(html).toContain('<!doctype html>')
    expect(html).toContain('<title>销售报表</title>')
    expect(html).toContain('@page { size: A4 portrait;')
    expect(html).toContain('<td>客户</td>')
    expect(html).toContain('<td>100</td>')
    // 默认列宽 80 / 行高 28（对齐 grid 默认）
    expect(html).toContain('<col style="width:80px">')
    expect(html).toContain('<tr style="height:28px">')
    // 背景色打印保色
    expect(html).toContain('print-color-adjust: exact')
  })

  it('选项：title 覆盖、landscape 方向；空名 sheet 回落「报表」', () => {
    const html = buildFilledReportPrintHtml(createFilledSheet(), {
      title: '月度报表',
      orientation: 'landscape'
    })
    expect(html).toContain('<title>月度报表</title>')
    expect(html).toContain('@page { size: A4 landscape;')

    const fallback = buildFilledReportPrintHtml(new Sheet(''))
    expect(fallback).toContain('<title>报表</title>')
  })

  it('合并格映射 rowspan/colspan，被覆盖格不输出', () => {
    const sheet = createFilledSheet()
    sheet.mergeCells({ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } })

    const html = buildFilledReportPrintHtml(sheet)
    expect(html).toContain('<td colspan="2" rowspan="2">客户</td>')
    // 2×2 合并后只剩 1 个 td（锚点），覆盖格跳过
    const tdCount = (html.match(/<td/g) ?? []).length
    expect(tdCount).toBe(1)
  })

  it('有效样式序列化为内联 CSS（fill/border/font/align/wrap）', () => {
    const sheet = createFilledSheet()
    sheet.setCellStyle(
      { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
      {
        fill: { color: '#ff0000' },
        border: { top: { style: 'thin', width: 1, color: '#000000' } },
        font: {
          bold: true,
          italic: true,
          underline: true,
          strikethrough: true,
          size: 14,
          color: '#111111'
        },
        align: { horizontal: 'center', vertical: 'middle', wrap: true }
      }
    )
    sheet.setCellStyle(
      { start: { row: 1, col: 1 }, end: { row: 1, col: 1 } },
      { align: { horizontal: 'right' } }
    )

    const html = buildFilledReportPrintHtml(sheet)
    expect(html).toContain('background-color:#ff0000')
    expect(html).toContain('border-top:1px solid #000000')
    expect(html).toContain('font-weight:bold')
    expect(html).toContain('font-style:italic')
    expect(html).toContain('text-decoration:underline line-through')
    expect(html).toContain('font-size:14pt')
    expect(html).toContain('color:#111111')
    expect(html).toContain('text-align:center')
    expect(html).toContain('vertical-align:middle')
    expect(html).toContain('white-space:normal;word-break:break-all')
    expect(html).toContain('text-align:right')
  })

  it('虚线/点线边框线型映射 CSS dashed/dotted', () => {
    const sheet = createFilledSheet()
    sheet.setCellStyle(
      { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
      {
        border: {
          left: { style: 'dashed', width: 1, color: '#000000' },
          right: { style: 'dotted', width: 2, color: '#00ff00' }
        }
      }
    )
    const html = buildFilledReportPrintHtml(sheet)
    expect(html).toContain('border-left:1px dashed #000000')
    expect(html).toContain('border-right:2px dotted #00ff00')
  })

  it('自定义列宽 / 行高写入 colgroup 与 tr', () => {
    const sheet = createFilledSheet()
    sheet.setColWidth(1, 160)
    sheet.setRowHeight(1, 40)

    const html = buildFilledReportPrintHtml(sheet)
    expect(html).toContain('<col style="width:160px">')
    expect(html).toContain('<tr style="height:40px">')
  })

  it('文本与标题 HTML 转义', () => {
    const sheet = new Sheet('报表<Q>')
    sheet.setCells([{ addr: { row: 0, col: 0 }, data: { v: '<b>"x"</b> & y' } }])

    const html = buildFilledReportPrintHtml(sheet)
    expect(html).toContain('<title>报表&lt;Q&gt;</title>')
    expect(html).toContain('<td>&lt;b&gt;"x"&lt;/b&gt; &amp; y</td>')
    expect(html).not.toContain('<td><b>')
  })

  it('浮动图：data URL 内嵌，锚点格左上 + 格内偏移定位，显式宽高直出', () => {
    const sheet = createFilledSheet()
    sheet.setColWidth(0, 100)
    sheet.insertImage({
      data: new Uint8Array([1, 2, 3]),
      type: 'png',
      anchor: { from: { row: 1, col: 1, offsetX: 10, offsetY: 5 } },
      width: 48,
      height: 24,
      altText: '图章'
    })

    const html = buildFilledReportPrintHtml(sheet)
    // left = col0 宽 100 + 默认列宽 80（col1 前）→ 取 col1 左缘 100... colWidths=[100,80]，col1 左缘=100，+offsetX=110
    // top = row0 高 28，+offsetY=5 → 33
    expect(html).toContain(`<img src="data:image/png;base64,AQID"`)
    expect(html).toContain('left:110px;top:33px;width:48px;height:24px;')
    expect(html).toContain('alt="图章"')
  })

  it('浮动图：宽高缺失且有 to 时按 from→to 跨度兜底', () => {
    const sheet = createFilledSheet()
    sheet.insertImage({
      data: new Uint8Array([0]),
      type: 'jpeg',
      anchor: { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } }
    })

    const html = buildFilledReportPrintHtml(sheet)
    // 跨度：col0+col1 = 80+80 = 160；row0+row1 = 28+28 = 56
    expect(html).toContain('left:0px;top:0px;width:160px;height:56px;')
    expect(html).toContain('data:image/jpeg;base64,')
  })

  it('空 sheet 输出合法空表文档', () => {
    const html = buildFilledReportPrintHtml(new Sheet('空白'))
    expect(html).toContain('<title>空白</title>')
    expect(html).toContain('<table>')
    expect(html).not.toContain('<tr')
  })
})
