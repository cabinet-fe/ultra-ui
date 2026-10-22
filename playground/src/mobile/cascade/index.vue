<template>
  <div class="demo">
    <section>
      <h3>基础用法（单选，默认完整路径）</h3>
      <UCascade v-model="single" :data="areaData" placeholder="请选择地区" @change="onChange" />
      <p class="tip">当前值：{{ single || '未选择' }}</p>
    </section>

    <section>
      <h3>多选（暂存后确定）</h3>
      <UCascade v-model="multiple" :data="areaData" multiple :visibility-limit="2" />
      <p class="tip">当前值：{{ multiple.length ? multiple.join('、') : '未选择' }}</p>
    </section>

    <section>
      <h3>可搜索 + 严格模式（仅叶子提交）</h3>
      <UCascade v-model="searched" :data="areaData" filterable strict placeholder="搜索地区" />
    </section>

    <section>
      <h3>仅展示叶子值（show-full-path=false）</h3>
      <UCascade v-model="leafOnly" :data="areaData" :show-full-path="false" />
      <p class="tip">当前值：{{ leafOnly || '未选择' }}</p>
    </section>

    <section>
      <h3>禁用 / 只读</h3>
      <UCascade v-model="single" :data="areaData" disabled />
      <UCascade v-model="multiple" :data="areaData" multiple readonly />
    </section>

    <section>
      <h3>表单行式（嵌入 UFormItem）</h3>
      <UFormItem label="所在地区">
        <UCascade v-model="form" :data="areaData" placeholder="请选择" />
      </UFormItem>
      <UFormItem label="覆盖区域">
        <UCascade v-model="formMultiple" :data="areaData" multiple :visibility-limit="2" />
      </UFormItem>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UCascade, UFormItem } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/cascade/style'
import '@veltra/mobile/components/form-item/style'

const areaData = [
  {
    label: '浙江省',
    value: '330000',
    children: [
      {
        label: '杭州市',
        value: '330100',
        children: [
          { label: '西湖区', value: '330106' },
          { label: '滨江区', value: '330108' },
          { label: '余杭区', value: '330110' }
        ]
      },
      {
        label: '宁波市',
        value: '330200',
        children: [
          { label: '海曙区', value: '330203' },
          { label: '江北区', value: '330205' },
          { label: '鄞州区', value: '330212' }
        ]
      }
    ]
  },
  {
    label: '江苏省',
    value: '320000',
    children: [
      {
        label: '南京市',
        value: '320100',
        children: [
          { label: '玄武区', value: '320102' },
          { label: '秦淮区', value: '320104' },
          { label: '鼓楼区', value: '320106' }
        ]
      },
      {
        label: '苏州市',
        value: '320500',
        children: [
          { label: '姑苏区', value: '320508' },
          { label: '吴中区', value: '320506' },
          { label: '相城区', value: '320507' }
        ]
      }
    ]
  }
]

const single = shallowRef('330000/330100/330108')
const multiple = shallowRef<string[]>(['330106', '330108'])
const searched = shallowRef('')
const leafOnly = shallowRef('330106')
const form = shallowRef('320000/320100/320104')
const formMultiple = shallowRef<string[]>(['330203'])

function onChange(item?: Record<string, any>, label?: string) {
  console.log('change', item, label)
}
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端密度与触控热区
.demo {
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.tip {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
