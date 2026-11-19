#!/usr/bin/env node
/**
 * 把 parts/part01..part08.txt 按序拼接成 yyzone-music-source.js，
 * 并校验字节数与 git blob sha（确保与工程内 music-app/sources/lx-yyzone.js 完全一致）；
 * 同时输出中文别名「YY Zone音源.js」。
 * 幂等：parts 已清理且产物存在时直接退出 0。
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const ROOT = path.join(__dirname, '..')
const PARTS = path.join(ROOT, 'parts')
const OUT = path.join(ROOT, 'yyzone-music-source.js')
const ALIAS = path.join(ROOT, 'YY Zone音源.js')

const EXPECT_SIZE = 37998
const EXPECT_BLOB = '4cdd8baf1d80f3f984d3a95a0711cc15ef2dc8e9'
const PART_COUNT = 8

function gitBlobSha (buf) {
  const header = 'blob ' + buf.length + '\u0000'
  return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(header, 'utf8'), buf])).digest('hex')
}

function fail (msg) {
  console.error('[merge] 失败：' + msg)
  process.exit(1)
}

if (!fs.existsSync(PARTS)) {
  if (fs.existsSync(OUT)) {
    console.log('[merge] parts 已清理，产物存在，无需处理')
    process.exit(0)
  }
  fail('parts 目录不存在')
}

const files = fs.readdirSync(PARTS).filter(f => /^part\d{2}\.txt$/.test(f)).sort()
if (files.length !== PART_COUNT) {
  fail('分片数量应为 ' + PART_COUNT + '，实际 ' + files.length + '：' + files.join(', '))
}

const bufs = files.map(f => {
  const p = path.join(PARTS, f)
  const b = fs.readFileSync(p)
  console.log('[merge] ' + f + ' ' + b.length + ' B')
  return b
})
const merged = Buffer.concat(bufs)

if (merged.length !== EXPECT_SIZE) {
  fail('拼接后 ' + merged.length + ' B，期望 ' + EXPECT_SIZE + ' B')
}
const blob = gitBlobSha(merged)
if (blob !== EXPECT_BLOB) {
  fail('拼接后 blob sha ' + blob + '，期望 ' + EXPECT_BLOB)
}

fs.writeFileSync(OUT, merged)
fs.writeFileSync(ALIAS, merged)
console.log('[merge] OK  ' + merged.length + ' B  blob ' + blob)
console.log('[merge] 输出：yyzone-music-source.js / YY Zone音源.js')
