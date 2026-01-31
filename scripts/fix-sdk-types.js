#!/usr/bin/env node
/**
 * Post-generation fixes for @hey-api/openapi-ts output
 *
 * This script fixes issues in the generated SDK that would otherwise cause build failures.
 * It runs automatically after SDK generation via `npm run generate:fix`.
 *
 * Current fixes:
 * 1. Remove unused @ts-expect-error directives (openapi-ts generates these but they're not needed)
 * 2. Simplify `(string & {})` type patterns (optional, improves compatibility)
 */

const fs = require('fs')
const path = require('path')

const sdkDir = path.join(__dirname, '../sdk')

/**
 * Fix TypeScript files in the SDK directory
 */
function fixSdkFile(filePath) {
  if (!fs.existsSync(filePath)) return false

  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  // Fix 1: Remove unused @ts-expect-error directives that cause TS2578 build errors
  // openapi-ts v0.90+ generates these but they're not needed
  if (content.includes('// @ts-expect-error\n    const { opts, url }')) {
    content = content.replace('// @ts-expect-error\n    const { opts, url }', 'const { opts, url }')
    modified = true
  }

  // Fix 2: Simplify (string & {}) patterns for better type compatibility
  // This pattern is used for branded strings but can cause issues with some TS configs
  if (content.includes('(string & {})')) {
    content = content.replace(/ \| \(string & \{\}\)/g, '')
    content = content.replace(/\(string & \{\}\)/g, 'string')
    modified = true
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
    return true
  }
  return false
}

// Files that commonly need fixes
const filesToFix = ['types.gen.ts', 'client/client.gen.ts']

let fixedCount = 0
filesToFix.forEach((file) => {
  const filePath = path.join(sdkDir, file)
  if (fixSdkFile(filePath)) {
    console.log(`✅ Fixed sdk/${file}`)
    fixedCount++
  }
})

if (fixedCount === 0) {
  console.log('✅ No fixes needed')
} else {
  console.log(`✅ Applied ${fixedCount} fix(es)`)
}
