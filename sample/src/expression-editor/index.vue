<template>
  <div>
    <h3>表达式编辑器示例</h3>
    <p>输入 @ 可以触发变量选择器，或点击右侧变量图标</p>

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
      <h4>变量列表：</h4>
      <ul>
        <li v-for="item in variables" :key="item.value">
          {{ item.label }}: {{ item.value }}
        </li>
      </ul>
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
  "你好{form.name}, 欢迎来到{form.company}，入职{form.department}为{form.position}职位",
);

const variables = [
  { label: "姓名", value: "form.name" },
  { label: "公司", value: "form.company" },
  { label: "日期", value: "form.date" },
  { label: "部门", value: "form.department" },
  { label: "职位", value: "form.position" },
];

const data = {
  form: {
    name: "张三",
    company: "bilibili",
    date: "2025-01-01",
    department: "研发部",
    position: "前端工程师",
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
