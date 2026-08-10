/** 契约参考服务端口：REPORT_SERVER_PORT 环境变量覆盖，默认 8787（hono 惯例端口） */
const fromEnv = Number(process.env.REPORT_SERVER_PORT)
export const REPORT_SERVER_PORT =
  Number.isInteger(fromEnv) && fromEnv > 0 && fromEnv <= 65535 ? fromEnv : 8787
