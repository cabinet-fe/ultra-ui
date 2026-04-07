import { PackageJson } from "../types.js";

//#region src/deps/types.d.ts
/**
 * 包信息（用于依赖分析）
 */
interface PackageInfo {
  /** 包名称 */
  name: string;
  /** 包版本 */
  version?: string;
  /** package.json 内容 */
  pkg: PackageJson;
}
/**
 * 依赖关系图
 */
interface DependencyGraph {
  /** 节点（包） */
  nodes: DependencyNode[];
  /** 边（依赖关系） */
  edges: DependencyEdge[];
}
/**
 * 依赖节点
 */
interface DependencyNode {
  /** 节点 ID（包名称） */
  id: string;
  /** 包版本 */
  version: string;
  /** 是否为外部依赖 */
  external: boolean;
}
/**
 * 依赖边
 */
interface DependencyEdge {
  /** 起始节点（依赖方） */
  from: string;
  /** 目标节点（被依赖方） */
  to: string;
  /** 依赖类型 */
  type: 'dependencies' | 'devDependencies' | 'peerDependencies';
}
/**
 * 循环依赖检查结果
 */
interface CircularDependencyResult {
  /** 是否存在循环依赖 */
  hasCircular: boolean;
  /** 循环依赖链列表 */
  cycles: CircularChain[];
}
/**
 * 循环依赖链
 */
interface CircularChain {
  /** 依赖链（包名数组） */
  chain: string[];
  /** 循环起点索引 */
  startIndex: number;
}
/**
 * 版本一致性检查结果
 */
interface ConsistencyResult {
  /** 是否一致 */
  consistent: boolean;
  /** 不一致的依赖列表 */
  inconsistent: InconsistentDependency[];
}
/**
 * 不一致的依赖
 */
interface InconsistentDependency {
  /** 依赖名称 */
  name: string;
  /** 不同的版本列表 */
  versions: Array<{
    /** 版本号 */version: string; /** 使用该版本的包 */
    usedBy: string[];
  }>;
}
/**
 * 过时依赖检查结果
 */
interface OutdatedResult {
  /** 过时的依赖列表 */
  outdated: OutdatedDependency[];
  /** 检查时间 */
  checkedAt: Date;
}
/**
 * 过时的依赖
 */
interface OutdatedDependency {
  /** 依赖名称 */
  name: string;
  /** 当前使用的版本 */
  current: string;
  /** 最新版本 */
  latest: string;
  /** 使用该依赖的包列表 */
  usedBy: Array<{
    /** 包名称 */package: string; /** 依赖类型 */
    type: 'dependencies' | 'devDependencies' | 'peerDependencies';
  }>;
}
//#endregion
export { CircularChain, CircularDependencyResult, ConsistencyResult, DependencyEdge, DependencyGraph, DependencyNode, InconsistentDependency, OutdatedDependency, OutdatedResult, PackageInfo };
//# sourceMappingURL=types.d.ts.map