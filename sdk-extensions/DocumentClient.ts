'use client'

/**
 * Document Client for RoboSystems API
 *
 * Upload, search, list, and delete text documents indexed in OpenSearch.
 * Documents are sectioned on markdown headings, embedded for semantic search,
 * and searchable alongside structured graph data.
 */

import {
  deleteDocument,
  getDocumentSection,
  listDocuments,
  searchDocuments,
  uploadDocument,
  uploadDocumentsBulk,
} from '../sdk/sdk.gen'
import type {
  BulkDocumentUploadResponse,
  DocumentListResponse,
  DocumentSection,
  DocumentUploadResponse,
  SearchResponse,
} from '../sdk/types.gen'

export interface DocumentSearchOptions {
  /** Filter by source type (xbrl_textblock, narrative_section, ixbrl_disclosure, uploaded_doc, memory) */
  sourceType?: string
  /** Filter by ticker, CIK, or entity name */
  entity?: string
  /** Filter by SEC form type (10-K, 10-Q) */
  formType?: string
  /** Filter by section ID (item_1, item_1a, item_7, etc.) */
  section?: string
  /** Filter by XBRL element qname (e.g., us-gaap:Goodwill) */
  element?: string
  /** Filter by fiscal year */
  fiscalYear?: number
  /** Filter filings on or after date (YYYY-MM-DD) */
  dateFrom?: string
  /** Filter filings on or before date (YYYY-MM-DD) */
  dateTo?: string
  /** Max results to return (default: 10) */
  size?: number
  /** Pagination offset */
  offset?: number
}

export interface DocumentUploadOptions {
  /** Optional tags for filtering */
  tags?: string[]
  /** Optional folder/category */
  folder?: string
  /** Optional external ID for upsert behavior */
  externalId?: string
}

export class DocumentClient {
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
   * Upload a markdown document for text indexing.
   *
   * The document is sectioned on headings, embedded, and indexed
   * into OpenSearch for full-text and semantic search.
   */
  async upload(
    graphId: string,
    title: string,
    content: string,
    options: DocumentUploadOptions = {}
  ): Promise<DocumentUploadResponse> {
    const response = await uploadDocument({
      path: { graph_id: graphId },
      body: {
        title,
        content,
        tags: options.tags ?? null,
        folder: options.folder ?? null,
        external_id: options.externalId ?? null,
      },
    })

    if (response.error) {
      throw new Error(`Document upload failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as DocumentUploadResponse
  }

  /**
   * Upload multiple markdown documents (max 50 per request).
   */
  async uploadBulk(
    graphId: string,
    documents: Array<{
      title: string
      content: string
      tags?: string[]
      folder?: string
      externalId?: string
    }>
  ): Promise<BulkDocumentUploadResponse> {
    const response = await uploadDocumentsBulk({
      path: { graph_id: graphId },
      body: {
        documents: documents.map((doc) => ({
          title: doc.title,
          content: doc.content,
          tags: doc.tags ?? null,
          folder: doc.folder ?? null,
          external_id: doc.externalId ?? null,
        })),
      },
    })

    if (response.error) {
      throw new Error(`Bulk upload failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as BulkDocumentUploadResponse
  }

  /**
   * Search documents with hybrid (BM25 + kNN) search.
   */
  async search(
    graphId: string,
    query: string,
    options: DocumentSearchOptions = {}
  ): Promise<SearchResponse> {
    const response = await searchDocuments({
      path: { graph_id: graphId },
      body: {
        query,
        source_type: options.sourceType ?? null,
        entity: options.entity ?? null,
        form_type: options.formType ?? null,
        section: options.section ?? null,
        element: options.element ?? null,
        fiscal_year: options.fiscalYear ?? null,
        date_from: options.dateFrom ?? null,
        date_to: options.dateTo ?? null,
        size: options.size,
        offset: options.offset,
      },
    })

    if (response.error) {
      throw new Error(`Document search failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as SearchResponse
  }

  /**
   * Retrieve the full text of a document section by ID.
   *
   * @returns DocumentSection or null if not found.
   */
  async getSection(graphId: string, documentId: string): Promise<DocumentSection | null> {
    const response = await getDocumentSection({
      path: { graph_id: graphId, document_id: documentId },
    })

    if (response.response.status === 404) {
      return null
    }

    if (response.error) {
      throw new Error(`Get section failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as DocumentSection
  }

  /**
   * List indexed documents for a graph.
   */
  async list(graphId: string, sourceType?: string): Promise<DocumentListResponse> {
    const response = await listDocuments({
      path: { graph_id: graphId },
      query: sourceType ? { source_type: sourceType } : undefined,
    })

    if (response.error) {
      throw new Error(`List documents failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as DocumentListResponse
  }

  /**
   * Delete a document and all its sections.
   *
   * @returns true if deleted, false if not found.
   */
  async delete(graphId: string, documentId: string): Promise<boolean> {
    const response = await deleteDocument({
      path: { graph_id: graphId, document_id: documentId },
    })

    if (response.response.status === 204) {
      return true
    }

    if (response.response.status === 404) {
      return false
    }

    if (response.error) {
      throw new Error(`Delete document failed: ${JSON.stringify(response.error)}`)
    }

    return true
  }
}
