import { defineEventHandler, readBody, createError } from 'h3'
import type { ChunkRequest, DeleteResult } from '../../shared/types/index'

export default defineEventHandler(async (event): Promise<DeleteResult> => {
  const body: ChunkRequest = await readBody(event)

  if (!body?.dates?.length) {
    throw createError({ statusCode: 400, message: 'dates array is required' })
  }

  const processedFileIds = body.dates.map((_, i) => `f${i + 1}`)

  return {
    processedFileIds,
    failedFileIds: [],
    status: 'completed',
    additionalInfo: `${body.dates.length} files deleted successfully`,
  }
})
