import { shallowReactive } from 'vue'

export function wrapDataRows(data: any[]) {
  return data.map((item, index) => {
    const row = shallowReactive({
      ...item
    })

    return row
  })
}
