//#region src/system/network.d.ts
/**
 * 网络接口信息
 */
interface NetworkInterfaceInfo {
  /** 接口名称 */
  name: string;
  /** IP 地址 */
  address: string;
  /** 地址族 */
  family: 'IPv4' | 'IPv6';
  /** MAC 地址 */
  mac: string;
  /** 是否为内网地址 */
  internal: boolean;
  /** 子网掩码 */
  netmask: string;
  /** CIDR 表示法（如果有） */
  cidr?: string;
}
/**
 * 获取网络接口选项
 */
interface GetNetworkInterfacesOptions {
  /** 是否包含内网地址，默认 false */
  includeInternal?: boolean;
}
/**
 * 获取本机网络接口信息
 *
 * @param options - 控制是否包含内部地址
 * @returns 网络接口列表
 */
declare function getNetworkInterfaces(options?: GetNetworkInterfacesOptions): NetworkInterfaceInfo[];
//#endregion
export { GetNetworkInterfacesOptions, NetworkInterfaceInfo, getNetworkInterfaces };
//# sourceMappingURL=network.d.ts.map