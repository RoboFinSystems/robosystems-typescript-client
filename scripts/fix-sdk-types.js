#!/usr/bin/env node
/* eslint-env node */

const fs = require('fs')
const path = require('path')

const fixFile = (filePath, description) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    // 1. Fix problematic TypeScript types
    // Remove problematic union type with empty object
    if (content.includes(' | (string & {})')) {
      content = content.replace(/ \| \(string & \{\}\)/g, '')
      modified = true
    }

    // Replace problematic intersection type with simple string
    if (content.includes('(string & {})')) {
      content = content.replace(/\(string & \{\}\)/g, 'string')
      modified = true
    }

    // 2. Add ESLint disable for undefined globals in generated files
    // This handles RequestInit and globalThis which are valid in browser/Node but ESLint doesn't recognize
    if (
      (content.includes('RequestInit') || content.includes('globalThis')) &&
      !content.includes('/* eslint-disable')
    ) {
      // Add after the auto-generated comment to preserve it
      content = content.replace(
        /(This file is auto-generated[^\n]*\n)/,
        '$1/* eslint-disable no-undef */\n'
      )
      modified = true
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Fixed ${description}`)
    }
  } catch (error) {
    console.error(`❌ Error fixing ${description}:`, error.message)
  }
}

const sdkDir = path.join(__dirname, '../sdk')

// Files that need fixing
const filesToFix = [
  'types.gen.ts', // Main types file with union/intersection issues
  'client/client.gen.ts', // Uses RequestInit and globalThis
  'client/types.gen.ts', // Uses RequestInit
  'core/types.gen.ts', // Uses RequestInit
]

// Apply fixes to each file
filesToFix.forEach((file) => {
  const filePath = path.join(sdkDir, file)
  if (fs.existsSync(filePath)) {
    fixFile(filePath, file)
  }
})

console.log('✅ SDK fixes completed')
