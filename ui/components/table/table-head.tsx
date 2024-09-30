import { defineComponent, inject } from 'vue'
import { TableDIKey } from './di'
import { bem, withUnit } from '@ui/utils'

export default defineComponent({
  name: 'TableHead',
  setup() {
    const { cls, columnConfig, getHeaderSlotsNode, getCellClass } =
      inject(TableDIKey)!
    const { headers } = columnConfig

    return () => (
      <thead
        class={[cls.e('head'), bem.is('multistage', headers.value.length > 1)]}
      >
        {headers.value.map((header, headerIndex) => (
          <tr>
            {header.map(column => (
              <th
                class={getCellClass(column)}
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
                {getHeaderSlotsNode({
                  column
                })}
              </th>
            ))}
          </tr>
        ))}
      </thead>
    )
  }
})
