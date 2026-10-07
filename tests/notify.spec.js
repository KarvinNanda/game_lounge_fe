import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ElMessage } from 'element-plus'
import { notifyError } from '@/utils/notify'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { parse } from '@babel/parser'

const httpError = (status, message) => ({ response: { status, data: message ? { message } : {} } })

describe('notifyError', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(ElMessage, 'error').mockImplementation(() => {})
  })

  it('shows nothing for 403: the API interceptor already said "no access"', () => {
    notifyError(httpError(403, 'Anda tidak punya akses untuk aksi ini'), 'Gagal menyimpan')
    expect(ElMessage.error).not.toHaveBeenCalled()
  })

  it('prefers the server message', () => {
    notifyError(httpError(400, 'Pilih cabang (store_id)'), 'Gagal memuat')
    expect(ElMessage.error).toHaveBeenCalledWith('Pilih cabang (store_id)')
  })

  it('falls back to the view text when the server sent no message', () => {
    notifyError(httpError(500), 'Gagal memuat')
    expect(ElMessage.error).toHaveBeenCalledWith('Gagal memuat')
  })

  it('falls back on network errors (no response)', () => {
    notifyError(new Error('Network Error'), 'Gagal memuat')
    expect(ElMessage.error).toHaveBeenCalledWith('Gagal memuat')
  })
})

// Parse each view's <script> and look at real catch clauses, not text.
const catchCalls = (file) => {
  const { descriptor } = parseSfc(readFileSync(file, 'utf8'))
  const block = descriptor.scriptSetup || descriptor.script
  if (!block) return []
  const found = []
  const walk = (node, inCatch) => {
    if (!node || typeof node.type !== 'string') return
    if (node.type === 'CallExpression' && inCatch) {
      const callee = node.callee
      if (callee.type === 'MemberExpression' && callee.object.name === 'ElMessage' && callee.property.name === 'error') {
        found.push(`${file}:${block.loc.start.line + node.loc.start.line - 1}`)
      }
    }
    const nowInCatch = inCatch || node.type === 'CatchClause'
    for (const key of Object.keys(node)) {
      const v = node[key]
      if (Array.isArray(v)) v.forEach((c) => walk(c, nowInCatch))
      else if (v && typeof v.type === 'string') walk(v, nowInCatch)
    }
  }
  walk(parse(block.content, { sourceType: 'module' }).program, false)
  return found
}

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? filesUnder(p) : [p]
  })

describe('error toasts in views', () => {
  it('API failures (catch blocks) go through notifyError, so a 403 never shows twice', () => {
    const offenders = filesUnder('src/views')
      .filter((p) => p.endsWith('.vue') && !p.endsWith('LoginView.vue'))
      .flatMap(catchCalls)
    expect(offenders).toEqual([])
  })

  it('the parser check really finds ElMessage.error inside catch (self-test)', () => {
    expect(catchCalls('src/views/auth/LoginView.vue')).toHaveLength(1)
  })
})
