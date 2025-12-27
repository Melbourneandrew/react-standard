#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const http = require("http")
const { execSync } = require("child_process")

const ARTIFACTS_DIR = __dirname
const RUNS_DIR = path.join(ARTIFACTS_DIR, "runs")
const PORT = 3333

// Kill any existing process on the port and wait for it to release
function killPort(port) {
  try {
    if (process.platform === "win32") {
      execSync(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /PID %a /F`, { stdio: "ignore" })
    } else {
      const pids = execSync(`lsof -ti:${port} 2>/dev/null`, { encoding: "utf8" }).trim()
      if (pids) {
        pids.split("\n").forEach(pid => {
          try { execSync(`kill -9 ${pid}`, { stdio: "ignore" }) } catch {}
        })
      }
    }
  } catch {
    // No process to kill
  }
}

killPort(PORT)
// Small delay to let OS release the port
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
;(async () => {
  await sleep(100)

function scanRuns() {
  const runs = []

  if (!fs.existsSync(RUNS_DIR)) {
    return runs
  }

  const runDirs = fs
    .readdirSync(RUNS_DIR)
    .filter((d) => fs.statSync(path.join(RUNS_DIR, d)).isDirectory())
    .sort((a, b) => parseInt(b) - parseInt(a)) // newest first

  for (const runId of runDirs) {
    const runPath = path.join(RUNS_DIR, runId)
    const workers = fs
      .readdirSync(runPath)
      .filter(
        (d) =>
          d.startsWith("worker-") &&
          fs.statSync(path.join(runPath, d)).isDirectory()
      )
      .sort((a, b) => {
        const numA = parseInt(a.replace("worker-", ""))
        const numB = parseInt(b.replace("worker-", ""))
        return numA - numB
      })

    const timestamp = parseInt(runId)
    const date = new Date(timestamp * 1000)

    const runData = {
      id: runId,
      date: date.toISOString(),
      dateFormatted: date.toLocaleString(),
      relativeTime: getRelativeTime(date),
      workerCount: workers.length,
      workers: {},
      videos: [],
      passed: 0,
      failed: 0,
    }

    for (const worker of workers) {
      const workerPath = path.join(runPath, worker)
      const testDirs = fs
        .readdirSync(workerPath)
        .filter((d) => fs.statSync(path.join(workerPath, d)).isDirectory())

      runData.workers[worker] = []

      for (const testDir of testDirs) {
        const testPath = path.join(workerPath, testDir)
        const files = fs.readdirSync(testPath)

        const hasVideo = files.includes("video.webm")
        const hasError = files.includes("error-context.md")

        if (hasVideo) {
          // Parse test name from directory
          let cleanName = testDir
            .replace(/-chromium$/, "")
            .replace(/-demo$/, "")
            .replace(/-retry\d+$/, "")

          // Get the feature
          const parts = testDir.split("-")
          const feature = parts[0].replace(/-/g, " ")

          // Extract a cleaner name
          const featureMatch = cleanName.match(/^([a-z-]+)-([A-Z][a-zA-Z-]+)-/)
          if (featureMatch) {
            cleanName = cleanName.substring(featureMatch[0].length - 1)
          }

          // Check for thumbnail
          const hasThumbnail = files.includes("thumbnail.jpg")

          const video = {
            id: `${runId}-${worker}-${testDir}`,
            runId,
            worker,
            workerNum: parseInt(worker.replace("worker-", "")),
            testDir,
            testName: cleanName,
            feature,
            hasError,
            hasThumbnail,
            videoPath: `/runs/${runId}/${worker}/${testDir}/video.webm`,
            thumbnailPath: hasThumbnail
              ? `/runs/${runId}/${worker}/${testDir}/thumbnail.jpg`
              : null,
          }

          runData.videos.push(video)
          runData.workers[worker].push(video)

          if (hasError) {
            runData.failed++
          } else {
            runData.passed++
          }
        }
      }
    }

    if (runData.videos.length > 0) {
      runs.push(runData)
    }
  }

  return runs
}

function getRelativeTime(date) {
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function generateVideoCard(video, run) {
  // Use thumbnail image if available, otherwise show a placeholder (never load video)
  const thumbnailContent = video.hasThumbnail
    ? `<img class="thumbnail-img" src="${video.thumbnailPath}" alt="${video.testName}" loading="lazy" />`
    : `<div class="thumbnail-placeholder">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
           <rect x="2" y="4" width="20" height="16" rx="2"/>
           <path d="M10 9l5 3-5 3V9z"/>
         </svg>
         <span>No preview</span>
       </div>`

  return `
    <div class="video-card"
         data-video-path="${video.videoPath}"
         data-title="${video.testName}"
         data-feature="${video.feature}"
         data-has-error="${video.hasError}"
         data-run-id="${run.id}"
         onclick="openVideo(this)">
      <div class="thumbnail-container">
        ${thumbnailContent}
        <span class="status-badge ${video.hasError ? "error" : "success"}">${video.hasError ? "Failed" : "Passed"}</span>
        <button class="open-btn" onclick="event.stopPropagation(); window.open('${video.videoPath}', '_blank')" title="Open in new tab">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
          </svg>
        </button>
        <div class="thumbnail-overlay">
          <div class="play-button">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <div class="video-info">
        <div class="video-title">${video.testName}</div>
        <div class="video-meta">
          <span class="feature">${video.feature}</span>
        </div>
      </div>
    </div>
  `
}

function generateRunVideos(run) {
  const workerNames = Object.keys(run.workers).sort((a, b) => {
    const numA = parseInt(a.replace("worker-", ""))
    const numB = parseInt(b.replace("worker-", ""))
    return numA - numB
  })

  // Single worker: render as standalone grid
  if (workerNames.length === 1) {
    return `
      <div class="run-videos single-worker">
        ${run.videos.map((video) => generateVideoCard(video, run)).join("")}
      </div>
    `
  }

  // Multiple workers: render as a grid with workers as columns
  // Find the max number of videos across all workers
  const maxVideos = Math.max(
    ...workerNames.map((w) => run.workers[w].length)
  )

  return `
    <div class="run-videos multi-worker" style="--worker-count: ${workerNames.length}">
      <div class="worker-grid-header">
        ${workerNames
          .map(
            (w) => `
          <div class="worker-column-header">
            <span class="worker-label">${w}</span>
            <span class="worker-count">${run.workers[w].length} video${run.workers[w].length !== 1 ? "s" : ""}</span>
          </div>
        `
          )
          .join("")}
      </div>
      <div class="worker-grid">
        ${workerNames
          .map(
            (w) => `
          <div class="worker-column" data-worker="${w}">
            ${run.workers[w].map((video) => generateVideoCard(video, run)).join("")}
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `
}

function generateHTML(runs) {
  const totalVideos = runs.reduce((sum, r) => sum + r.videos.length, 0)
  const totalFailed = runs.reduce((sum, r) => sum + r.failed, 0)
  const totalPassed = runs.reduce((sum, r) => sum + r.passed, 0)

  // Calculate time range for slider
  const timestamps = runs.map(r => parseInt(r.id))
  const minTime = timestamps.length > 0 ? Math.min(...timestamps) : 0
  const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : 0

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Playwright Videos</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --bg-primary: #0f0f0f;
      --bg-secondary: #1a1a1a;
      --bg-hover: #272727;
      --bg-active: #3a3a3a;
      --text-primary: #f1f1f1;
      --text-secondary: #aaaaaa;
      --text-muted: #717171;
      --accent: #3ea6ff;
      --error: #ff4e45;
      --success: #2ba640;
      --border: #303030;
    }

    /* Light mode - modern & refined */
    :root.light {
      --bg-primary: #ffffff;
      --bg-secondary: #f8f9fa;
      --bg-hover: #f1f3f4;
      --bg-active: #e8eaed;
      --text-primary: #202124;
      --text-secondary: #5f6368;
      --text-muted: #5f6368;
      --accent: #1a73e8;
      --error: #d93025;
      --success: #1e8e3e;
      --border: #dadce0;
    }

    :root.light .header {
      background: #ffffff;
      border-bottom-color: #dadce0;
    }

    :root.light .filter-label {
      color: #5f6368;
      font-weight: 500;
    }

    :root.light .ai-sidebar {
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
    }

    :root.light .ai-message.assistant .ai-message-bubble {
      background: #f1f3f4;
      color: #202124;
    }

    :root.light .ai-code-block {
      background: #f8f9fa;
      border-color: #dadce0;
    }

    :root.light .video-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    :root.light .segment-btn.active {
      background: #202124;
      color: #ffffff;
    }

    :root.light .segment-control {
      background: #f1f3f4;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      line-height: 1.4;
    }

    .header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
    }

    .header-content {
      max-width: 1800px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--text-primary);
      text-decoration: none;
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .theme-toggle {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s, background 0.15s;
    }

    .theme-toggle:hover {
      color: var(--text-primary);
      background: var(--bg-hover);
    }

    .theme-toggle .icon-moon {
      display: none;
    }

    :root.light .theme-toggle .icon-sun {
      display: none;
    }

    :root.light .theme-toggle .icon-moon {
      display: block;
    }

    /* Compound Filter Bar */
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      flex: 1;
      align-items: flex-end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .filter-label {
      font-size: 0.65rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .segment-control {
      display: flex;
      background: var(--bg-secondary);
      border-radius: 8px;
      padding: 3px;
      gap: 2px;
    }

    .segment-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .segment-btn:hover {
      color: var(--text-primary);
    }

    .segment-btn.active {
      background: var(--text-primary);
      color: var(--bg-primary);
    }

    /* Time Range Slider */
    .time-slider-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 200px;
    }

    .time-slider-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: var(--text-muted);
      order: -1;
    }

    .time-slider-track {
      position: relative;
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      cursor: pointer;
    }

    .time-slider-range {
      position: absolute;
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: 4px;
      pointer-events: none;
    }

    .time-slider-handle {
      position: absolute;
      top: 50%;
      width: 16px;
      height: 16px;
      background: var(--text-primary);
      border: 2px solid var(--bg-primary);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      cursor: grab;
      z-index: 2;
      transition: transform 0.1s;
    }

    .time-slider-handle:hover,
    .time-slider-handle:active {
      transform: translate(-50%, -50%) scale(1.2);
    }

    .time-slider-handle:active {
      cursor: grabbing;
    }

    .time-slider-label {
      background: var(--bg-secondary);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .time-slider-label.active {
      color: var(--text-primary);
      background: var(--bg-hover);
    }

    .search-input {
      width: 200px;
      padding: 7px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 0.8rem;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .search-input:focus {
      border-color: var(--text-muted);
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
      width: 280px;
    }

    .search-input::placeholder {
      color: var(--text-muted);
    }

    .active-filters {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      align-items: center;
      align-self: flex-end;
    }

    .filter-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      border-radius: 6px;
      font-size: 0.75rem;
      color: #a5b4fc;
    }

    .filter-chip-remove {
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.15s;
    }

    .filter-chip-remove:hover {
      opacity: 1;
    }

    .clear-filters {
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: transparent;
      color: var(--text-muted);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .clear-filters:hover {
      border-color: var(--error);
      color: var(--error);
    }

    .stats {
      display: flex;
      gap: 16px;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stat-value {
      font-weight: 600;
      color: var(--text-primary);
    }

    .container {
      max-width: 1800px;
      margin: 0 auto;
      padding: 24px;
    }

    /* Run sections */
    .run-section {
      margin-bottom: 32px;
    }

    .run-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
      cursor: pointer;
      user-select: none;
    }

    .run-header:hover {
      opacity: 0.9;
    }

    .run-toggle {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      transition: transform 0.2s;
    }

    .run-section.collapsed .run-toggle {
      transform: rotate(-90deg);
    }

    .run-info {
      flex: 1;
    }

    .run-title {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .run-time {
      font-weight: 400;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .run-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .worker-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .worker-badge svg {
      width: 12px;
      height: 12px;
    }

    .run-stats {
      display: flex;
      gap: 12px;
    }

    .run-stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .run-stat.passed {
      color: var(--success);
    }

    .run-stat.failed {
      color: var(--error);
    }

    .run-stat-icon {
      width: 16px;
      height: 16px;
    }

    /* Single worker layout */
    .run-videos.single-worker {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    @media (min-width: 1200px) {
      .run-videos.single-worker {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      }
    }

    /* Multi-worker layout */
    .run-videos.multi-worker {
      overflow-x: auto;
    }

    .worker-grid-header {
      display: grid;
      grid-template-columns: repeat(var(--worker-count), minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 56px;
      background: var(--bg-primary);
      z-index: 10;
    }

    .worker-column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--bg-secondary);
      border-radius: 8px;
    }

    .worker-label {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary);
    }

    .worker-count {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .worker-grid {
      display: grid;
      grid-template-columns: repeat(var(--worker-count), minmax(280px, 1fr));
      gap: 16px;
    }

    .worker-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .run-section.collapsed .run-videos {
      display: none;
    }

    .video-card {
      display: flex;
      flex-direction: column;
      cursor: pointer;
      border-radius: 12px;
      overflow: hidden;
      transition: transform 0.15s;
    }

    .video-card:hover {
      transform: scale(1.02);
    }

    .video-card:hover .thumbnail-overlay {
      opacity: 1;
    }

    .thumbnail-container {
      position: relative;
      aspect-ratio: 16 / 9;
      background: var(--bg-secondary);
      border-radius: 12px;
      overflow: hidden;
    }

    .thumbnail-video,
    .thumbnail-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: #000;
    }

    .thumbnail-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--text-muted);
    }

    .thumbnail-placeholder svg {
      width: 48px;
      height: 48px;
      opacity: 0.4;
    }

    .thumbnail-placeholder span {
      font-size: 0.75rem;
      opacity: 0.6;
    }

    .thumbnail-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s;
    }

    .play-button {
      width: 68px;
      height: 48px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .play-button svg {
      width: 24px;
      height: 24px;
      fill: white;
      margin-left: 4px;
    }

    .status-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.error {
      background: var(--error);
      color: white;
    }

    .status-badge.success {
      background: var(--success);
      color: white;
    }

    .open-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      background: rgba(0, 0, 0, 0.7);
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s, background 0.15s;
    }

    .video-card:hover .open-btn {
      opacity: 1;
    }

    .open-btn:hover {
      background: rgba(0, 0, 0, 0.9);
    }

    .video-info {
      padding: 12px 4px;
      display: flex;
      flex-direction: column;
    }

    .video-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.35;
      min-height: 2.7em; /* Reserve space for 2 lines */
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .video-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .video-meta .feature {
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* Video Player Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.95);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 40px;
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal-content {
      width: 100%;
      max-width: 1200px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .modal-title {
      flex: 1;
    }

    .modal-title h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .modal-title p {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .modal-actions {
      display: flex;
      gap: 8px;
    }

    .modal-btn {
      padding: 8px 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: transparent;
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }

    .modal-btn:hover {
      background: var(--bg-hover);
    }

    .modal-btn.primary {
      background: var(--accent);
      border-color: var(--accent);
      color: black;
    }

    .modal-btn.primary:hover {
      background: #5bb8ff;
    }

    .modal-video {
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #000;
      border-radius: 12px;
    }

    .modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border: none;
      background: var(--bg-secondary);
      border-radius: 50%;
      color: var(--text-primary);
      font-size: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-close:hover {
      background: var(--bg-hover);
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: var(--text-muted);
    }

    .empty-state svg {
      width: 80px;
      height: 80px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .collapse-all-btn {
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: transparent;
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }

    .collapse-all-btn:hover {
      background: var(--bg-hover);
    }

    /* AI Chat Sidebar - Fixed overlay with animation */
    .ai-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: 520px;
      height: 100vh;
      background: var(--bg-secondary);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      z-index: 500;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
      transform: translateX(0);
      transition: transform 0.25s ease;
    }

    .ai-sidebar.hidden {
      transform: translateX(100%);
      pointer-events: none;
    }

    .ai-toggle-btn {
      display: none;
    }

    .ai-sidebar.hidden ~ .ai-toggle-btn {
      display: flex;
    }

    .ai-sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--bg-primary);
      min-height: 60px;
    }

    .ai-sidebar-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .ai-sidebar-title svg {
      color: var(--accent);
    }

    .ai-sidebar-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .ai-sidebar-btn:hover {
      color: var(--text-primary);
      background: var(--bg-hover);
    }

    .ai-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .ai-message {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ai-message.user {
      align-items: flex-end;
    }

    .ai-message-bubble {
      max-width: 90%;
      padding: 12px 14px;
      border-radius: 16px;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .ai-message.user .ai-message-bubble {
      background: var(--accent);
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    .ai-message.assistant .ai-message-bubble {
      background: var(--bg-primary);
      color: var(--text-primary);
      border-bottom-left-radius: 4px;
    }

    .ai-message-bubble code {
      background: rgba(0,0,0,0.2);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.8rem;
    }

    .ai-message.assistant .ai-message-bubble code {
      background: var(--bg-hover);
    }

    .ai-message-meta {
      font-size: 0.7rem;
      color: var(--text-muted);
      padding: 0 4px;
    }

    .ai-code-block {
      background: var(--bg-hover);
      border-radius: 8px;
      padding: 12px;
      margin-top: 8px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.75rem;
      overflow-x: auto;
      border: 1px solid var(--border);
    }

    .ai-code-block .filename {
      color: var(--text-muted);
      margin-bottom: 8px;
      font-size: 0.7rem;
    }

    .ai-code-block pre {
      margin: 0;
      color: var(--text-secondary);
    }

    .ai-code-block .highlight {
      background: rgba(255, 78, 69, 0.2);
      display: block;
      margin: 0 -12px;
      padding: 0 12px;
    }

    .ai-video-ref {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-hover);
      padding: 8px 12px;
      border-radius: 8px;
      margin-top: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .ai-video-ref:hover {
      background: var(--bg-active);
    }

    .ai-video-ref-icon {
      width: 32px;
      height: 32px;
      background: var(--error);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ai-video-ref-icon.success {
      background: var(--success);
    }

    .ai-video-ref-info {
      flex: 1;
    }

    .ai-video-ref-title {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .ai-video-ref-meta {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .ai-chat-input {
      padding: 16px;
      border-top: 1px solid var(--border);
      background: var(--bg-primary);
    }

    .ai-chat-input-wrapper {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .ai-chat-input textarea {
      flex: 1;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 14px;
      color: var(--text-primary);
      font-size: 0.875rem;
      resize: none;
      outline: none;
      font-family: inherit;
      min-height: 40px;
      max-height: 120px;
    }

    .ai-chat-input textarea::placeholder {
      color: var(--text-muted);
    }

    .ai-chat-input-send {
      background: var(--accent);
      border: none;
      border-radius: 10px;
      padding: 10px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ai-chat-input-send svg {
      color: #000;
    }

    /* AI Toggle Button */
    .ai-toggle-btn {
      position: fixed;
      bottom: 24px;
      left: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
      z-index: 999;
    }

    .ai-toggle-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
    }

    .ai-toggle-btn svg {
      color: white;
    }

    .ai-sidebar.open ~ .ai-toggle-btn {
      display: none;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-content">
      <a href="/" class="logo">
        <span class="logo-icon">🎭</span>
      </a>

      <button class="theme-toggle" id="theme-toggle" title="Toggle theme">
        <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>

      <div class="filter-bar">
        <!-- Status filter -->
        <div class="filter-group">
          <span class="filter-label">Status</span>
          <div class="segment-control" id="status-filter">
            <button class="segment-btn active" data-value="all">All</button>
            <button class="segment-btn" data-value="passed">Passed</button>
            <button class="segment-btn" data-value="failed">Failed</button>
          </div>
        </div>

        <!-- Time filter with slider -->
        <div class="filter-group">
          <span class="filter-label">Time</span>
          <div class="time-slider-container" id="time-slider" data-min="${minTime}" data-max="${maxTime}">
            <div class="time-slider-track">
              <div class="time-slider-range"></div>
              <div class="time-slider-handle" data-handle="start"></div>
              <div class="time-slider-handle" data-handle="end"></div>
            </div>
            <div class="time-slider-labels">
              <span class="time-slider-label" id="time-label-start">--</span>
              <span class="time-slider-label" id="time-label-end">--</span>
            </div>
          </div>
        </div>

        <!-- Workers filter -->
        <div class="filter-group">
          <span class="filter-label">Workers</span>
          <div class="segment-control" id="worker-filter">
            <button class="segment-btn active" data-value="all">All</button>
            <button class="segment-btn" data-value="single">Single</button>
            <button class="segment-btn" data-value="multi">Multi</button>
          </div>
        </div>

        <!-- Text search -->
        <div class="filter-group">
          <span class="filter-label">Search</span>
          <input type="text" class="search-input" id="search" placeholder="Test names..." autocomplete="off" />
        </div>

        <!-- Active filters display & clear -->
        <div class="active-filters" id="active-filters"></div>
      </div>

      <button class="collapse-all-btn" id="collapse-toggle">Collapse All</button>

      <div class="stats">
        <div class="stat">
          <span class="stat-value">${runs.length}</span>
          <span>runs</span>
        </div>
        <div class="stat">
          <span class="stat-value">${totalVideos}</span>
          <span>videos</span>
        </div>
        <div class="stat">
          <span class="stat-value" style="color: var(--success)">${totalPassed}</span>
          <span>passed</span>
        </div>
        <div class="stat">
          <span class="stat-value" style="color: var(--error)">${totalFailed}</span>
          <span>failed</span>
        </div>
      </div>
    </div>
  </header>

  <div class="container">
    ${
      runs.length === 0
        ? `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <h3>No test videos found</h3>
        <p>Run some Playwright tests with video recording enabled</p>
      </div>
    `
        : runs
            .map(
              (run) => `
      <section class="run-section" data-run-id="${run.id}" data-has-failed="${run.failed > 0}" data-worker-count="${run.workerCount}">
        <div class="run-header" onclick="toggleRun('${run.id}')">
          <div class="run-toggle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <div class="run-info">
            <div class="run-title">
              Run #${run.id}
              <span class="run-time">${run.relativeTime}</span>
            </div>
            <div class="run-meta">
              ${run.dateFormatted}
              ${
                run.workerCount > 1
                  ? `
                <span class="worker-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  ${run.workerCount} workers
                </span>
              `
                  : ""
              }
            </div>
          </div>
          <div class="run-stats">
            <div class="run-stat passed">
              <svg class="run-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              ${run.passed}
            </div>
            <div class="run-stat failed">
              <svg class="run-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              ${run.failed}
            </div>
          </div>
        </div>
        ${generateRunVideos(run)}
      </section>
    `
            )
            .join("")
    }
  </div>

  <div class="modal-overlay" id="modal" onclick="closeModal(event)">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <div class="modal-content" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div class="modal-title">
          <h2 id="modal-video-title"></h2>
          <p id="modal-video-meta"></p>
        </div>
        <div class="modal-actions">
          <a class="modal-btn primary" id="modal-open-link" href="#" target="_blank">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
            Open in new tab
          </a>
        </div>
      </div>
      <video class="modal-video" id="modal-video" controls autoplay></video>
    </div>
  </div>

  <script>
    // DOM Elements
    const runSections = document.querySelectorAll('.run-section');
    const videoCards = document.querySelectorAll('.video-card');
    const searchInput = document.getElementById('search');
    const statusFilter = document.getElementById('status-filter');
    const timeSlider = document.getElementById('time-slider');
    const workerFilter = document.getElementById('worker-filter');
    const activeFiltersContainer = document.getElementById('active-filters');

    // Time slider setup
    const timeMin = parseInt(timeSlider.dataset.min) || 0;
    const timeMax = parseInt(timeSlider.dataset.max) || Math.floor(Date.now() / 1000);
    const timeRange = timeMax - timeMin || 1;
    const sliderTrack = timeSlider.querySelector('.time-slider-track');
    const sliderRange = timeSlider.querySelector('.time-slider-range');
    const sliderHandles = timeSlider.querySelectorAll('.time-slider-handle');
    const timeLabelStart = document.getElementById('time-label-start');
    const timeLabelEnd = document.getElementById('time-label-end');

    // Filter state
    const filters = {
      status: 'all',
      timeStart: timeMin,
      timeEnd: timeMax,
      workers: 'all',
      search: ''
    };

    // Format timestamp for display
    function formatTime(ts) {
      const d = new Date(ts * 1000);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Now';
      if (diffMins < 60) return diffMins + 'm ago';
      if (diffHours < 24) return diffHours + 'h ago';
      if (diffDays < 7) return diffDays + 'd ago';
      return d.toLocaleDateString();
    }

    // Update slider UI
    function updateSliderUI() {
      const startPct = ((filters.timeStart - timeMin) / timeRange) * 100;
      const endPct = ((filters.timeEnd - timeMin) / timeRange) * 100;

      sliderHandles[0].style.left = startPct + '%';
      sliderHandles[1].style.left = endPct + '%';
      sliderRange.style.left = startPct + '%';
      sliderRange.style.width = (endPct - startPct) + '%';

      timeLabelStart.textContent = formatTime(filters.timeStart);
      timeLabelEnd.textContent = formatTime(filters.timeEnd);

      const isFullRange = filters.timeStart === timeMin && filters.timeEnd === timeMax;
      timeLabelStart.classList.toggle('active', !isFullRange);
      timeLabelEnd.classList.toggle('active', !isFullRange);
    }

    // Initialize slider
    updateSliderUI();

    // Slider drag handling
    let activeHandle = null;

    sliderHandles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        activeHandle = handle.dataset.handle;
        document.addEventListener('mousemove', onSliderDrag);
        document.addEventListener('mouseup', onSliderDragEnd);
      });
    });

    function onSliderDrag(e) {
      if (!activeHandle) return;

      const rect = sliderTrack.getBoundingClientRect();
      let pct = (e.clientX - rect.left) / rect.width;
      pct = Math.max(0, Math.min(1, pct));

      const newTime = Math.round(timeMin + pct * timeRange);

      if (activeHandle === 'start') {
        filters.timeStart = Math.min(newTime, filters.timeEnd);
      } else {
        filters.timeEnd = Math.max(newTime, filters.timeStart);
      }

      updateSliderUI();
      applyFilters();
    }

    function onSliderDragEnd() {
      activeHandle = null;
      document.removeEventListener('mousemove', onSliderDrag);
      document.removeEventListener('mouseup', onSliderDragEnd);
    }

    // Double-click to reset slider
    sliderTrack.addEventListener('dblclick', () => {
      filters.timeStart = timeMin;
      filters.timeEnd = timeMax;
      updateSliderUI();
      applyFilters();
    });

    // Toggle run collapse
    function toggleRun(runId) {
      const section = document.querySelector('.run-section[data-run-id="' + runId + '"]');
      section.classList.toggle('collapsed');
    }

    // Collapse/expand all
    let allCollapsed = false;
    document.getElementById('collapse-toggle').addEventListener('click', () => {
      allCollapsed = !allCollapsed;
      runSections.forEach(section => {
        if (allCollapsed) {
          section.classList.add('collapsed');
        } else {
          section.classList.remove('collapsed');
        }
      });
      document.getElementById('collapse-toggle').textContent = allCollapsed ? 'Expand All' : 'Collapse All';
    });

    // Update active filters display
    function updateActiveFilters() {
      const chips = [];

      if (filters.status !== 'all') {
        chips.push({ key: 'status', label: filters.status === 'passed' ? 'Passed' : 'Failed' });
      }
      if (filters.timeStart !== timeMin || filters.timeEnd !== timeMax) {
        chips.push({ key: 'time', label: formatTime(filters.timeStart) + ' → ' + formatTime(filters.timeEnd) });
      }
      if (filters.workers !== 'all') {
        chips.push({ key: 'workers', label: filters.workers === 'single' ? 'Single worker' : 'Multi worker' });
      }
      if (filters.search) {
        chips.push({ key: 'search', label: '"' + filters.search + '"' });
      }

      if (chips.length === 0) {
        activeFiltersContainer.innerHTML = '';
        return;
      }

      activeFiltersContainer.innerHTML = chips.map(chip =>
        '<span class="filter-chip">' + chip.label +
        '<span class="filter-chip-remove" data-filter="' + chip.key + '">×</span></span>'
      ).join('') + '<button class="clear-filters" id="clear-all">Clear all</button>';

      // Attach remove handlers
      activeFiltersContainer.querySelectorAll('.filter-chip-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.filter;

          // Update UI and state
          if (key === 'status') {
            filters.status = 'all';
            statusFilter.querySelectorAll('.segment-btn').forEach(b => b.classList.toggle('active', b.dataset.value === 'all'));
          } else if (key === 'time') {
            filters.timeStart = timeMin;
            filters.timeEnd = timeMax;
            updateSliderUI();
          } else if (key === 'workers') {
            filters.workers = 'all';
            workerFilter.querySelectorAll('.segment-btn').forEach(b => b.classList.toggle('active', b.dataset.value === 'all'));
          } else if (key === 'search') {
            filters.search = '';
            searchInput.value = '';
          }

          applyFilters();
        });
      });

      document.getElementById('clear-all').addEventListener('click', () => {
        filters.status = 'all';
        filters.timeStart = timeMin;
        filters.timeEnd = timeMax;
        filters.workers = 'all';
        filters.search = '';
        searchInput.value = '';
        statusFilter.querySelectorAll('.segment-btn').forEach(b => b.classList.toggle('active', b.dataset.value === 'all'));
        updateSliderUI();
        workerFilter.querySelectorAll('.segment-btn').forEach(b => b.classList.toggle('active', b.dataset.value === 'all'));
        applyFilters();
      });
    }

    // Apply all filters
    function applyFilters() {
      videoCards.forEach(card => {
        let show = true;

        const hasError = card.dataset.hasError === 'true';
        const title = (card.dataset.title || '').toLowerCase();
        const feature = (card.dataset.feature || '').toLowerCase();
        const videoPath = (card.dataset.videoPath || '').toLowerCase();
        const section = card.closest('.run-section');
        const workerCount = section ? parseInt(section.dataset.workerCount || '1') : 1;
        const timestamp = section ? parseInt(section.dataset.runId || '0') : 0;

        // Status filter
        if (filters.status === 'passed') {
          show = show && !hasError;
        } else if (filters.status === 'failed') {
          show = show && hasError;
        }

        // Time filter (slider range)
        if (filters.timeStart !== timeMin || filters.timeEnd !== timeMax) {
          show = show && timestamp >= filters.timeStart && timestamp <= filters.timeEnd;
        }

        // Workers filter
        if (filters.workers === 'single') {
          show = show && workerCount === 1;
        } else if (filters.workers === 'multi') {
          show = show && workerCount > 1;
        }

        // Text search
        if (filters.search) {
          const query = filters.search.toLowerCase();
          show = show && (title.includes(query) || feature.includes(query) || videoPath.includes(query));
        }

        card.style.display = show ? '' : 'none';
      });

      // Hide runs that have no visible videos
      runSections.forEach(section => {
        const visibleVideos = section.querySelectorAll('.video-card:not([style*="display: none"])');
        section.style.display = visibleVideos.length > 0 ? '' : 'none';
      });

      updateActiveFilters();
    }

    // Segment control click handlers
    function setupSegmentControl(container, filterKey) {
      container.querySelectorAll('.segment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          filters[filterKey] = btn.dataset.value;
          applyFilters();
        });
      });
    }

    setupSegmentControl(statusFilter, 'status');
    setupSegmentControl(workerFilter, 'workers');

    // Search input with debounce
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filters.search = searchInput.value.trim();
        applyFilters();
      }, 150);
    });

    // Video modal with history support
    function openVideo(card, pushState = true) {
      const videoPath = card.dataset.videoPath;
      const title = card.dataset.title;
      const feature = card.dataset.feature;
      const runId = card.dataset.runId;

      document.getElementById('modal-video-title').textContent = title;
      document.getElementById('modal-video-meta').textContent = feature + ' • Run #' + runId;
      document.getElementById('modal-video').src = videoPath;
      document.getElementById('modal-open-link').href = videoPath;
      document.getElementById('modal').classList.add('active');

      // Update URL and push to history
      if (pushState) {
        const videoId = card.dataset.videoPath.replace('/runs/', '').replace(/\\//g, '-').replace('.webm', '');
        history.pushState({ video: videoId, videoPath }, title, '#' + videoId);
      }
    }

    function closeModal(event, pushState = true) {
      if (!event || event.target === document.getElementById('modal')) {
        const wasActive = document.getElementById('modal').classList.contains('active');
        document.getElementById('modal').classList.remove('active');
        document.getElementById('modal-video').pause();
        document.getElementById('modal-video').src = '';

        // Update URL when manually closing (not from popstate)
        if (pushState && wasActive && location.hash) {
          history.pushState({}, '', location.pathname);
        }
      }
    }

    // Handle back/forward navigation
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.video) {
        // Navigate to video - find the card by video path
        const card = document.querySelector('[data-video-path="' + e.state.videoPath + '"]');
        if (card) {
          openVideo(card, false); // Don't push state again
        }
      } else {
        // No video state - close modal without pushing state
        closeModal(null, false);
      }
    });

    // Handle initial load with hash
    if (location.hash) {
      const videoId = location.hash.slice(1);
      // Find card that matches this video ID
      const cards = document.querySelectorAll('.video-card');
      for (const card of cards) {
        const cardId = card.dataset.videoPath.replace('/runs/', '').replace(/\\//g, '-').replace('.webm', '');
        if (cardId === videoId) {
          openVideo(card, false);
          break;
        }
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      document.documentElement.classList.toggle('light');
      localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
    });

    // Load saved theme
    if (localStorage.getItem('theme') === 'light') {
      document.documentElement.classList.add('light');
    }

    // AI Sidebar toggle
    function toggleAISidebar() {
      document.getElementById('ai-sidebar').classList.toggle('hidden');
    }
  </script>

  <!-- AI Chat Sidebar -->
  <aside class="ai-sidebar" id="ai-sidebar">
    <div class="ai-sidebar-header">
      <div class="ai-sidebar-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
          <path d="M12 12v8"/>
          <path d="M8 18h8"/>
          <circle cx="12" cy="6" r="1"/>
        </svg>
        <span>Test Copilot</span>
      </div>
      <button class="ai-sidebar-btn" onclick="toggleAISidebar()" title="Hide sidebar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
        </svg>
      </button>
    </div>

    <div class="ai-chat-messages">
      <!-- User message 1 -->
      <div class="ai-message user">
        <div class="ai-message-bubble">
          Show me all failed tests from today
        </div>
        <div class="ai-message-meta">2:34 PM</div>
      </div>

      <!-- Assistant message 1 -->
      <div class="ai-message assistant">
        <div class="ai-message-bubble">
          I found <strong>3 failed tests</strong> from today's runs. Here's the most recent failure:
          <div class="ai-video-ref">
            <div class="ai-video-ref-icon">✗</div>
            <div class="ai-video-ref-info">
              <div class="ai-video-ref-title">items-list.spec.ts</div>
              <div class="ai-video-ref-meta">Failed 12 min ago • worker-3</div>
            </div>
          </div>
        </div>
        <div class="ai-message-meta">2:34 PM</div>
      </div>

      <!-- User message 2 -->
      <div class="ai-message user">
        <div class="ai-message-bubble">
          Why did items-list fail?
        </div>
        <div class="ai-message-meta">2:35 PM</div>
      </div>

      <!-- Assistant message 2 -->
      <div class="ai-message assistant">
        <div class="ai-message-bubble">
          The test failed because the <code>Items list</code> component timed out waiting for the API response. Looking at the Gherkin scenario:

          <div class="ai-code-block">
            <div class="filename">📄 features/items-list.feature</div>
            <pre>Scenario: Items are displayed
  Given the user is on the items page
  When the page loads
  <span class="highlight">Then the items should be visible</span></pre>
          </div>

          The failure occurred at step 3. The API endpoint <code>/api/collections</code> returned a 500 error.
        </div>
        <div class="ai-message-meta">2:35 PM</div>
      </div>

      <!-- User message 3 -->
      <div class="ai-message user">
        <div class="ai-message-bubble">
          What's the root cause?
        </div>
        <div class="ai-message-meta">2:36 PM</div>
      </div>

      <!-- Assistant message 3 -->
      <div class="ai-message assistant">
        <div class="ai-message-bubble">
          Found it! The error originated from a null reference in the mock data store:

          <div class="ai-code-block">
            <div class="filename">📄 src/app/api/mock-items-store.ts:47</div>
            <pre>const items = collections
  <span class="highlight">.find(c => c.id === id)</span>  // ← returns undefined
  .items;  // ← Cannot read 'items' of undefined</pre>
          </div>

          <strong>Fix:</strong> Add a null check before accessing <code>.items</code>, or ensure the collection ID exists.
        </div>
        <div class="ai-message-meta">2:36 PM</div>
      </div>

      <!-- User message 4 -->
      <div class="ai-message user">
        <div class="ai-message-bubble">
          Show me passing tests with multiple workers
        </div>
        <div class="ai-message-meta">2:38 PM</div>
      </div>

      <!-- Assistant message 4 -->
      <div class="ai-message assistant">
        <div class="ai-message-bubble">
          Found <strong>12 passing multi-worker runs</strong>. The most stable tests are:
          <div class="ai-video-ref">
            <div class="ai-video-ref-icon success">✓</div>
            <div class="ai-video-ref-info">
              <div class="ai-video-ref-title">item-view.spec.ts</div>
              <div class="ai-video-ref-meta">100% pass rate • 8 workers</div>
            </div>
          </div>
          <div class="ai-video-ref">
            <div class="ai-video-ref-icon success">✓</div>
            <div class="ai-video-ref-info">
              <div class="ai-video-ref-title">collections.spec.ts</div>
              <div class="ai-video-ref-meta">100% pass rate • 8 workers</div>
            </div>
          </div>
        </div>
        <div class="ai-message-meta">2:38 PM</div>
      </div>
    </div>

    <div class="ai-chat-input">
      <div class="ai-chat-input-wrapper">
        <textarea placeholder="Ask about your test runs..." rows="1"></textarea>
        <button class="ai-chat-input-send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  </aside>

<!-- AI Toggle Button (shown when sidebar hidden) -->
<button class="ai-toggle-btn" onclick="toggleAISidebar()">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
</button>
</body>
</html>
`
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  // Serve the dashboard
  if (url.pathname === "/" || url.pathname === "/index.html") {
    const runs = scanRuns()
    const html = generateHTML(runs)
    res.writeHead(200, { "Content-Type": "text/html" })
    res.end(html)
    return
  }

  // Serve static files from runs directory
  if (url.pathname.startsWith("/runs/")) {
    const filePath = path.join(ARTIFACTS_DIR, url.pathname)

    if (!fs.existsSync(filePath)) {
      res.writeHead(404)
      res.end("Not found")
      return
    }

    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes = {
      ".webm": "video/webm",
      ".mp4": "video/mp4",
      ".md": "text/markdown",
      ".json": "application/json",
      ".html": "text/html",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
    }

    const contentType = mimeTypes[ext] || "application/octet-stream"
    const stat = fs.statSync(filePath)

    // Support range requests for video
    const range = req.headers.range
    if (range && ext === ".webm") {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
      const chunksize = end - start + 1

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
      })

      fs.createReadStream(filePath, { start, end }).pipe(res)
    } else {
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": stat.size,
      })
      fs.createReadStream(filePath).pipe(res)
    }
    return
  }

  res.writeHead(404)
  res.end("Not found")
}

const server = http.createServer(handleRequest)

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`
  console.log(`\n  🎭 Playwright Videos`)
  console.log(`  ────────────────────`)
  console.log(`  → ${url}\n`)

  // Auto-open in browser
  const { exec } = require('child_process')
  const command =
    process.platform === 'darwin'
      ? `open "${url}"`
      : process.platform === 'win32'
        ? `start "${url}"`
        : `xdg-open "${url}"`
  exec(command)
})

})() // End of async IIFE
