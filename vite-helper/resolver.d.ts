interface ComponentInfo {
    as?: string;
    name?: string;
    from: string;
    sideEffects?: string;
}
export declare function UIResolver(componentName: string): ComponentInfo | void;
export {};
