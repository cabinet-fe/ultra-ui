# Web API — API

```ts
declare const clipboard: {
  copy(data: string | Blob | Array<string | Blob>): Promise<void>
  read(): Promise<Blob[]>
  readText(): Promise<string>
}

type WebPermissionName = /* 见 generated */ string

declare function queryPermission(name: WebPermissionName): Promise<boolean>
```
