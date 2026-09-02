# HTML 嵌套与样式膨胀

后台/中台优先 UI 库与布局组件；结构宜浅，CSS 宜少。

## 反例：用嵌套堆间距

```vue
<div class="page">
  <div class="page-inner">
    <div class="page-body">
      <div class="card-wrap">
        <div class="card">
          <div class="card-body">
            <el-form>...</el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

```scss
.page { padding: 16px; }
.page-inner { padding: 8px; }
.page-body { margin: 8px; }
.card-wrap { background: #fff; }
.card { border-radius: 4px; }
.card-body { padding: 16px; }
```

## 正例：布局组件 + 表单

```vue
<page-container>
  <el-card>
    <el-form>...</el-form>
  </el-card>
</page-container>
```

（`page-container` / `el-card` 以项目实际布局与 UI 库为准。）

## 反例：重复、无用 CSS

```scss
.btn-primary { color: #fff; background: #409eff; }
// 与 UI 库 Primary Button 重复
.toolbar .btn-primary { color: #fff; background: #409eff; }
```

模板已改用 `<el-button type="primary">`，自定义 `.btn-primary` 仍留着。

## 正例

用 `<el-button type="primary">`；删除无用自定义按钮样式。

## 反例：为对齐多包三层 flex

```vue
<div class="flex">
  <div class="flex-1">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">...</div>
    </div>
  </div>
</div>
```

## 正例

```vue
<el-space wrap>
  <el-button>导出</el-button>
  <el-button type="primary">新建</el-button>
</el-space>
```

或项目 `a-space` / `ProTable` toolbar 插槽——优先设计系统已有能力。

## 自检

- 去掉某一层 wrapper 后布局是否仍成立？成立则删。
- 这段 CSS 是否只是重复 UI 库 token/组件皮肤？是则删。
