<template>
  <div class="about-page">
    <div class="about-card">
      <!-- App Logo -->
      <div class="about-logo">
        <n-icon size="48" color="var(--primary-color)">
          <library-outline />
        </n-icon>
      </div>

      <h1 class="app-name">One AI</h1>
      <p class="app-desc">本地大模型对话助手 · 离线运行</p>
      <div class="version-badge">v{{ envInfo.appVersion || '—' }}</div>

      <!-- 环境信息 -->
      <div class="env-table">
        <div v-for="item in envRows" :key="item.label" class="env-row">
          <span class="env-label">{{ item.label }}</span>
          <span class="env-value">{{ item.value }}</span>
        </div>
      </div>

      <!-- 更新区域 -->
      <div class="update-section">
        <div class="update-status-row">
          <span class="update-label">版本更新</span>
          <span :class="['update-badge', `update-badge--${updateStatus}`]">
            {{ updateStatusText }}
          </span>
        </div>

        <!-- 下载进度条 -->
        <div v-if="updateStatus === 'downloading'" class="update-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: (appStore.updateInfo.percent ?? 0) + '%' }"
            />
          </div>
          <div class="progress-info">
            <span>{{ Math.round(appStore.updateInfo.percent ?? 0) }}%</span>
            <span v-if="appStore.updateInfo.bytesPerSecond">
              {{ formatSpeed(appStore.updateInfo.bytesPerSecond) }}
            </span>
          </div>
        </div>

        <!-- 更新日志 -->
        <div
          v-if="updateStatus === 'available' && appStore.updateInfo.releaseNotes"
          class="release-notes"
        >
          <p class="release-notes-title">更新内容</p>
          <p class="release-notes-text">{{ appStore.updateInfo.releaseNotes }}</p>
        </div>

        <!-- 操作按钮 -->
        <div class="update-actions">
          <button
            v-if="
              updateStatus === 'idle' ||
              updateStatus === 'not-available' ||
              updateStatus === 'error'
            "
            class="btn btn-primary"
            @click="handleCheckUpdate"
          >
            <n-icon size="14">
              <refresh-outline />
            </n-icon>
            检查更新
          </button>

          <button v-if="updateStatus === 'checking'" class="btn btn-ghost" disabled>
            <span class="spinner" />
            检查中…
          </button>

          <button
            v-if="updateStatus === 'available'"
            class="btn btn-primary"
            @click="handleDownloadUpdate"
          >
            <n-icon size="14">
              <download-outline />
            </n-icon>
            下载更新 v{{ appStore.updateInfo.version }}
          </button>

          <button v-if="updateStatus === 'downloading'" class="btn btn-ghost" disabled>
            <span class="spinner" />
            下载中 {{ Math.round(appStore.updateInfo.percent ?? 0) }}%
          </button>

          <button
            v-if="updateStatus === 'downloaded'"
            class="btn btn-success"
            @click="handleInstallUpdate"
          >
            <n-icon size="14">
              <checkmark-outline />
            </n-icon>
            重启并安装
          </button>

          <!-- 下载链接按钮 (仅在签名校验失败时显示) -->
          <button
            v-if="updateStatus === 'error' && appStore.updateInfo.isAuthError"
            class="btn btn-primary"
            @click="handleManualDownload"
          >
            <n-icon size="14">
              <download-outline />
            </n-icon>
            前往 GitHub 手动下载
          </button>

          <button class="btn btn-ghost" @click="handleOpenLog">
            <n-icon size="14">
              <document-text-outline />
            </n-icon>
            查看日志
          </button>
        </div>
      </div>

      <!-- 版权 -->
      <p class="copyright">© {{ currentYear }} One AI. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import {
  LibraryOutline,
  RefreshOutline,
  DownloadOutline,
  CheckmarkOutline,
  DocumentTextOutline,
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const appStore = useAppStore()

const currentYear = new Date().getFullYear()

interface EnvInfo {
  appVersion: string
  electronVersion: string
  nodeVersion: string
  chromiumVersion: string
  platform: string
  arch: string
}

const envInfo = ref<EnvInfo>({
  appVersion: '',
  electronVersion: '',
  nodeVersion: '',
  chromiumVersion: '',
  platform: '',
  arch: '',
})

const envRows = computed(() => {
  if (!envInfo.value.appVersion) return []
  return [
    { label: 'Electron', value: envInfo.value.electronVersion },
    { label: 'Node.js', value: envInfo.value.nodeVersion },
    { label: 'Chromium', value: envInfo.value.chromiumVersion },
    { label: '操作系统', value: `${envInfo.value.platform} ${envInfo.value.arch}` },
  ]
})

const updateStatus = computed(() => appStore.updateStatus)

const updateStatusText = computed(() => {
  if (updateStatus.value === 'error' && appStore.updateInfo.isAuthError) {
    return '更新校验失败 (需手动)'
  }

  const map: Record<string, string> = {
    idle: '已是最新',
    checking: '检查中',
    available: '有新版本',
    'not-available': '已是最新',
    downloading: '下载中',
    downloaded: '待安装',
    error: '检查失败',
  }
  return map[updateStatus.value] ?? '—'
})

onMounted(async () => {
  if (window.electronAPI) {
    envInfo.value = await window.electronAPI.app.getEnvInfo()
  }
})

async function handleCheckUpdate() {
  if (!window.electronAPI) {
    alert('当前为浏览器环境')
    return
  }
  appStore.setUpdateStatus('checking')
  await window.electronAPI.updater.check()
}

async function handleDownloadUpdate() {
  if (!window.electronAPI) return
  await window.electronAPI.updater.download()
}

function handleInstallUpdate() {
  window.electronAPI?.updater.install()
}

async function handleOpenLog() {
  if (!window.electronAPI) {
    alert('当前为浏览器环境')
    return
  }
  await window.electronAPI.app.openLogDir()
}

function handleManualDownload() {
  const url = 'https://github.com/961099916/one/releases'
  if (window.electronAPI) {
    // 假设可以通过 shell 或 window.open 打开
    window.open(url, '_blank')
  } else {
    window.open(url, '_blank')
  }
}

function formatSpeed(bps: number): string {
  if (bps > 1024 * 1024) return `${(bps / 1024 / 1024).toFixed(1)} MB/s`
  if (bps > 1024) return `${(bps / 1024).toFixed(0)} KB/s`
  return `${bps} B/s`
}
</script>

<style scoped>
.about-page {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
}

.about-card {
  width: 100%;
  max-width: 480px;
  background: var(--bg-primary);
  border-radius: var(--border-radius-xl);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.about-logo {
  margin-bottom: 4px;
}

.app-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.app-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.version-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-color);
  background: var(--primary-bg);
  border: 1px solid rgba(20, 86, 255, 0.2);
  border-radius: 20px;
  padding: 3px 12px;
  letter-spacing: 0.3px;
}

