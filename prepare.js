#!/usr/bin/env node

/**
 * Prepare script for SDK publishing
 * This script copies the generated SDK files and creates the necessary structure for npm publishing
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Preparing RoboSystems SDK for publishing...')

// First, build the TypeScript
console.log('🔨 Building TypeScript...')
try {
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✅ TypeScript build complete')
} catch (error) {
  console.error('❌ TypeScript build failed:', error.message)
  process.exit(1)
}

const sdkSourceDir = path.join(__dirname, 'sdk')
const currentDir = __dirname

// Check if SDK directory exists
if (!fs.existsSync(sdkSourceDir)) {
  console.error('❌ SDK source directory not found. Please run "npm run generate" first.')
  process.exit(1)
}

// Copy all SDK files
console.log('📋 Copying SDK files...')
const filesToCopy = fs.readdirSync(sdkSourceDir)

filesToCopy.forEach((file) => {
  const sourcePath = path.join(sdkSourceDir, file)
  const destPath = path.join(currentDir, file)

  if (fs.statSync(sourcePath).isDirectory()) {
    // Copy directory recursively
    fs.cpSync(sourcePath, destPath, { recursive: true })
    console.log(`  ✓ Copied directory: ${file}/`)
  } else {
    // Copy file
    fs.copyFileSync(sourcePath, destPath)
    console.log(`  ✓ Copied file: ${file}`)
  }
})

// Create main index.js that re-exports everything
console.log('📝 Creating index files...')
const indexContent = `// Re-export everything from the generated SDK
export * from './sdk.gen.js';
export * from './types.gen.js';
export { client } from './client.gen.js';
export * from './client/index.js';

// Re-export SDK extensions
export * from './extensions/index.js';
`

fs.writeFileSync(path.join(currentDir, 'index.js'), indexContent)
console.log('  ✓ Created index.js')

// Create index.d.ts for TypeScript
const indexDtsContent = `// Re-export all types
export * from './sdk.gen';
export * from './types.gen';
export { client } from './client.gen';
export * from './client/index';

// Re-export SDK extensions
export * from './extensions/index';
`

fs.writeFileSync(path.join(currentDir, 'index.d.ts'), indexDtsContent)
console.log('  ✓ Created index.d.ts')

// Copy SDK extensions
console.log('🚀 Copying SDK extensions...')
const extensionsSourceDir = path.join(__dirname, 'sdk-extensions')
const extensionsDestDir = path.join(currentDir, 'extensions')

// Create extensions directory
if (!fs.existsSync(extensionsDestDir)) {
  fs.mkdirSync(extensionsDestDir, { recursive: true })
}

// Copy extensions files
if (fs.existsSync(extensionsSourceDir)) {
  const files = fs.readdirSync(extensionsSourceDir)
  files.forEach((file) => {
    const sourcePath = path.join(extensionsSourceDir, file)
    const destPath = path.join(extensionsDestDir, file)

    if (file.endsWith('.ts')) {
      // Process TypeScript files
      let content = fs.readFileSync(sourcePath, 'utf8')

      // Adjust imports for published package structure
      content = content
        .replace(/from ['"]\.\.\/sdk\/sdk\.gen['"]/g, "from '../sdk.gen'")
        .replace(/from ['"]\.\.\/sdk\/types\.gen['"]/g, "from '../types.gen'")
        .replace(/from ['"]\.\.\/sdk\/client\.gen['"]/g, "from '../client.gen'")

      // Save TypeScript version
      fs.writeFileSync(destPath, content)

      // Create JavaScript version
      let jsContent = content
        .replace(/export interface \w+[^}]+}/gs, '') // Remove interfaces
        .replace(/export type[^;]+;/gs, '') // Remove type exports
        .replace(/: (\w+(\[\])?|{[^}]+}|\([^)]+\) => \w+|['"][\w-]+['"])/g, '') // Remove type annotations
        .replace(/<[^>]+>/g, '') // Remove generics
        .replace(/\?:/g, ':') // Remove optional markers
        .replace(/ as \w+/g, '') // Remove type assertions
        .replace(/import type/g, 'import') // Convert type imports
        .replace(/type \w+ = [^;]+;/g, '') // Remove type aliases

      const jsFile = file.replace('.ts', '.js')
      fs.writeFileSync(path.join(extensionsDestDir, jsFile), jsContent)
      console.log(`  ✓ Copied ${file} -> ${jsFile}`)
    }
  })
  console.log('  ✓ SDK extensions copied')
} else {
  console.log('  ⚠️  SDK extensions not found')
}

// No longer copying legacy utils - using sdk-extensions instead

// Create README if it doesn't exist
const readmePath = path.join(currentDir, 'README.md')
if (!fs.existsSync(readmePath)) {
  const readmeContent = `# RoboSystems TypeScript SDK

Official TypeScript SDK for the RoboSystems Financial Knowledge Graph API with SSE support.

## Installation

\`\`\`bash
npm install @robosystems/sdk
\`\`\`

## Quick Start

\`\`\`typescript
import { client, getCurrentUser, extensions } from '@robosystems/sdk';

// Configure the client
client.setConfig({
  baseUrl: 'https://api.robosystems.ai',
  credentials: 'include'
});

// Use the SDK
const { data: user } = await getCurrentUser();

// Use SDK Extensions for enhanced features
const result = await extensions.query.query('graph_123', 'MATCH (n) RETURN n LIMIT 10');

// Monitor async operations with SSE
const opResult = await extensions.operations.monitorOperation('operation_123', {
  onProgress: (progress) => console.log(progress.message)
});
\`\`\`

## Features

- **Generated SDK**: Auto-generated from OpenAPI spec
- **SSE Support**: Real-time updates for async operations
- **Query Client**: Enhanced query execution with streaming
- **Operation Monitoring**: Track long-running operations
- **Type Safety**: Full TypeScript support

## Documentation

Full documentation available at [https://api.robosystems.ai/docs](https://api.robosystems.ai/docs)
`

  fs.writeFileSync(readmePath, readmeContent)
  console.log('  ✓ Created README.md')
}

// Run TypeScript type checking
console.log('🔍 Type checking...')
try {
  execSync(
    'npx tsc --noEmit --skipLibCheck --esModuleInterop --strict --target ES2022 --module commonjs src/*.ts',
    {
      cwd: currentDir,
      stdio: 'pipe',
    }
  )
  console.log('  ✓ Type checking passed')
} catch (error) {
  console.error('  ❌ Type checking failed:', error.stderr?.toString() || error.message)
  console.error('  ⚠️  Continuing anyway, but please review the generated files')
}

// Format the generated files
console.log('💅 Formatting files...')
try {
  // Format TypeScript files
  execSync('npx prettier --write "src/*.ts" --config ../prettier.config.cjs 2>/dev/null || true', {
    cwd: currentDir,
    stdio: 'pipe',
  })
  // Format JavaScript files
  execSync('npx prettier --write "src/*.js" --config ../prettier.config.cjs 2>/dev/null || true', {
    cwd: currentDir,
    stdio: 'pipe',
  })
  console.log('  ✓ Files formatted')
} catch (error) {
  console.log('  ⚠️  Formatting skipped (prettier not available)')
}

console.log('✅ SDK prepared for publishing!')
console.log('\nTo publish:')
console.log('  1. cd sdk-publish')
console.log('  2. npm publish')
