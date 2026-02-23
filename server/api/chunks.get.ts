import { defineEventHandler } from 'h3'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { SignedFilesResponse } from '../../shared/types/index'

export default defineEventHandler((): SignedFilesResponse => {
  const raw = readFileSync(join(process.cwd(), 'mock-data/signedfiles.json'), 'utf-8')
  return JSON.parse(raw)
})
