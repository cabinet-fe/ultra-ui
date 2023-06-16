import { kebabCase } from 'cat-kit/be'

export function UIResolver(componentName: string) {
  if (componentName.startsWith('U')) {
    const dirname = kebabCase(componentName.slice(1))
    return {
      name: componentName.slice(1),
      from: 'ultra-ui',
      sideEffects: `ultra-ui/components/${dirname}/style`
    }
  }
}
