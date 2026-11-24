export function createIncrease(initial = 1000): () => number {
  let value = initial

  const increase = () => {
    return value++
  }

  return increase
}
