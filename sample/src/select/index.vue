<template>
  <div class="demoList">
    <div>
      <h2>单选</h2>
      <u-select
        :model-value="singleValue"
        :options="singleOptions"
        label-key="codeAndLabel"
        value-key="deptId"
        @update:model-value="handleSingleChange"
      ></u-select>
    </div>
    <div>
      <h2>多选</h2>
      <u-select
        multiple
        :model-value="multipleValue"
        :options="options"
        label-key="codeAndLabel"
        value-key="deptId"
        @update:model-value="onChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const singleValue = ref('1701050425886236672')
const singleOptions = ref([
  {
    label: '交科院',
    value: '1',
    code: '88',
    codeAndLabel: '88 交科院',
    defaultTravelPlace: '12-1201-1201015',
    defaultTravelPlaceName: '天津市-市辖区-和平区',
    deptId: '1701050425886236672'
  },
  {
    label: '相城开发区',
    value: '2',
    codeAndLabel: '99 相城开发区',
    defaultTravelPlace: '13-1201-1201014',
    defaultTravelPlaceName: '天津市-市辖区-和平区',
    deptId: '1701050425886236673'
  },
  {
    label: '杜桥镇人民政府',
    value: '3',
    codeAndLabel: '77 杜桥镇人民政府',
    defaultTravelPlace: '14-1201-1201013',
    defaultTravelPlaceName: '天津市-市辖区-和平区',
    deptId: '1701050425886236674'
  }
])
const handleSingleChange = item => {
  console.log(item, 'handleSingleChange')
  singleValue.value = item.label
}

const multipleValue = ref<any>(['1701050425886236672', '1701050425886236674'])

const options = ref([
  {
    label: '交科院',
    value: '1',
    code: '88',
    codeAndLabel: '88 交科院',
    defaultTravelPlace: '12-1201-1201015',
    defaultTravelPlaceName: '天津市-市辖区-和平区',
    deptId: '1701050425886236672'
  },
  {
    label: '相城开发区',
    value: '2',
    codeAndLabel: '99 相城开发区',
    defaultTravelPlace: '13-1201-1201014',
    defaultTravelPlaceName: '天津市-市辖区-和平区',
    deptId: '1701050425886236673'
  },
  {
    label: '杜桥镇人民政府',
    value: '3',
    codeAndLabel: '77 杜桥镇人民政府',
    defaultTravelPlace: '14-1201-1201013',
    defaultTravelPlaceName: '天津市-市辖区-和平区',
    deptId: '1701050425886236674'
  },
  {
    label: '财务部',
    value: '4',
    codeAndLabel: '66 财务部',
    defaultTravelPlace: '15-1201-1201011',
    defaultTravelPlaceName: '天津市-市辖区-和平区',
    deptId: '1701050425886236675'
  },
  {
    label: '选项5',
    value: '5',
    codeAndLabel: '55 选项5',
    defaultTravelPlace: '16-1201-1201012',
    defaultTravelPlaceName: '天津市-市辖区-和平区',
    deptId: '1701050425886236676'
  }
])

const onChange = (val: any) => {
  console.log(val, 'val')
  // value.value = val.label
  // console.log(value.value, 'value')
}
</script>

<style lang="scss" scoped>
.demoList {
  margin-bottom: 30px;
  & > div {
    padding: 10px 0;
    box-sizing: border-box;
    margin-bottom: 30px;
  }
}
</style>