/* 环境信息表格 */
.env-table {
  width: 100%;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  overflow: hidden;
  margin-top: 4px;
}

.env-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--border-color);
}

.env-row:last-child {
  border-bottom: none;
}

.env-label {
  color: var(--text-secondary);
}

.env-value {
  color: var(--text-primary);
  font-weight: 500;
  font-family: 'SF Mono', 'JetBrains Mono', Consolas, monospace;
  font-size: 12px;
}

/* 更新区域 */
.update-section {
  width: 100%;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}

.update-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.update-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.update-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 20px;
}

.update-badge--idle,
.update-badge--not-available {
  background: var(--bg-sidebar-hover);
  color: var(--text-secondary);
}

.update-badge--checking {
  background: var(--warning-bg);
  color: var(--warning-color);
}

.update-badge--available {
  background: var(--primary-bg);
  color: var(--primary-color);
}

.update-badge--downloading {
  background: var(--primary-bg);
  color: var(--primary-color);
}

.update-badge--downloaded {
  background: var(--success-bg);
  color: var(--success-color);
}

.update-badge--error {
  background: var(--danger-bg);
  color: var(--danger-color);
}

/* 进度条 */
.update-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-bar {
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 更新日志 */
.release-notes {
  text-align: left;
  background: var(--bg-primary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  padding: 10px 12px;
}

.release-notes-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.release-notes-text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.6;
}

/* 操作按钮组 */
.update-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--border-radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);
  font-family: var(--font-family);
  flex: 1;
  justify-content: center;
  white-space: nowrap;
}

.btn:active {
  transform: scale(0.98);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-success {
  background: var(--success-color);
  color: #fff;
}

.btn-ghost {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
.btn-ghost:hover:not(:disabled) {
  background: var(--bg-sidebar-hover);
}

/* 旋转动画 */
.spinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 版权 */
.copyright {
  font-size: 12px;
  color: var(--text-disabled);
  margin-top: 4px;
}
</style>
