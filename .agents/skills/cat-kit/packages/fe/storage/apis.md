# 浏览器存储 — API

```ts
declare function storageKey<T>(name: string): StorageKey<T>

declare const storage: {
  local: StorageApi
  session: StorageApi
}

// StorageApi: set/get/remove/on/off，set 第三参为过期秒数

declare const cookie: {
  get(name: string): string | undefined
  set(name: string, value: string, options?: CookieOptions): void
  remove(name: string, options?: CookieOptions): void
  clear(): void
}
```

`CookieOptions` 含 `path`、`domain`、`maxAge`、`expires`、`secure`、`sameSite` 等，见 generated。
