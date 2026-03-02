import { defineEventHandler, readBody, createError } from 'h3'
import type { ChunkRequest, DownloadFile } from '../../../shared/types/index'

export default defineEventHandler(async (event): Promise<DownloadFile[]> => {
  const body: ChunkRequest = await readBody(event)

  if (!body?.dates?.length) {
    throw createError({ statusCode: 400, message: 'dates array is required' })
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  const MIN_FILE_SIZE = 89808
  const MAX_FILE_SIZE = 209888
  const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  return body.dates.map((date, index) => {
    const fileName = `chunk_${date.year}_${pad(date.month)}_${pad(date.day)}_${pad(date.hour)}_${pad(date.minute ?? 0)}.dat`
    const fileSize = Math.floor(Math.random() * (MAX_FILE_SIZE - MIN_FILE_SIZE) + MIN_FILE_SIZE)

    return {
      fileId: `f${index + 1}`,
      fileName,
      downloadUrl: `https://storage.example.com/signed/${fileName}?token=mock-token-${index + 1}&expires=1740400000`,
      expirationDate,
      fileSize,
    }
  })
})
