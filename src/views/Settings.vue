<template>
  <div class="page-wrap">
    <div class="page-header">
      <h2 class="page-title">模型管理</h2>
      <p class="page-desc">管理本地 GGUF 格式大语言模型</p>
    </div>

    <!-- 当前模型 -->
    <section class="setting-section">
      <h3 class="section-title">当前模型</h3>
      <div class="setting-card">
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">激活模型</span>
            <span class="setting-desc">选择用于对话的本地模型</span>
          </div>
          <div class="model-select-wrap">
            <select
              :value="settingsStore.activeModelName"
              class="model-select"
              :disabled="models.length === 0"
              @change="handleModelChange"
            >
              <option value="" disabled>
                {{ models.length === 0 ? '暂无可用模型' : '请选择模型' }}
              </option>
              <option v-for="m in models" :key="m.name" :value="m.name">{{ m.name }}</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- 模型参数设置 -->
    <section class="setting-section">
      <h3 class="section-title">生成参数</h3>
      <div class="setting-card">
        <!-- System Prompt -->
        <div class="setting-row">
          <div class="setting-info" style="flex: 1">
            <span class="setting-label">系统提示词 (System Prompt)</span>
            <span class="setting-desc">定义本地模型的人设与基础响应规则</span>
            <textarea
              class="param-textarea"
              :value="settingsStore.generationParams.systemPrompt"
              rows="3"
              @change="
                (e: Event) => updateParams('systemPrompt', (e.target as HTMLTextAreaElement).value)
              "
            />
          </div>
        </div>
        <div class="setting-divider" />

        <!-- Max Tokens -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Max Tokens</span>
            <span class="setting-desc">生成文本的最大长度</span>
          </div>
          <input
            type="number"
            class="param-input"
            :value="settingsStore.generationParams.maxTokens"
            @change="
              (e: Event) =>
                updateParams('maxTokens', parseInt((e.target as HTMLInputElement).value) || 2048)
            "
          />
        </div>
        <div class="setting-divider" />

        <!-- Temperature -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label"
              >Temperature: {{ settingsStore.generationParams.temperature }}</span
            >
            <span class="setting-desc">控制输出的随机性（值越大越随机）</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            class="param-slider"
            :value="settingsStore.generationParams.temperature"
            @change="
              (e: Event) =>
                updateParams('temperature', parseFloat((e.target as HTMLInputElement).value))
            "
          />
        </div>
        <div class="setting-divider" />

        <!-- Top P -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Top P: {{ settingsStore.generationParams.topP }}</span>
            <span class="setting-desc">核采样概率阈值</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="param-slider"
            :value="settingsStore.generationParams.topP"
            @change="
              (e: Event) => updateParams('topP', parseFloat((e.target as HTMLInputElement).value))
            "
          />
        </div>
      </div>
    </section>

    <!-- 下载模型 -->
    <section class="setting-section">
      <div class="section-header">
        <h3 class="section-title">下载模型</h3>
        <span class="section-badge">GGUF 格式</span>
      </div>

      <!-- 预设模型 -->
      <div class="setting-card">
        <div v-for="(preset, i) in presets" :key="preset.name">
          <div class="preset-row">
            <div class="preset-info">
              <span class="preset-name">{{ preset.displayName }}</span>
              <span class="preset-source">HuggingFace</span>
            </div>
            <div class="preset-actions">
              <button
                class="btn-download"
                :disabled="isDownloading"
                @click="handleDownloadPreset(preset.url, preset.filename)"
              >
                <n-icon size="14">
                  <download-outline />
                </n-icon>
                下载
              </button>
              <button
                class="btn-copy"
                :disabled="isDownloading"
                @click="handleCopyLink(preset.url)"
              >
                <n-icon size="14">
                  <copy-outline />
                </n-icon>
                复制链接
              </button>
            </div>
          </div>
          <div v-if="i < presets.length - 1" class="setting-divider" />
        </div>
      </div>

      <!-- 导入本地模型 -->
      <div class="setting-card" style="margin-top: 12px">
        <div class="import-row">
          <div class="import-info">
            <span class="import-label">导入本地模型</span>
            <span class="import-desc">选择已下载的 GGUF 模型文件导入</span>
          </div>
          <button class="btn-primary" @click="handleImportModel">
            <n-icon size="16">
              <arrow-up-outline />
            </n-icon>
            导入
          </button>
        </div>
      </div>
    </section>

    <!-- 已下载模型列表 -->
    <section v-if="models.length > 0" class="setting-section">
      <h3 class="section-title">已下载模型</h3>
      <div class="setting-card">
        <div v-for="(m, i) in models" :key="m.name">
          <div class="model-row">
            <div class="model-icon">
              <n-icon size="18">
                <cube-outline />
              </n-icon>
            </div>
            <div class="model-info">
              <span class="model-name">{{ m.name }}</span>
              <span v-if="m.name === settingsStore.activeModelName" class="model-active-badge"
                >使用中</span
              >
            </div>
            <button
              class="model-delete-btn"
              title="删除模型文件"
              @click="handleDeleteModel(m.name)"
            >
              <n-icon size="16">
                <trash-outline />
              </n-icon>
            </button>
          </div>
          <div v-if="i < models.length - 1" class="setting-divider" />
        </div>
      </div>
    </section>

    <!-- 下载进度 -->
    <div v-if="isDownloading" class="download-progress-card">
      <div class="download-progress-header">
        <div class="download-progress-info">
          <span class="download-filename">{{ downloadingName }}</span>
          <span class="download-percent">{{ Math.round(downloadProgress) }}%</span>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: Math.round(downloadProgress) + '%' }" />
      </div>
      <p class="download-hint">下载完成后会自动刷新模型列表</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useModels } from '@/composables/useModels'
