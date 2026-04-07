import { BumpType, SemverVersion } from "./types.js";

//#region src/version/semver.d.ts
/**
 * 解析 semver 版本号
 * @param version - 版本字符串（如 "1.2.3-alpha.1+build.123"）
 * @returns 解析后的版本对象
 * @throws {SemverError} 当版本格式无效时
 * @example
 * ```ts
 * const ver = parseSemver('1.2.3-alpha.1')
 * // { major: 1, minor: 2, patch: 3, prerelease: ['alpha', '1'], raw: '1.2.3-alpha.1' }
 * ```
 */
declare function parseSemver(version: string): SemverVersion;
/**
 * 验证版本号格式是否有效
 * @param version - 版本字符串
 * @returns 是否为有效的 semver 版本号
 * @example
 * ```ts
 * isValidSemver('1.2.3')         // true
 * isValidSemver('1.2.3-alpha.1') // true
 * isValidSemver('invalid')       // false
 * ```
 */
declare function isValidSemver(version: string): boolean;
/**
 * 比较两个版本号
 * @param v1 - 版本号 1（字符串或版本对象）
 * @param v2 - 版本号 2（字符串或版本对象）
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 * @example
 * ```ts
 * compareSemver('2.0.0', '1.0.0')         // 1
 * compareSemver('1.0.0', '2.0.0')         // -1
 * compareSemver('1.0.0', '1.0.0')         // 0
 * compareSemver('1.0.0-alpha', '1.0.0')   // -1 (预发布版本小于正式版本)
 * ```
 */
declare function compareSemver(v1: string | SemverVersion, v2: string | SemverVersion): number;
/**
 * 递增版本号
 * @param version - 当前版本号
 * @param type - 递增类型
 * @param preid - 预发布标识（用于 pre* 类型，默认 'alpha'）
 * @returns 新版本号字符串
 * @throws {SemverError} 当递增类型无效时
 * @example
 * ```ts
 * incrementVersion('1.2.3', 'major')           // '2.0.0'
 * incrementVersion('1.2.3', 'minor')           // '1.3.0'
 * incrementVersion('1.2.3', 'patch')           // '1.2.4'
 * incrementVersion('1.2.3', 'premajor')        // '2.0.0-alpha.0'
 * incrementVersion('1.2.3', 'prerelease')      // '1.2.3-alpha.0'
 * incrementVersion('1.2.3-alpha.0', 'prerelease') // '1.2.3-alpha.1'
 * incrementVersion('1.2.3', 'prerelease', 'beta') // '1.2.3-beta.0'
 * ```
 */
declare function incrementVersion(version: string, type: BumpType, preid?: string): string;
//#endregion
export { compareSemver, incrementVersion, isValidSemver, parseSemver };
//# sourceMappingURL=semver.d.ts.map