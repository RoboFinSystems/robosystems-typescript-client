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

const fixJavaScriptFile = (filePath, description) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    // Add ESLint disable comment for require statements
    // These are CommonJS files, so require() is appropriate
    if (content.includes('require(') && !content.includes('/* eslint-disable')) {
      // Find position after 'use strict' or 'use client'
      const useMatch = content.match(/^(['"])use (strict|client)\1\n?/m)
      if (useMatch) {
        const insertPos = useMatch.index + useMatch[0].length
        content =
          content.slice(0, insertPos) +
          '/* eslint-disable @typescript-eslint/no-var-requires */\n' +
          content.slice(insertPos)
      } else {
        content = '/* eslint-disable @typescript-eslint/no-var-requires */\n' + content
      }
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

const fixTypeScriptDeclarationFile = (filePath, description) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    // Fix import() type annotations - convert to proper type imports
    // Match: import("./QueryClient").QueryResult
    const importTypePattern = /import\(["']([^"']+)["']\)\.(\w+)/g

    if (importTypePattern.test(content)) {
      content = content.replace(importTypePattern, (match, modulePath, typeName) => {
        // For now, we'll keep the import() syntax but add an ESLint disable
        return match
      })

      // Add ESLint disable comment for import() type annotations
      if (!content.includes('/* eslint-disable')) {
        content = '/* eslint-disable @typescript-eslint/consistent-type-imports */\n' + content
        modified = true
      }
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
const extensionsDir = path.join(__dirname, '../sdk-extensions')

// Files that need fixing in SDK directory
const sdkFilesToFix = [
  'types.gen.ts', // Main types file with union/intersection issues
  'client/client.gen.ts', // Uses RequestInit and globalThis
  'client/types.gen.ts', // Uses RequestInit
  'core/types.gen.ts', // Uses RequestInit
]

// JavaScript files in sdk-extensions that need require() fixes
const extensionJsFiles = ['OperationClient.js', 'QueryClient.js', 'hooks.js', 'index.js']

// TypeScript declaration files that need import() fixes
const extensionDtsFiles = ['index.d.ts']

// Apply fixes to SDK files
sdkFilesToFix.forEach((file) => {
  const filePath = path.join(sdkDir, file)
  if (fs.existsSync(filePath)) {
    fixFile(filePath, `sdk/${file}`)
  }
})

// Apply fixes to sdk-extensions JavaScript files
extensionJsFiles.forEach((file) => {
  const filePath = path.join(extensionsDir, file)
  if (fs.existsSync(filePath)) {
    fixJavaScriptFile(filePath, `sdk-extensions/${file}`)
  }
})

// Apply fixes to sdk-extensions TypeScript declaration files
extensionDtsFiles.forEach((file) => {
  const filePath = path.join(extensionsDir, file)
  if (fs.existsSync(filePath)) {
    fixTypeScriptDeclarationFile(filePath, `sdk-extensions/${file}`)
  }
})

console.log('✅ SDK and extensions fixes completed')