import { useSettingsStore } from '@/stores'
import { log } from '@/utils/logger'
import {
  DownloadOutline,
  CopyOutline,
  ArrowUpOutline,
  CubeOutline,
  TrashOutline,
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const settingsStore = useSettingsStore()

const {
  models,
  isDownloading,
  downloadProgress,
  downloadingName,
  presets,
  loadModels,
  downloadModel,
} = useModels()

const handleModelChange = (e: Event) => {
  const name = (e.target as HTMLSelectElement).value
  settingsStore.setActiveModelName(name)
}

const updateParams = (
  key: keyof typeof settingsStore.generationParams, 
  val: string | number
) => {
  settingsStore.updateGenerationParams({ [key]: val })
}

const handleDownloadPreset = (url: string, filename: string) => {
  downloadModel(url, filename)
}

const handleCopyLink = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    alert('链接已复制到剪贴板！')
  } catch (err) {
    log.error('复制失败:', err)
    alert('复制失败，请手动复制：' + url)
  }
}

const handleImportModel = async () => {
  log.info('[Settings] 点击导入按钮')
  try {
    log.info('[Settings] 调用 import-model IPC')
    const result = await window.ipcRenderer.invoke('import-model')
    log.info('[Settings] 导入结果:', result)
    if (result.success) {
      alert('模型导入成功！')
      loadModels()
    } else {
      alert(result.error || '导入失败')
    }
  } catch (err) {
    log.error('[Settings] 导入失败:', err)
    alert('导入失败，请重试')
  }
}

function handleDeleteModel(name: string) {
  if (window.confirm(`确认删除模型文件「${name}」？文件将从磁盘永久删除。`)) {
    window.ipcRenderer.invoke('delete-model', name).then((result: { success: boolean; error?: string }) => {
      if (result.success) {
        if (settingsStore.activeModelName === name) {
          settingsStore.setActiveModelName('')
        }
        loadModels()
      } else {
        alert(result.error || '删除失败')
      }
    })
  }
}
</script>

<style scoped>
/* 企业级页面布局 */
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* 页面头部 */
.page-header {
  margin-bottom: 8px;
}
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}
.page-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.5;
}

/* 组件样式 */
.setting-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

.section-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 4px;
  padding: 2px 8px;
}

/* 卡片样式 */
.setting-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  transition: all 0.2s;
}

.setting-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-base);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 20px;
}

.setting-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 0 20px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.setting-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

/* 模型选择 */
.model-select-wrap {
  flex-shrink: 0;
}
.model-select {
  padding: 8px 36px 8px 16px;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%238f959e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  min-width: 220px;
  transition: all 0.2s;
}
.model-select:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

/* 参数控制 */
.param-textarea {
  width: 100%;
  margin-top: 10px;
  padding: 12px 16px;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  line-height: 1.5;
  transition: all 0.2s;
}
.param-textarea:focus {
  border-color: var(--el-color-primary);
  outline: none;
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.param-input {
  width: 90px;
  padding: 8px 16px;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}
.param-input:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.param-slider {
  accent-color: var(--el-color-primary);
  width: 140px;
}

/* 预设模型行 */
.preset-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
}
.preset-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.preset-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preset-source {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.preset-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.btn-download,
.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  transition: all 0.2s;
  font-family: inherit;
  flex-shrink: 0;
}

.btn-download:hover:not(:disabled),
.btn-copy:hover:not(:disabled) {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.btn-download:disabled,
.btn-copy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 导入模型行 */
.import-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
}
.import-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.import-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.import-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: var(--el-color-primary);
  color: white;
  transition: all 0.2s;
  font-family: inherit;
  flex-shrink: 0;
}

.btn-primary:hover {
  background: var(--el-color-primary-light-1);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(22, 93, 255, 0.2);
}
.btn-primary:active {
  transform: translateY(0);
}

/* 已下载模型行 */
.model-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  transition: all 0.2s;
}
.model-row:hover {
  background: var(--el-fill-color-lighter);
}
.model-icon {
  color: var(--el-color-primary);
  flex-shrink: 0;
  background: var(--el-color-primary-light-9);
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.model-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.model-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'JetBrains Mono', monospace;
}
.model-active-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-color-success);
  background: #eaffea; /* 浅绿背景 */
  border-radius: 4px;
  padding: 2px 8px;
  flex-shrink: 0;
}
.model-delete-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.2s;
}
.model-delete-btn:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

/* 下载进度 */
.download-progress-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-color-primary);
  border-radius: var(--el-border-radius-base);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.1);
}
.download-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.download-progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.download-filename {
  font-size: 13px;
  font-weight: 512;
  color: var(--el-text-color-primary);
  font-family: 'JetBrains Mono', monospace;
}
.download-percent {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-primary);
}
.progress-bar {
  height: 6px;
  background: var(--el-fill-color);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--el-color-primary);
  border-radius: 3px;
  transition: width 0.4s ease;
}
.download-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.4;
}
</style>
