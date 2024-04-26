interface ComponentInfo {
    as?: string;
    name?: string;
    from: string;
    sideEffects?: string;
}
export interface ResolverOptions {
    /**
     * 组件目录，必须是一个绝对路径
     */
    componentsDir: string;
    /** 前缀 */
    prefix: string;
    /**
     * 库名称
     * @example import {} from 'lib'
     */
    lib: string;
    /** 附加的引入 */
    sideEffects?: (name: string) => string;
}
/**
 * 定义组件的解析器
 */
export declare function defineResolver(options: ResolverOptions): (componentName: string) => ComponentInfo | undefined;
export declare const UltraUIResolver: (componentName: string) => ComponentInfo | undefined;
export {};
