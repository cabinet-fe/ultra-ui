# scss/sass 指令大全

## @use指令

导入sass模块, 就像在js中一样需要在文件顶部使用.

```scss
@use 'sass/to/path';

```
这些由scss导入的样式无论导入了多少次只会包含**一次**.


