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
            <strong>选用数据集</strong>：点头部「数据集」，从目录勾选本报表要用的集（默认订单 +
            客户；产品 / 员工 / 回款可按需追加）。可组合多个数据集的字段绑定到同一模板。
          </li>
          <li>
            <strong>配置字段中文名</strong>：在已选用集上打开「字段配置」表。
            <code>name</code> 是绑定键（写入 Binding，英文标识，只读）；
            <code>label</code> 是中文显示名（字段面板与格子占位可读名，可改）。二者来自数据集 schema
            配置（demo mock），不是运行时猜的。
          </li>
          <li>
            <strong>拖到格子</strong>：左侧字段面板只列出已选用集；中文 label
            为主，点选或拖拽绑定到单元格。选中已绑定格可编辑聚合 / 扩展 / 左父格。
          </li>
          <li>
            <strong>预览模式</strong>：用 mock
            数据把模板展开成真实报表（只读）。再回「设计模式」会恢复模板，不丢绑定。
          </li>
        </ol>
      </section>

      <section class="help-dialog__section">
        <h3 class="help-dialog__heading">name 与 label</h3>
        <ul class="help-dialog__list">
          <li>
            <strong>name</strong>：字段英文键，写入单元格 Binding 的
            <code>field</code>，渲染时按此键取行数据。
          </li>
          <li>
            <strong>label</strong>：中文描述，仅影响面板展示与设计态占位文案（如「分组 ·
            客户」），不改变绑定键。
          </li>
        </ul>
      </section>

      <section class="help-dialog__section">
        <h3 class="help-dialog__heading">字段绑定</h3>
        <p>
          把已选用数据集里的某一列挂到模板格子上。设计态格子显示中文占位；预览时才填入真实数据。
        </p>
      </section>

      <section class="help-dialog__section">
        <h3 class="help-dialog__heading">聚合方式（Aggregate）</h3>
        <p>决定这个绑定字段在预览时怎么取值：</p>
        <ul class="help-dialog__list">
          <li>
            <strong>列表（select）</strong
            >：每条明细各占一行。例如订单号、地区，会跟着订单一条条列出来。
          </li>
          <li>
            <strong>分组（group）</strong
            >：按字段值把相同的合并成一组，组内再展开明细。本示例用「客户」分组——同一客户的多笔订单挤在一组里，客户名只在组顶出现一次（并纵向合并单元格）。
          </li>
          <li>
            <strong>求和（sum）</strong
            >：对当前组（或范围内）的数值字段做合计。本示例合计行的「金额」就是求和，预览时显示该客户订单金额之和。
          </li>
        </ul>
      </section>

      <section class="help-dialog__section">
        <h3 class="help-dialog__heading">扩展方向（Expand）</h3>
        <p>决定预览时这一行模板会不会「长出」多行：</p>
        <ul class="help-dialog__list">
          <li>
            <strong>纵向（down）</strong
            >：有多少条匹配数据，就向下复制多少行。分组格、明细列表通常用这个。
          </li>
          <li>
            <strong>不扩展（none）</strong
            >：始终只占模板里的那一行。合计（求和）行一般选这个——每组只出一行小计，不会跟着明细条数变长。
          </li>
        </ul>
      </section>

      <section class="help-dialog__section">
        <h3 class="help-dialog__heading">左父格（Left Parent）</h3>
        <p>用来表达「我挂在哪一层分组下面」。预览时引擎按父格把明细/合计收进对应组。</p>
        <ul class="help-dialog__list">
          <li>
            <strong>无（none）</strong
            >：自己就是最外层。本示例的「客户」分组格就是「无」——它不从属于别人。
          </li>
          <li>
            <strong>默认（default）</strong
            >：自动找<strong>同一行、左边最近</strong>的分组格当父亲。明细列（订单号、金额等）通常用默认，这样不用手写地址。
          </li>
          <li>
            <strong>指定（specify）</strong>：手动写一个设计地址（如
            A2），明确挂到某个分组格。跨行小计、结构复杂时用。
          </li>
        </ul>
        <p class="help-dialog__note">
          和分组明细的关系：父格是「组」的锚点，子格（明细、合计）声明左父格后，预览才会按客户拆组、组内铺明细、组尾出合计。父格设错时，常见现象是预览空白或结构错乱。
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
