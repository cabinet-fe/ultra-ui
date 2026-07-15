# nanoid — API

```ts
declare function nanoid(size?: number): string
declare function customAlphabet(
  alphabet: string,
  size?: number
): (size?: number) => string
declare function customRandom(
  alphabet: string,
  defaultSize: number,
  getRandom: (bytes: number) => Uint8Array
): (size?: number) => string
declare function random(bytes: number): Uint8Array
declare const urlAlphabet: string
```
