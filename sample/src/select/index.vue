<template>
  <div class="demoList">
    <div>
      <h2>单选</h2>
      <p>设置 <span>clearable</span> 属性，可将选择器清空，默认 ture,只有单选中有</p>
      <u-select
        :model-value="singleValue"
        :options="singleOptions"
        label-key="codeAndLabel"
        value-key="deptId"
        @change="handleSingleChange"
        @update:model-value="handleUpdate"
      />
    </div>

    <div>
      <p>设置 <span>disabled</span> 属性，则整个选择器不可用</p>
      <u-select
        disabled
        :model-value="singleValue2"
        :options="singleOptions"
        label-key="codeAndLabel"
        value-key="deptId"
        @change="handleSingleChange"
      />
    </div>

    <div>
      <p>设置 <span>filterable</span> 属性可启用搜索功能</p>
      <u-select
        :model-value="singleValue3"
        :options="singleOptions3"
        label-key="codeAndLabel"
        value-key="deptId"
        @change="handleSingleChange"
      />
    </div>

    <div>
      <h2>多选</h2>
      <p>设置 <span>multiple</span> 属性即可启用多选，此时 v-model 的值为当前选中值所组成的数组</p>
      <u-select
        multiple
        :model-value="multipleValue"
        :options="options"
        label-key="codeAndLabel"
        value-key="deptId"
        @update:model-value="onChange"
      />
    </div>

    <div>
      <p>设置 <span>collapse-tags</span>属性启用折叠标签，boolean类型</p>
      <u-select
        multiple
        collapse-tags
        :model-value="multipleValue2"
        :options="options"
        label-key="codeAndLabel"
        value-key="deptId"
        @update:model-value="onChange"
      />
    </div>

    <div>
      <p>
        设置 <span>max-collapse-tags</span>属性启用折叠标签，number类型; 需与 collapse-tags 一起使用
      </p>
      <u-select
        multiple
        collapse-tags
        :max-collapse-tags="2"
        :model-value="multipleValue3"
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
const singleValue2 = ref('')
const singleValue3 = ref('')
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
const singleOptions3 = ref([...singleOptions.value])
const handleSingleChange = item => {
  console.log(item, 'handleSingleChange')
  singleValue.value = item.deptId
  console.log(singleValue.value, 'singleValue')
}

const multipleValue = ref<any>(['1701050425886236672', '1701050425886236674'])
const multipleValue2 = ref<any>([])
const multipleValue3 = ref<any>([])
const options = ref([...singleOptions.value])

const onChange = (val: any) => {
  console.log(val, 'val')
  // value.value = val.label
  // console.log(value.value, 'value')
}

const handleUpdate = (val: any) => {
  console.log(val, 'val - update')
}
</script>

<style lang="scss" scoped>
.demoList {
  margin-bottom: 30px;
  & > div {
    padding: 10px;
    box-sizing: border-box;
    margin-bottom: 30px;
  }
  span {
    font-weight: bold;
  }
}
</style>
