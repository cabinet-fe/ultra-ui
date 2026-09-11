# 接口错误禁止挤布局

请求失败用项目已有 toast / Message；禁止把 API error 插进现有布局把其它元素顶开。

## 反例：把 API error 塞进卡片 / 弹框 / 表单

```vue
<el-card>
  <p v-if="error" class="error">{{ error }}</p>
  <el-form>...</el-form>
</el-card>
```

```vue
<el-dialog title="编辑">
  <div v-if="submitError">{{ submitError }}</div>
  <el-form>...</el-form>
</el-dialog>
```

失败后这段文字突然插入，卡片/弹框变高、表单和按钮被顶走，layout shift，体验很差。

## 正例：toast / 全局提示

```ts
// 项目已有 ElMessage、message.error、$toast 等，直接用
ElMessage.error('保存失败')
```

页面主体布局高度不变。不要把后端原文原样铺在卡片里。

## 正例：必须就地提示时，不改变布局高度

仅当这块 UI 本来就要展示失败态（不是顺手加空状态框架）时：

- 预留错误槽位（固定高度 / `min-height`），有无错误都占同一块空间
- dialog 内错误区固定高度，禁止随文案撑开把 footer / 按钮顶下去
- 表单校验仍走 UI 库 `el-form` rules / `el-form-item` error，不要另插一段 API 原文

```vue
<p class="error-slot">{{ error }}</p>
```

```scss
.error-slot { min-height: 22px; }
```
