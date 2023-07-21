import { inject } from "vue"

export function useFormComponent() {

  inject<boolean>('form', false)
}