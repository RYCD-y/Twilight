/* This is a script to sync an album's photos/videos from its folder into its JSON */

import fs from "fs"
import path from "path"

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"])
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov"])

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error(`Error: No album id argument provided
Usage: npm run sync-album -- <album-id>`)
  process.exit(1)
}

const albumId = args[0]
const albumDir = `./src/content/albums/${albumId}/`

if (!fs.existsSync(albumDir)) {
  console.error(`Error: Album folder ${albumDir} does not exist`)
  process.exit(1)
}

const jsonFiles = fs
  .readdirSync(albumDir)
  .filter((f) => f.endsWith(".json") && f !== "_frontmatter.json")

if (jsonFiles.length === 0) {
  console.error(`Error: No album JSON found in ${albumDir}`)
  process.exit(1)
}

const jsonPath = path.join(albumDir, jsonFiles[0])

function isMediaFile(f) {
  const ext = path.extname(f).toLowerCase()
  return IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext)
}

const mediaFiles = fs
  .readdirSync(albumDir)
  .filter(isMediaFile)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

const images = mediaFiles.filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
const videos = mediaFiles.filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))

let data = {}
try {
  data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
} catch {
  console.error(`Error: Failed to parse ${jsonPath}`)
  process.exit(1)
}

const existingBySrc = new Map(
  (data.photos || []).map((p) => [path.basename(p.src), p]),
)

const photos = []

for (const f of images) {
  const existing = existingBySrc.get(f)
  photos.push(
    existing && existing.type !== "video"
      ? { ...existing, src: `./${f}` }
      : { src: `./${f}`, alt: f.replace(path.extname(f), ""), title: f.replace(path.extname(f), "") },
  )
}

for (const f of videos) {
  const existing = existingBySrc.get(f)
  photos.push(
    existing
      ? { ...existing, src: `./${f}`, type: "video" }
      : { src: `./${f}`, alt: f.replace(path.extname(f), ""), title: f.replace(path.extname(f), ""), type: "video" },
  )
}

if (photos.length > 0) {
  if (!data.cover || !fs.existsSync(path.join(albumDir, path.basename(data.cover)))) {
    data.cover = path.basename(photos[0].src)
  }
}

data.photos = photos
data.visible = data.visible !== false

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 4) + "\n")

console.log(`Synced ${jsonPath}`)
console.log(`  photos: ${images.length}  videos: ${videos.length}`)
