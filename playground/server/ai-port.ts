/** DeepSeek AI 代理服务端口：AI_SERVER_PORT 环境变量覆盖，默认 8788（report 契约服务为 8787） */
const fromEnv = Number(process.env.AI_SERVER_PORT)
export const AI_SERVER_PORT =
  Number.isInteger(fromEnv) && fromEnv > 0 && fromEnv <= 65535 ? fromEnv : 8788
