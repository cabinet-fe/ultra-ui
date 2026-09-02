# 表单：禁止逐字段搬运

字段一致时一次性对齐；新增/编辑共用通路。

## 新增 vs 编辑：绝大部分字段一致

新增和编辑通常是**同一套表单字段**。编辑相对新增，常见差异只有：

- 多一个 `id`（偶尔还有 `version` 等极少数字段）；或
- **`id` 根本不进表单**：单独变量 / 路由参数，提交时拼进路径（如 `PUT /users/:id`），body 与新增相同。

因此禁止为「新增一套 + 编辑一套」各写 50 行逐字段逻辑；差异用 `id` 是否存在或模式标志表达即可。

## 反例：逐字段赋值

```ts
// 定义 50 字段 + 回填 50 行 + 重置又 50 行 → 爆炸
form.name = row.name
form.age = row.age
form.email = row.email
form.phone = row.phone
// ...
```

## 正例：批量对齐

```ts
setForm(formData, row)
// 或：Object.assign(formData, pick(row, formKeys))
// 或：项目已有的 resetFields / setFieldsValue 等价 API
```

## 反例：新增 / 编辑各抄一套（仅因多了 id）

```ts
function fillForCreate() {
  form.name = ''
  form.age = undefined
  form.email = ''
  // ... 全字段再写一遍
}

function fillForEdit(row) {
  form.id = row.id // 唯一差异
  form.name = row.name
  form.age = row.age
  form.email = row.email
  // ... 又全字段抄一遍
}

function submitCreate() {
  return api.create({
    name: form.name,
    age: form.age,
    email: form.email,
    // ... 再抄 50 行
  })
}

function submitEdit() {
  return api.update({
    id: form.id,
    name: form.name,
    age: form.age,
    email: form.email,
    // ... 再抄 50 行
  })
}
```

## 正例：共用表单；id 在表单内时只多一个字段

```ts
function openDialog(row?: Row) {
  setForm(formData, row ?? defaultForm) // 编辑时 row 带 id，新增用默认值
}

function submit() {
  const payload = { ...formData }
  return payload.id ? api.update(payload) : api.create(payload)
  // 若 API 要求 id 与 body 分离：api.update(payload.id, omit(payload, ['id']))
}
```

## 正例：id 常为独立参数，替换路径，不进表单

很多接口是 `PUT /resource/:id`，body 与创建一致——此时 **不要把 id 塞进 form 再逐字段拆出来**。

```ts
const editingId = ref<string>() // 或 props.id / route.params.id

function openCreate() {
  editingId.value = undefined
  setForm(formData, defaultForm)
}

function openEdit(row: Row) {
  editingId.value = row.id
  setForm(formData, row) // 若 row 含 id，批量赋值后删掉即可；或 pick 不含 id 的字段
  // 更干净：setForm(formData, omit(row, ['id']))
}

function submit() {
  const body = { ...formData } // 与新增相同，无 id
  return editingId.value
    ? api.update(editingId.value, body) // id 只替换路径参数
    : api.create(body)
}
```

## 反例：擅自完整重置

用户只说「打开编辑弹窗」，却生成：

```ts
function resetForm() {
  form.name = ''
  form.age = undefined
  // ... 每个字段再写一遍
}
```

## 正例

- 有 `defaultForm` / 打开时 `setForm(formData, row)` 已够用 → 不单独造重置函数。
- 用户明确要求重置再写；优先 `setForm(formData, defaultForm)`，仍禁止逐字段。
- 关闭弹窗时清掉 `editingId` 即可，不必为 id 再写一套字段级重置。

## 例外（允许逐字段）

- 字段名不一致，需要显式映射（`form.userName = row.uname`）。
- 仅少数字段要转换（日期、分转元）；其余仍批量，只对差异字段手写。
- 新增/编辑字段集合真有多处不同（不只是 id）时，对差异字段分支，其余仍批量——禁止因此复制两整份表单。
