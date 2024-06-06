import type { Slots } from 'vue'

import { UButton } from '../button'
import { UIcon } from '../icon'
import { ArrowDown } from 'icon-ultra'
import { UDropdown } from '../dropdown'

export function getSlotsNodes(slots: Slots, visibleAmount: number) {
  // @ts-ignore
  const nodes = slots.default?.()?.filter(node => node.type?.name === 'Action')
  if (!nodes) return []

  const normalNodes = nodes.slice(0, visibleAmount)
  const hiddenNodes = nodes.slice(visibleAmount)

  const dropdown = hiddenNodes.length ? (
    <UDropdown minWidth='100px' trigger='click'>
      {{
        trigger: () => (
          <UButton text size='small' type='primary'>
            更多
            <UIcon>
              <ArrowDown />
            </UIcon>{' '}
          </UButton>
        ),
        content: () => <div class='u-action__dropdown'>{hiddenNodes}</div>
      }}
    </UDropdown>
  ) : null

  return dropdown ? [...normalNodes, dropdown] : normalNodes
}
