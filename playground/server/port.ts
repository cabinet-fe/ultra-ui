/** playground 参考服务端口（data-entry + /ai）：REPORT_SERVER_PORT 覆盖，默认 7799 */
const fromEnv = Number(process.env.REPORT_SERVER_PORT)
export const REPORT_SERVER_PORT =
  Number.isInteger(fromEnv) && fromEnv > 0 && fromEnv <= 65535 ? fromEnv : 7799
