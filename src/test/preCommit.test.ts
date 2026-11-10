import { execFileSync, spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { expect, it } from 'vitest'

const shell =
  process.platform === 'win32'
    ? resolve(
        execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim(),
        '../../../usr/bin/sh.exe',
      )
    : '/bin/sh'
const hook = join(process.cwd(), '.husky/pre-commit').replaceAll('\\', '/')

// Execute the real hook while substituting only npm: running the full suite
// from its own regression test would recurse indefinitely.
const harness = `
if [ -n "$BASH_VERSION" ]; then shopt -s expand_aliases; fi
record_npm() {
  printf '%s\\n' "$*"
  return "$CHECK_EXIT_CODE"
}
alias npm='record_npm npm'
alias npm.cmd='record_npm npm.cmd'
PATH=''
. "$1"
`

it.each([
  ['Windows_NT', 'npm.cmd', 0],
  ['Windows_NT', 'npm.cmd', 7],
  ['Linux', 'npm', 0],
  ['Linux', 'npm', 7],
  [undefined, 'npm', 0],
  [undefined, 'npm', 7],
] as const)(
  'executa a verificação no SO %s com %s e preserva o resultado %s',
  (os, command, exitCode) => {
    const env: Record<string, string | undefined> = {
      ...process.env,
      CHECK_EXIT_CODE: String(exitCode),
    }
    if (os === undefined) delete env.OS
    else env.OS = os
    const result = spawnSync(shell, ['-c', harness, 'pre-commit-test', hook], {
      encoding: 'utf8',
      env,
      timeout: 10000,
    })

    expect(result.error).toBeUndefined()
    expect(result.stderr).toBe('')
    expect(result.stdout.trim()).toBe(`${command} run check`)
    expect(result.status).toBe(exitCode)
  },
)
