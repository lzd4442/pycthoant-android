import './style.css'
import { CapacitorDownloader } from '@capgo/capacitor-downloader'
import { FileOpener } from '@capacitor-community/file-opener'

// ── GitHub 信息 ──────────────────────────────────────────────
const REPO = 'lzd4442/pycthoant'
const VERSION_URL = `https://api.github.com/repos/${REPO}/releases/latest`
const ASSET_KEYWORD = 'android'

// ── DOM ──────────────────────────────────────────────────────
const elVersion      = document.getElementById('latest-version')!
const elDate         = document.getElementById('release-date')!
const elSize         = document.getElementById('file-size')!
const elStatus       = document.getElementById('status')!
const elDownloadBtn  = document.getElementById('download-btn')!
const elProgressSec  = document.getElementById('progress-section')!
const elProgressBar  = document.getElementById('progress-bar')!
const elProgressPct  = document.getElementById('progress-pct')!
const elProgressDet  = document.getElementById('progress-detail')!
const elDoneSec      = document.getElementById('done-section')!
const elReinstallBtn = document.getElementById('reinstall-btn')!
const elErrorSec     = document.getElementById('error-section')!
const elErrorText    = document.getElementById('error-text')!
const elRetryBtn     = document.getElementById('retry-btn')!

let downloadUrl = ''
let assetSize   = 0
// Capacitor plugin manages the full path internally

// ── HTTP ─────────────────────────────────────────────────────
async function fetchJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { 'User-Agent': 'PycthoantApp/1.0' } })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json() as Promise<T>
}

// ── 状态 ─────────────────────────────────────────────────────
function setStatus(text: string, cls = 'status-idle') {
  elStatus.textContent = text
  elStatus.className = `value ${cls}`
}

// ── 版本检测 ─────────────────────────────────────────────────
async function checkVersion() {
  try {
    const data = await fetchJSON<{
      tag_name: string
      published_at: string
      assets: Array<{
        name: string
        browser_download_url: string
        size: number
      }>
    }>(VERSION_URL)

    elVersion.textContent = `v${data.tag_name.replace(/^v/, '')}`

    const d = new Date(data.published_at)
    elDate.textContent = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const apk = data.assets.find(a =>
      a.name.toLowerCase().includes(ASSET_KEYWORD) ||
      a.name.toLowerCase().includes('apk')
    )

    if (apk) {
      downloadUrl = apk.browser_download_url
      assetSize   = apk.size
      elSize.textContent = `${(assetSize / 1024 / 1024).toFixed(1)} MB`
      setStatus('准备就绪', 'status-ok')
    } else {
      elSize.textContent = '—'
      setStatus('暂无可用 APK，请到 GitHub 下载', 'status-warn')
    }
  } catch {
    elVersion.textContent = '检测失败'
    setStatus('网络错误，请检查连接', 'status-error')
  }
}

// ── 面板切换 ─────────────────────────────────────────────────
function showProgress() {
  elProgressSec.classList.remove('hidden')
  elDoneSec.classList.add('hidden')
  elErrorSec.classList.add('hidden')
  elDownloadBtn.classList.add('hidden')
  elProgressBar.style.width = '0%'
  elProgressPct.textContent = '0%'
  elProgressDet.textContent = ''
}

function showDone() {
  elProgressSec.classList.add('hidden')
  elDoneSec.classList.remove('hidden')
  elErrorSec.classList.add('hidden')
  elDownloadBtn.classList.add('hidden')
}

function showError(msg: string) {
  elErrorSec.classList.remove('hidden')
  elErrorText.textContent = msg
  elProgressSec.classList.add('hidden')
  elDoneSec.classList.add('hidden')
  elDownloadBtn.classList.add('hidden')
}

function showIdle() {
  elDownloadBtn.classList.remove('hidden')
  elProgressSec.classList.add('hidden')
  elDoneSec.classList.add('hidden')
  elErrorSec.classList.add('hidden')
}

// ── 下载主流程 ───────────────────────────────────────────────
async function startDownload() {
  if (!downloadUrl) {
    showError('未检测到 APK，请稍后重试')
    return
  }

  showProgress()
  setStatus('正在下载…', 'status-loading')

  const filename  = downloadUrl.split('/').pop() || 'pycthoant.apk'
  const downloadId = `pycthoant-${Date.now()}`
  const dest = `downloads/${filename}`

  // 监听进度
  // @ts-ignore  — TS 定义与运行时 API 存在差异，手动处理
  const listener = await CapacitorDownloader.addListener(
    'downloadProgress',
    (event: { id: string; progress: number; bytesWritten?: number; bytesTotal?: number }) => {
      const pct = Math.round(event.progress)
      elProgressBar.style.width = `${pct}%`
      elProgressPct.textContent = `${pct}%`
      const total = event.bytesTotal || assetSize
      const sofar = event.bytesWritten || Math.round(total * pct / 100)
      if (total) {
        elProgressDet.textContent =
          `${(sofar / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(1)} MB`
      }
    }
  )

  try {
    // 开始下载
    // @ts-ignore
    const task = await CapacitorDownloader.download({
      id: downloadId,
      url: downloadUrl,
      destination: dest,
      notification: 'hidden',
    })

    // 下载完成 → 清理监听器
    // @ts-ignore
    await listener.remove()

    setStatus('正在安装…', 'status-loading')
    elProgressBar.style.width = '100%'
    elProgressPct.textContent = '100%'

    // 打开 APK 安装
    await FileOpener.open({
      filePath: dest,
      contentType: 'application/vnd.android.package-archive',
    })

    showDone()
    setStatus('安装完成 🎉', 'status-ok')

  } catch (e: unknown) {
    try {
      // @ts-ignore
      await listener.remove()
    } catch { /* ignore cleanup errors */ }

    console.error('Download error:', e)

    // 降级：打开浏览器下载
    try {
      window.open(downloadUrl, '_blank')
      showIdle()
      setStatus('已在浏览器打开，请在浏览器中下载 APK', 'status-warn')
    } catch {
      const msg = e instanceof Error ? e.message : '未知错误'
      showError(`下载失败：${msg}`)
    }
  }
}

// ── 事件 ─────────────────────────────────────────────────────
elDownloadBtn.addEventListener('click', startDownload)
elReinstallBtn.addEventListener('click', () => { showIdle(); startDownload() })
elRetryBtn.addEventListener('click', () => { showIdle(); startDownload() })

// ── 启动 ─────────────────────────────────────────────────────
checkVersion()
