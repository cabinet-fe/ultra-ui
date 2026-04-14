import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/** 仓库根（本文件位于 tools/skills-sync/） */
export const REPO_ROOT = join(here, '../..')
