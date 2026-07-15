//#region src/nanoid.d.ts
/*!
 * Ported from nanoid v5.1.11:
 * https://github.com/ai/nanoid/tree/main
 * Source files: index.js, index.browser.js, url-alphabet/index.js
 */
declare const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
declare function random(bytes: number): Uint8Array
declare function customRandom(
  alphabet: string,
  defaultSize: number,
  getRandom: (bytes: number) => Uint8Array
): (size?: number) => string
declare function customAlphabet(alphabet: string, size?: number): (size?: number) => string
declare function nanoid(size?: number): string
//#endregion
export { customAlphabet, customRandom, nanoid, random, urlAlphabet }
