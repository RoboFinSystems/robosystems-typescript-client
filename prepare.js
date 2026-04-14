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

// Wipe the mirror before rebuilding so stale files from old sources
// (renamed clients, removed subdirectories) never linger in a publish.
// Without this, `extensions/` accumulates cruft over time — every
// file ever mirrored stays until someone deletes it by hand.
if (fs.existsSync(extensionsDestDir)) {
  fs.rmSync(extensionsDestDir, { recursive: true, force: true })
}
fs.mkdirSync(extensionsDestDir, { recursive: true })

// Copy extensions files
if (fs.existsSync(extensionsSourceDir)) {
  // The TypeScript compiler will have already built these files
  // Just copy the compiled .js and .d.ts files, and recurse into
  // subdirectories (e.g. sdk-extensions/graphql/ + generated/).
  //
  // Import rewriting: the source tree has `sdk-extensions/` and `sdk/`
  // as siblings, so imports use `../sdk/...`. In the published layout
  // `extensions/` and the generated SDK files live at the package root,
  // so imports become `../...`. We match `../sdk/` and `../../sdk/`
  // (the latter when copying a file from a nested subdirectory).
  const walk = (srcDir, destDir, depth) => {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    const entries = fs.readdirSync(srcDir, { withFileTypes: true })

    for (const entry of entries) {
      const sourcePath = path.join(srcDir, entry.name)
      const destPath = path.join(destDir, entry.name)

      if (entry.isDirectory()) {
        walk(sourcePath, destPath, depth + 1)
        continue
      }

      // Skip test files — never ship them
      if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.js')) {
        continue
      }

      if (
        entry.name.endsWith('.js') ||
        entry.name.endsWith('.d.ts') ||
        (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts'))
      ) {
        let content = fs.readFileSync(sourcePath, 'utf8')

        // Every extra directory level adds one more `..` segment to the
        // SDK-relative import path.
        const upOne = '../'.repeat(depth)
        const upToSdk = '../'.repeat(depth) + 'sdk/'
        content = content
          .replace(
            new RegExp(`require\\((['"])${upToSdk.replace(/\//g, '\\/')}`, 'g'),
            (_m, q) => `require(${q}${upOne}`
          )
          .replace(
            new RegExp(`from (['"])${upToSdk.replace(/\//g, '\\/')}`, 'g'),
            (_m, q) => `from ${q}${upOne}`
          )

        fs.writeFileSync(destPath, content)
        console.log(`  ✓ ${path.relative(extensionsSourceDir, sourcePath)}`)
      }
    }
  }

  walk(extensionsSourceDir, extensionsDestDir, 1)
  console.log('  ✓ SDK extensions copied')
} else {
  console.log('  ⚠️  SDK extensions not found')
}

// Format the generated files.
//
// The extensions glob uses `**` so nested files — e.g. everything under
// `extensions/graphql/` (client, generated types, queries/**) — get
// reformatted alongside the top-level clients. A flat `extensions/*.ts`
// would silently skip the entire GraphQL tree.
console.log('💅 Formatting generated files...')
try {
  execSync(
    'npx prettier --write index.ts index.js index.d.ts "extensions/**/*.ts" "extensions/**/*.js" "extensions/**/*.d.ts"',
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
console.log('  1. npm version <patch|minor|major>')
console.log('  2. npm publish')
