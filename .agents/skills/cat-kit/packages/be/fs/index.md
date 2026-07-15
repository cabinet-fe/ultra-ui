# be — 文件系统

## 何时使用

目录遍历、读写 JSON/文件、确保目录、移动、清空或删除路径。

## 推荐公开 API

`readDir`、`ensureDir`、`readJson`、`writeJson`、`writeFile`、`movePath`、`emptyDir`、`removePath`；以及再导出的 `readFile`、`copyFile`、`cp`、`existsSync`

详情见 [apis.md](apis.md)、[examples.md](examples.md)。

## 约束

- `readDir` 返回解析后的绝对路径；过滤掉的目录在 `recursive` 时仍会遍历
- `emptyDir` 删内容但保留/创建目录；`removePath` 递归删除
- `movePath` 仅显式允许时覆盖；`EXDEV` 时回退为复制+删除

## 类型入口

[generated/be/fs/](../../../generated/be/fs/)
