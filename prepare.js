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
  // The TypeScript compiler will have already built these files
  // Just copy the compiled .js and .d.ts files
  const sdkExtensionsBuilt = fs.readdirSync(extensionsSourceDir)

  sdkExtensionsBuilt.forEach((file) => {
    const sourcePath = path.join(extensionsSourceDir, file)
    const destPath = path.join(extensionsDestDir, file)

    if (file.endsWith('.js') || file.endsWith('.d.ts')) {
      // Copy compiled JavaScript and declaration files
      let content = fs.readFileSync(sourcePath, 'utf8')

      // Fix imports for published package structure (../sdk/ -> ../)
      content = content
        .replace(/require\("\.\.\/sdk\//g, 'require("../')
        .replace(/from ['"]\.\.\/sdk\//g, "from '../")

      fs.writeFileSync(destPath, content)
      console.log(`  ✓ Copied and fixed ${file}`)
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      // Copy TypeScript source files for reference
      let content = fs.readFileSync(sourcePath, 'utf8')

      // Adjust imports for published package structure
      content = content.replace(/from ['"]\.\.\/sdk\//g, "from '../")

      fs.writeFileSync(destPath, content)
      console.log(`  ✓ Copied ${file}`)
    }
  })
  console.log('  ✓ SDK extensions copied')
} else {
  console.log('  ⚠️  SDK extensions not found')
}

// Format the generated files
console.log('💅 Formatting generated files...')
try {
  execSync(
    'npx prettier --write index.ts index.js index.d.ts extensions/*.ts extensions/*.js extensions/*.d.ts',
    {
      cwd: currentDir,
      stdio: 'inherit',
    }
  )
  console.log('  ✓ Files formatted')
} catch (error) {
  console.log('  ⚠️  Formatting skipped (prettier not available)')
}

console.log('✅ SDK prepared for publishing!')
console.log('\nTo publish:')
console.log('  1. cd sdk-publish')
console.log('  2. npm publish')
