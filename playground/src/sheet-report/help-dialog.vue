<template>
  <u-dialog
    v-model="visible"
    title="报表设计说明"
    :modal="true"
    class="help-dialog"
    style="width: min(560px, 92vw); max-height: 80vh"
  >
    <div class="help-dialog__body">
      <section class="help-dialog__section">
        <h3 class="help-dialog__heading">推荐流程</h3>
        <ol class="help-dialog__list">
          <li>
            <strong>配置数据源</strong>：点头部「数据源」，打开非 modal Dialog
            管理连接与数据集（默认订单 + 客户；产品 / 员工 / 回款可按需追加）。
          </li>
          <li>
            <strong>配置字段中文名</strong>：在数据集编辑器中维护字段 schema。
            <code>name</code> 是绑定键（英文标识）；<code>label</code>
            是中文显示名（字段面板与格子占位）。
          </li>
          <li>
            <strong>拖到格子</strong
            >：左侧字段面板点选或拖拽绑定到单元格。选中已绑定格会出现<strong>悬浮编辑卡片</strong>（默认精简，可展开排序、父分组、删除等）。
          </li>
          <li>
            <strong>筛选参数</strong>：点「筛选参数」打开非 modal
            Dialog，配置查询参数与默认值；预览筛选栏会同步。
          </li>
          <li>
            <strong>预览模式</strong>：用 mock
            数据把模板展开成真实报表（只读）。回「设计模式」会恢复模板，不丢绑定。
          </li>
        </ol>
      </section>

      <section class="help-dialog__section">
        <h3 class="help-dialog__heading">语义角色</h3>
        <p>绑定格通过<strong>语义角色</strong>表达在报表中的位置，配合聚合与排序控制展开行为：</p>
        <ul class="help-dialog__list">
          <li><strong>分组头（group）</strong>：按字段值拆组，组内再展开明细；同一组纵向合并。</li>
          <li><strong>明细行（detail）</strong>：每条数据各占一行，跟随左侧分组父格。</li>
          <li>
            <strong>小计行（subtotal）</strong>：对当前组做 sum / avg / count 等聚合，每组一行。
          </li>
          <li><strong>总计行（grandTotal）</strong>：对全量数据汇总。</li>
          <li><strong>矩阵交叉（matrix）</strong>：行分组 × 列分组交叉填值。</li>
        </ul>
      </section>

      <section class="help-dialog__section">
        <h3 class="help-dialog__heading">name 与 label</h3>
        <ul class="help-dialog__list">
          <li>
            <strong>name</strong>：字段英文键，写入 Binding 的
            <code>field</code>，渲染时按此键取行数据。
          </li>
          <li><strong>label</strong>：中文描述，仅影响面板展示与设计态占位文案，不改变绑定键。</li>
        </ul>
      </section>

      <section class="help-dialog__section">
        <h3 class="help-dialog__heading">聚合与排序</h3>
        <ul class="help-dialog__list">
          <li><strong>明细（select）</strong>：逐条列出字段值。</li>
          <li><strong>分组（group）</strong>：作为分组锚点，驱动扩展带。</li>
          <li><strong>求和 / 平均 / 计数</strong>：用于小计或总计行。</li>
          <li><strong>排序</strong>：分组头可按字段值升序或降序排列组实例。</li>
        </ul>
        <p class="help-dialog__note">
          父分组由左父格解析：明细与小计自动挂到左侧最近的分组格；用于设计拓扑与同格同行上的数据集继承。分组锚点设错时，常见现象是预览空白或结构错乱。
        </p>
        <p class="help-dialog__note">
          报表可通过<strong>独立扩展带</strong>使用多个数据集：同一扩展带共享一个数据集；另起一行单独绑定第二数据源的明细字段即可并列展示。
        </p>
      </section>
    </div>

    <template #footer>
      <u-button type="primary" @click="visible = false">知道了</u-button>
    </template>
  </u-dialog>
</template>

<script lang="ts" setup>
defineOptions({ name: 'SheetReportHelpDialog' })

const visible = defineModel<boolean>({ default: false })
</script>

<style scoped lang="scss">
.help-dialog__body {
  padding: 4px 4px 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--u-text-color, #334155);
}

.help-dialog__section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.help-dialog__heading {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--u-text-color, #0f172a);
}

.help-dialog__list {
  margin: 6px 0 0;
  padding-left: 1.25em;

  li + li {
    margin-top: 6px;
  }

  code {
    font-family: ui-monospace, monospace;
    font-size: 11px;
    padding: 0 3px;
    border-radius: 3px;
    background: var(--u-fill-color, #f1f5f9);
  }
}

.help-dialog__note {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--u-fill-color-light, #f8fafc);
  color: var(--u-text-color-secondary, #64748b);
  font-size: 12px;
}

p {
  margin: 0;
}
</style>
