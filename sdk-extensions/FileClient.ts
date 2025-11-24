'use client'

/**
 * File Client for RoboSystems API
 *
 * Manages file upload operations including presigned URLs, S3 uploads,
 * and file status tracking.
 */

import { createFileUpload, deleteFile, getFile, listFiles, updateFile } from '../sdk/sdk.gen'
import type { FileStatusUpdate, FileUploadRequest, FileUploadResponse } from '../sdk/types.gen'

export interface FileUploadOptions {
  onProgress?: (message: string) => void
  fixLocalStackUrl?: boolean
  fileName?: string
  ingestToGraph?: boolean
}

export interface FileUploadResult {
  fileId: string
  fileSize: number
  rowCount: number
  tableName: string
  fileName: string
  success: boolean
  error?: string
}

export interface FileInfo {
  fileId: string
  fileName: string
  tableName: string
  status: string
  fileSize: number
  rowCount: number
  createdAt: string
}

export type FileInput = File | Blob | Buffer | ReadableStream<Uint8Array>

export class FileClient {
  private config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string
  }

  constructor(config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string
  }) {
    this.config = config
  }

  /**
   * Upload a Parquet file to staging
   *
   * Handles the complete 3-step upload process:
   * 1. Get presigned upload URL
   * 2. Upload file to S3
   * 3. Mark file as 'uploaded' (backend validates, calculates size/row count)
   */
  async upload(
    graphId: string,
    tableName: string,
    fileOrBuffer: FileInput,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    const fileName = this.getFileName(fileOrBuffer, options.fileName)

    try {
      options.onProgress?.(`Getting upload URL for ${fileName} -> table '${tableName}'...`)

      const uploadRequest: FileUploadRequest = {
        file_name: fileName,
        content_type: 'application/x-parquet',
        table_name: tableName,
      }

      const uploadUrlResponse = await createFileUpload({
        path: { graph_id: graphId },
        body: uploadRequest,
      })

      if (uploadUrlResponse.error || !uploadUrlResponse.data) {
        return {
          fileId: '',
          fileSize: 0,
          rowCount: 0,
          tableName,
          fileName,
          success: false,
          error: `Failed to get upload URL: ${uploadUrlResponse.error}`,
        }
      }

      const uploadData = uploadUrlResponse.data as FileUploadResponse
      let uploadUrl = uploadData.upload_url
      const fileId = uploadData.file_id

      if (options.fixLocalStackUrl && uploadUrl.includes('localstack:4566')) {
        uploadUrl = uploadUrl.replace('localstack:4566', 'localhost:4566')
      }

      options.onProgress?.(`Uploading ${fileName} to S3...`)

      const fileContent = await this.getFileContent(fileOrBuffer)
      const fileSize = fileContent.byteLength

      const s3Response = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileContent,
        headers: {
          'Content-Type': 'application/x-parquet',
        },
      })

      if (!s3Response.ok) {
        return {
          fileId,
          fileSize,
          rowCount: 0,
          tableName,
          fileName,
          success: false,
          error: `S3 upload failed: ${s3Response.status} ${s3Response.statusText}`,
        }
      }

      options.onProgress?.(`Marking ${fileName} as uploaded...`)

      const statusUpdate: FileStatusUpdate = {
        status: 'uploaded',
      }

      const updateResponse = await updateFile({
        path: { graph_id: graphId, file_id: fileId },
        body: statusUpdate,
      })

      if (updateResponse.error || !updateResponse.data) {
        return {
          fileId,
          fileSize,
          rowCount: 0,
          tableName,
          fileName,
          success: false,
          error: 'Failed to complete file upload',
        }
      }

      const responseData = updateResponse.data as any
      const actualFileSize = responseData.file_size_bytes || 0
      const actualRowCount = responseData.row_count || 0

      options.onProgress?.(
        `✅ Uploaded ${fileName} (${actualFileSize.toLocaleString()} bytes, ${actualRowCount.toLocaleString()} rows)`
      )

      return {
        fileId,
        fileSize: actualFileSize,
        rowCount: actualRowCount,
        tableName,
        fileName,
        success: true,
      }
    } catch (error) {
      return {
        fileId: '',
        fileSize: 0,
        rowCount: 0,
        tableName,
        fileName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * List files in a graph
   */
  async list(graphId: string, tableName?: string, status?: string): Promise<FileInfo[]> {
    try {
      const response = await listFiles({
        path: { graph_id: graphId },
        query: {
          table_name: tableName,
          status: status as any,
        },
      })

      if (response.error || !response.data) {
        console.error('Failed to list files:', response.error)
        return []
      }

      const fileData = response.data as any

      return (
        fileData.files?.map((file: any) => ({
          fileId: file.file_id,
          fileName: file.file_name,
          tableName: file.table_name,
          status: file.status,
          fileSize: file.file_size_bytes || 0,
          rowCount: file.row_count || 0,
          createdAt: file.created_at,
        })) || []
      )
    } catch (error) {
      console.error('Failed to list files:', error)
      return []
    }
  }

  /**
   * Get file information
   */
  async get(graphId: string, fileId: string): Promise<FileInfo | null> {
    try {
      const response = await getFile({
        path: { graph_id: graphId, file_id: fileId },
      })

      if (response.error || !response.data) {
        console.error('Failed to get file:', response.error)
        return null
      }

      const file = response.data as any

      return {
        fileId: file.file_id,
        fileName: file.file_name,
        tableName: file.table_name,
        status: file.status,
        fileSize: file.file_size_bytes || 0,
        rowCount: file.row_count || 0,
        createdAt: file.created_at,
      }
    } catch (error) {
      console.error('Failed to get file:', error)
      return null
    }
  }

  /**
   * Delete a file
   */
  async delete(graphId: string, fileId: string, cascade: boolean = false): Promise<boolean> {
    try {
      const response = await deleteFile({
        path: { graph_id: graphId, file_id: fileId },
        query: { cascade },
      })

      return !response.error
    } catch (error) {
      console.error('Failed to delete file:', error)
      return false
    }
  }

  private getFileName(fileOrBuffer: FileInput, override?: string): string {
    if (override) return override

    if ('name' in fileOrBuffer && typeof fileOrBuffer.name === 'string') {
      return fileOrBuffer.name
    }

    return 'data.parquet'
  }

  private async getFileContent(fileOrBuffer: FileInput): Promise<ArrayBuffer> {
    if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
      return fileOrBuffer.arrayBuffer()
    }

    if (Buffer.isBuffer(fileOrBuffer)) {
      const buffer = fileOrBuffer.buffer.slice(
        fileOrBuffer.byteOffset,
        fileOrBuffer.byteOffset + fileOrBuffer.byteLength
      )
      // Convert SharedArrayBuffer to ArrayBuffer if needed
      if (buffer instanceof ArrayBuffer) {
        return buffer
      }
      // Handle SharedArrayBuffer by copying to ArrayBuffer
      const arrayBuffer = new ArrayBuffer(buffer.byteLength)
      new Uint8Array(arrayBuffer).set(new Uint8Array(buffer))
      return arrayBuffer
    }

    if ('getReader' in fileOrBuffer) {
      const reader = fileOrBuffer.getReader()
      const chunks: Uint8Array[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) chunks.push(value)
      }

      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const result = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }
      return result.buffer
    }

    throw new Error('Unsupported file input type')
  }
}
