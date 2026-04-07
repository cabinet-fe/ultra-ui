//#region src/web-api/permission.d.ts
type WebPermissionName = PermissionName | 'clipboard-read' | 'clipboard-write';
declare function queryPermission(name: WebPermissionName): Promise<boolean>;
//#endregion
export { WebPermissionName, queryPermission };
//# sourceMappingURL=permission.d.ts.map