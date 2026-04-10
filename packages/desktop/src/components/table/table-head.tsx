import { bem, withUnit } from '@ultra-ui/utils'
import { defineComponent, inject, type DefineComponent } from 'vue'

import { TableDIKey, TableResizeKey } from './di'

const TableHead: DefineComponent = defineComponent({
  name: 'TableHead',
  setup() {
    const { cls, columnConfig, getHeaderSlotsNode, getHeaderCellClass } = inject(TableDIKey)!
    const { headers } = columnConfig
    const handleCls = cls.e('resize-handle')

    const { handleResizeMousedown, headerRef } = inject(TableResizeKey)!

    return () => (
      <thead
        class={[cls.e('head'), bem.is('multistage', headers.value.length > 1)]}
        ref={headerRef}
      >
        {headers.value.map((header, headerIndex) => (
          <tr>
            {header.map((column) => (
              <th
                class={getHeaderCellClass(column)}
                key={column.key}
                colspan={column.leafs}
                rowspan={column.children?.length ? undefined : headers.value.length - headerIndex}
                style={{
                  left: withUnit(column.style.left, 'px'),
                  right: withUnit(column.style.right, 'px')
                }}
              >
                {getHeaderSlotsNode({ column })}

                {column.isLeaf && column.resizable ? (
                  <span
                    class={handleCls}
                    onMousedown={(e) => handleResizeMousedown(e, column)}
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

export default TableHead
