import { bem } from '@ui/utils'
import { defineComponent, inject, type PropType } from 'vue'
import { RowFormInjectType } from './di'
import type { Row, RowFormColumn } from '@ui/types/components/row-form'
import NodeRender from '../node-render/node-render'

export default defineComponent({
  name: 'RowSlotRender',

  inheritAttrs: false,

  props: {
    customRow: {
      type: Object as PropType<Row<Record<string, any>>>,
      required: true
    }
  },

  emits: { click: (e: Event, key: RowFormColumn) => true },

  setup(props, { emit, slots }) {
    const cls = bem('row-form')

    /** 当前条点击事件 */
    const handleClick = (e: Event, key: RowFormColumn) => {
      emit('click', e, key)
    }

    const injected = inject(RowFormInjectType, null)!

    const { rowFormSlots, columns } = injected!

    const { customRow } = props

    /** 渲染插槽 */
    const getRowFormSlotsNodes = (key: string, row: Record<string, any>) => {
      return rowFormSlots!['column:' + key]?.({
        data: row.data,
        row: row
      })
    }

    return {
      cls,
      injected,
      customRow,
      rowFormSlots,
      columns,
      handleClick,
      getRowFormSlotsNodes
    }
  },

  render() {
    const { cls, handleClick, getRowFormSlotsNodes, customRow, columns } = this

    return (
      <>
        {columns.map(key => {
          return (
            <td>
              <div class={cls.e('tbody-item')}>
                <div onClick={(value: any) => handleClick(value, key)}>
                  <NodeRender
                    content={getRowFormSlotsNodes(key.key!, customRow)}
                  ></NodeRender>
                </div>
              </div>
            </td>
          )
        })}
      </>
    )
  }
})
