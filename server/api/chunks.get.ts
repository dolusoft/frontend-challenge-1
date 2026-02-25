import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { SignedFilesResponse } from '../../shared/types/index'

export default defineEventHandler(async (): Promise<SignedFilesResponse> => {
  const raw = await readFile(join(process.cwd(), 'mock-data/signedfiles.json'), 'utf-8')
  return JSON.parse(raw)
})
