// 自有 worker 入口（cooking spec 决策 4/5）：本模块经构建工具打成独立 worker 产物，
// 首条 import 保证 polyfill 先于 pdfjs worker 代码求值。
import './pdf-polyfill'
import 'pdfjs-dist/build/pdf.worker.mjs'
