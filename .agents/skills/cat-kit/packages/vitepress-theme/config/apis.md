# 配置 — API

```ts
// @cat-kit/vitepress-theme/config
interface CatKitThemeOptions {
  /** examples 目录的绝对路径 */
  examplesDir: string
}

declare function defineThemeConfig(
  options: CatKitThemeOptions
): Partial<UserConfig>

declare function demoContainer(
  md: MarkdownIt,
  options: DemoContainerOptions
): Promise<void>
declare function mermaidPlugin(md: MarkdownIt): void
declare function importExamples(options: ImportExamplesOptions): Plugin
```
