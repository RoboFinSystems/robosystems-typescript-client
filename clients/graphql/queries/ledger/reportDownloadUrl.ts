import { gql } from 'graphql-request'

/**
 * Presigned-URL download for a published Report's serialization bundle.
 *
 * Replaces the retired `GET .../reports/{id}/download` REST resource — a
 * download is a read of stored state, so it lives on the read surface.
 * Every flavor resolves to a short-lived presigned S3 URL the client
 * follows directly (JSON-LD is stamped at publish time; XBRL is
 * materialized + cached on first request). `format` accepts the
 * `ReportDownloadFormat` enum (`JSONLD`, `XBRL_2_1`).
 */
export const GET_REPORT_DOWNLOAD_URL = gql`
  query GetLedgerReportDownloadUrl(
    $reportId: String!
    $format: ReportDownloadFormat = JSONLD
    $expiresIn: Int = 300
  ) {
    reportDownloadUrl(reportId: $reportId, format: $format, expiresIn: $expiresIn) {
      downloadUrl
      expiresAt
      contentType
      format
      generationCount
    }
  }
`
