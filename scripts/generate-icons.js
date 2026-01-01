#!/usr/bin/env node

/**
 * Icon Generator for HuisOS PWA
 * 
 * This script generates app icons in various sizes needed for:
 * - Android: 192x192, 512x512 (regular and maskable)
 * - iOS: 180x180 (apple-touch-icon)
 * - Notifications: 72x72 (badge)
 * 
 * Requirements:
 * - Install: npm install sharp
 * 
 * Usage:
 * - node scripts/generate-icons.js <input-svg-or-png>
 * 
 * Example:
 * - node scripts/generate-icons.js icon-source.png
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const inputFile = process.argv[2]

if (!inputFile) {
  console.error('Usage: node scripts/generate-icons.js <input-file>')
  console.error('Example: node scripts/generate-icons.js icon-source.png')
  process.exit(1)
}

const inputPath = path.resolve(inputFile)

if (!fs.existsSync(inputPath)) {
  console.error(`Error: File not found: ${inputPath}`)
  process.exit(1)
}

const iconsDir = path.resolve('public/icons')
const screenshotsDir = path.resolve('public/screenshots')

// Create directories if they don't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

const icons = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'icon-maskable-192x192.png', size: 192 },
  { name: 'icon-maskable-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'badge-72x72.png', size: 72 },
]

async function generateIcons() {
  console.log('🎨 Generating icons from:', inputFile)

  try {
    for (const icon of icons) {
      const outputPath = path.join(iconsDir, icon.name)
      console.log(`  → ${icon.name}...`)

      await sharp(inputPath)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 } // slate-900
        })
        .png()
        .toFile(outputPath)
    }

    console.log('✅ Icons generated successfully!')
    console.log(`📁 Location: ${iconsDir}/`)
  } catch (error) {
    console.error('❌ Error generating icons:', error.message)
    process.exit(1)
  }
}

generateIcons()
