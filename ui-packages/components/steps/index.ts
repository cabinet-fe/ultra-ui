export { default as USteps } from './steps.vue'

export type {
  StepsProps,
  StepsEmits,
  StepsExposed
} from '@ui/types/components/steps'

import type { Item } from '@ui/types/components/steps'

export function defineSteps(items: Item[]) {
  return items
}
