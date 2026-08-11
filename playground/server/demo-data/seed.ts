/**
 * Report 演示数据 — 远端 PostgreSQL 灌库脚本
 *
 * 用法（在 playground 目录）：
 *
 * 环境变量：推荐写在 playground/.env（git 已忽略），Bun 会自动加载。
 * 见同目录 README.md「环境变量配置在哪？」
 *
 *   # 仅建表 / 仅灌数据
 *   bun run seed-demo -- --schema-only
 *   bun run seed-demo -- --seed-only
 */

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Client, type ClientConfig } from 'pg'

const ROOT = dirname(fileURLToPath(import.meta.url))

/** 未设置环境变量时，可在此填写远端连接（勿提交真实密码） */
const FALLBACK = {
  host: 'YOUR_HOST',
  port: 5432,
  database: 'YOUR_DATABASE',
  user: 'YOUR_USERNAME',
  password: 'YOUR_PASSWORD',
  /** 远端库通常需要 SSL；也可通过环境变量 PG_SSL=true 开启 */
  ssl: false as boolean
}

const CONNECT_TIMEOUT_MS = 30_000

function parseArgs(argv: string[]) {
  return { schemaOnly: argv.includes('--schema-only'), seedOnly: argv.includes('--seed-only') }
}

function resolveSsl(): ClientConfig['ssl'] {
  const flag = process.env.PG_SSL?.toLowerCase()
  if (flag === 'true' || flag === '1') {
    return { rejectUnauthorized: false }
  }
  if (flag === 'false' || flag === '0') {
    return undefined
  }
  return FALLBACK.ssl ? { rejectUnauthorized: false } : undefined
}

function resolveConfig(): ClientConfig {
  const url = process.env.REPORT_DEMO_PG_URL ?? process.env.DATABASE_URL
  if (url) {
    return { connectionString: url, connectionTimeoutMillis: CONNECT_TIMEOUT_MS, ssl: resolveSsl() }
  }

  return {
    host: process.env.PG_HOST ?? FALLBACK.host,
    port: Number(process.env.PG_PORT ?? FALLBACK.port),
    database: process.env.PG_DATABASE ?? FALLBACK.database,
    user: process.env.PG_USER ?? FALLBACK.user,
    password: process.env.PG_PASSWORD ?? FALLBACK.password,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    ssl: resolveSsl()
  }
}

function maskConfig(config: ClientConfig): string {
  if ('connectionString' in config && config.connectionString) {
    return config.connectionString.replace(/:([^:@/]+)@/, ':***@')
  }
  return `${config.user}@${config.host}:${config.port}/${config.database}`
}

async function readSql(name: string): Promise<string> {
  const path = join(ROOT, name)
  return readFile(path, 'utf8')
}

async function runSql(client: Client, label: string, sql: string) {
  console.log(`→ ${label}`)
  await client.query(sql)
  console.log(`✓ ${label}`)
}

async function main() {
  const { schemaOnly, seedOnly } = parseArgs(process.argv.slice(2))
  if (schemaOnly && seedOnly) {
    console.error('不能同时指定 --schema-only 与 --seed-only')
    process.exit(1)
  }

  const config = resolveConfig()
  if (!config.connectionString && config.host === 'YOUR_HOST') {
    console.error(
      [
        '未配置数据库连接。请设置以下任一方式：',
        '  REPORT_DEMO_PG_URL=postgresql://USER:PASS@HOST:5432/DB',
        '  或 PG_HOST / PG_PORT / PG_DATABASE / PG_USER / PG_PASSWORD',
        '远端库通常还需 PG_SSL=true'
      ].join('\n')
    )
    process.exit(1)
  }

  const client = new Client(config)
  console.log(`连接 ${maskConfig(config)} …`)

  try {
    await client.connect()
    console.log('已连接')

    if (!seedOnly) {
      await runSql(client, '01_schema.sql', await readSql('01_schema.sql'))
    }
    if (!schemaOnly) {
      await runSql(client, '02_seed.sql', await readSql('02_seed.sql'))
    }

    console.log('完成')
  } catch (error) {
    console.error('执行失败：', error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    await client.end().catch(() => {})
  }
}

await main()
