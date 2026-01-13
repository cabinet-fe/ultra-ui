import { cp } from 'fs/promises'
import { resolve } from 'node:path'
import { ROOT, DIST_ROOT } from './shared'

export function copyFiles() {
  return cp(resolve(ROOT, 'README.md'), resolve(DIST_ROOT, 'README.md'))
}

export function genPackageJson() { }

export function genVersion() {

}