import { shallowReactive } from "vue"


const state = shallowReactive({
  formComponents: shallowReactive(new Set([
    'input'
  ]))
})

export function useConfig() {



}

