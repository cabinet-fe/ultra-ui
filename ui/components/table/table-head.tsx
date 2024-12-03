import { defineComponent, inject } from 'vue'
import { TableDIKey, TableResizeKey } from './di'
import { bem, withUnit } from '@ui/utils'

export default defineComponent({
  name: 'TableHead',
  setup() {
    const { cls, columnConfig, getHeaderSlotsNode, getHeaderCellClass } =
      inject(TableDIKey)!
    const { headers } = columnConfig
    const handleCls = cls.e('resize-handle')

    const { handleResizeMousedown } = inject(TableResizeKey)!

    return () => (
      <thead
        class={[cls.e('head'), bem.is('multistage', headers.value.length > 1)]}
      >
        {headers.value.map((header, headerIndex) => (
          <tr>
            {header.map(column => (
              <th
                class={getHeaderCellClass(column)}
                key={column.key + column.keySuffix}
                colspan={column.leafs}
                rowspan={
                  column.children?.length
                    ? undefined
                    : headers.value.length - headerIndex
                }
                style={{
                  left: withUnit(column.style.left, 'px'),
                  right: withUnit(column.style.right, 'px')
                }}
              >
                {getHeaderSlotsNode({ column })}

                {column.isLeaf ? (
                  <span
                    class={handleCls}
                    onMousedown={handleResizeMousedown}
                  ></span>
                ) : null}
              </th>
            ))}
          </tr>
        ))}
      </thead>
    )
  }
})
