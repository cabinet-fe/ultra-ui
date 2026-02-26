<template>
  <div>
    <h3>表达式编辑器示例</h3>
    <p>
      输入 @ 可以触发变量选择器。键盘操作：<br />
      • <strong>上下键</strong>：在列表中导航<br />
      • <strong>空格键</strong>：进入下一级（仅对有子项的变量有效）<br />
      • <strong>回车键</strong>：选择变量（仅对最末级变量有效）<br />
      • <strong>左键/退格</strong>：返回上一级<br />
      • <strong>ESC</strong>：关闭面板
    </p>

    <h4>拖拽行为矩阵（实现为真源）</h4>
    <ul>
      <li>合法拖拽源：仅支持变量节点（{variable}）直接拖拽，普通文本与空白不是拖拽源。</li>
      <li>合法目标粒度：按变量插槽计算，hover 到纯文本区域时自动 snap 到最近合法插入位。</li>
      <li>非法 drop：外部数据源、跨表达式区域或无效 payload 会 silent revert（仅清理反馈，不改内容）。</li>
      <li>drop 后焦点：焦点回到被移动变量，便于连续重排。</li>
      <li>桌面优先：优先使用原生 DnD；原生不可用时显示变量“上移/下移”作为等价交互。</li>
      <li>边界规则：首项禁上移、末项禁下移；readonly/disabled 下不触发重排。</li>
    </ul>

    <div style="margin-bottom: 20px">
      <u-expression-editor
        v-model="expression"
        :variables="variables"
        placeholder="请输入表达式，输入@可插入变量"
      />
    </div>

    <div style="margin-bottom: 20px">
      <h4>表达式：</h4>
      <pre>{{ expression }}</pre>
    </div>

    <div style="margin-bottom: 20px">
      <h4>值替换：</h4>
      <pre>{{ value }}</pre>
    </div>

    <div style="margin-bottom: 20px">
      <h4>变量列表（树形结构）：</h4>
      <pre>{{ JSON.stringify(variables, null, 2) }}</pre>
    </div>

    <div style="margin-bottom: 20px">
      <h4>禁用状态：</h4>
      <u-expression-editor v-model="value" :variables="variables" disabled />
    </div>

    <div style="margin-bottom: 20px">
      <h4>只读状态：</h4>
      <u-expression-editor v-model="value" :variables="variables" readonly />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getChainValue } from "cat-kit";
import { computed } from "vue";
import { shallowRef } from "vue";

const expression = shallowRef(
  "你好{form.user.name}, 欢迎来到{form.company.name}，入职{form.department.name}为{form.position}职位",
);

// 更丰富的树形变量结构
const variables = [
  {
    label: "表单数据",
    value: "form",
    children: [
      {
        label: "用户信息",
        value: "form.user",
        children: [
          { label: "姓名", value: "form.user.name" },
          { label: "年龄", value: "form.user.age" },
          { label: "邮箱", value: "form.user.email" },
        ],
      },
      {
        label: "公司信息",
        value: "form.company",
        children: [
          { label: "公司名称", value: "form.company.name" },
          { label: "公司地址", value: "form.company.address" },
          { label: "公司电话", value: "form.company.phone" },
        ],
      },
      {
        label: "部门信息",
        value: "form.department",
        children: [
          { label: "部门名称", value: "form.department.name" },
          { label: "部门编号", value: "form.department.code" },
        ],
      },
      { label: "职位", value: "form.position" },
      { label: "入职日期", value: "form.date" },
    ],
  },
  {
    label: "系统变量",
    value: "system",
    children: [
      { label: "当前时间", value: "system.currentTime" },
      { label: "当前用户", value: "system.currentUser" },
      { label: "系统版本", value: "system.version" },
    ],
  },
];

const data = {
  form: {
    user: {
      name: "张三",
      age: 28,
      email: "zhangsan@example.com",
    },
    company: {
      name: "bilibili",
      address: "上海市杨浦区",
      phone: "021-12345678",
    },
    department: {
      name: "研发部",
      code: "DEV001",
    },
    position: "前端工程师",
    date: "2025-01-01",
  },
  system: {
    currentTime: "2025-11-22 10:30:00",
    currentUser: "admin",
    version: "v2.0.0",
  },
};

function getValue(expression: string, data: any) {
  return expression.replace(/\{([^}]+)\}/g, (match, key) => {
    return getChainValue(data, key);
  });
}

const value = computed(() => {
  return getValue(expression.value, data);
});
</script>
