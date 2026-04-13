<template>
  <div class="page-wrap">
    <div class="page-header">
      <h2 class="page-title">通用设置</h2>
      <p class="page-desc">自定义外观、行为与系统集成</p>
    </div>

    <!-- 外观 -->
    <section class="setting-section">
      <h3 class="section-title">外观</h3>

      <div class="setting-card">
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">主题模式</span>
            <span class="setting-desc">选择应用的颜色主题</span>
          </div>
          <div class="theme-selector">
            <button
              v-for="opt in themeOptions"
              :key="opt.value"
              :class="['theme-btn', { active: settings.theme === opt.value }]"
              @click="handleThemeChange(opt.value)"
            >
              <span class="theme-icon" v-html="opt.icon" />
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="setting-divider" />

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">消息字体大小</span>
            <span class="setting-desc"
              >调整聊天内容的字体大小（当前 {{ settings.fontSize }}px）</span
            >
          </div>
          <div class="slider-wrap">
            <span class="slider-label">12</span>
            <input
              type="range"
              :value="settings.fontSize"
              min="12"
              max="20"
              step="1"
              class="slider"
              @input="handleFontSizeChange"
            />
            <span class="slider-label">20</span>
          </div>
        </div>

        <div class="setting-divider" />

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">侧边栏宽度</span>
            <span class="setting-desc"
              >调整左侧会话列表的宽度（{{ settings.sidebarWidth }}px）</span
            >
          </div>
          <div class="slider-wrap">
            <span class="slider-label">220</span>
            <input
              type="range"
              :value="settings.sidebarWidth"
              min="220"
              max="320"
              step="10"
              class="slider"
              @input="handleSidebarWidthChange"
            />
            <span class="slider-label">320</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 系统 -->
    <section class="setting-section">
      <h3 class="section-title">系统</h3>

      <div class="setting-card">
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">开机自动启动</span>
            <span class="setting-desc">登录系统时自动启动 壹复盘</span>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="appStore.loginItemEnabled"
              @change="handleLoginItemChange"
            />
            <span class="toggle-track" />
          </label>
        </div>

        <div class="setting-divider" />

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">自动检查更新</span>
            <span class="setting-desc">启动时在后台静默检查是否有新版本</span>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="settings.autoCheckUpdate"
              @change="
                e => updateSettings({ autoCheckUpdate: (e.target as HTMLInputElement).checked })
              "
            />
            <span class="toggle-track" />
          </label>
        </div>

        <div class="setting-divider" />

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">GitHub 下载镜像</span>
            <span class="setting-desc">当无法连接 GitHub 时，尝试使用镜像加速更新下载</span>
          </div>
          <select 
            class="select-input" 
            style="width: 140px"
            :value="settings.updateMirror"
            @change="e => updateSettings({ updateMirror: (e.target as HTMLSelectElement).value as any })"
          >
            <option value="direct">直接连接</option>
            <option value="ghproxy">Ghproxy 镜像</option>
            <option value="custom">自定义镜像</option>
          </select>
        </div>

        <div v-if="settings.updateMirror === 'custom'" class="setting-row" style="padding-top: 0">
          <div class="setting-info" style="flex: 1">
            <input 
              type="text" 
              class="text-input" 
              :value="settings.customMirrorUrl" 
              placeholder="请输入镜像地址 (包含 latest.yml 的目录)"
              @change="e => updateSettings({ customMirrorUrl: (e.target as HTMLInputElement).value })"
            />
          </div>
        </div>

        <div class="setting-divider" />

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">启动时自动加载模型</span>
            <span class="setting-desc">启动应用时自动载入上次选择的模型，会占用较多内存</span>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="settings.autoLoadModel"
              @change="
                e => updateSettings({ autoLoadModel: (e.target as HTMLInputElement).checked })
              "
            />
            <span class="toggle-track" />
          </label>
        </div>
      </div>
    </section>

    <!-- 数据源 -->
    <section class="setting-section">
      <h3 class="section-title">数据源与联动</h3>
      <div class="setting-card">
        <!-- 通达信 -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">通达信安装路径</span>
            <span class="setting-desc">指定通达信主程序 (TdxW.exe) 或 vipdoc 目录</span>
          </div>
          <div class="input-action-wrap">
            <input 
              type="text" 
              class="text-input" 
              :value="settings.tdxPath" 
              placeholder="例如: C:\tdx\TdxW.exe"
              @change="e => updateSettings({ tdxPath: (e.target as HTMLInputElement).value })"
            />
            <button 
              class="btn btn-primary-ghost" 
              @click="handleSelectTdxPath"
            >
              选择
            </button>
          </div>
        </div>

        <div class="setting-divider" />

        <!-- 同花顺 -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">同花顺安装路径</span>
            <span class="setting-desc">指定同花顺主程序 (hexin.exe) 的路径，用于直连联动</span>
          </div>
          <div class="input-action-wrap">
            <input 
              type="text" 
              class="text-input" 
              :value="settings.thsPath" 
              placeholder="例如: C:\ths\hexin.exe"
              @change="e => updateSettings({ thsPath: (e.target as HTMLInputElement).value })"
            />
            <button 
              class="btn btn-primary-ghost" 
              @click="handleSelectThsPath"
            >
              选择
            </button>
          </div>
        </div>

        <div class="setting-divider" />

        <!-- 联动偏好 -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">联动偏好设置</span>
            <span class="setting-desc">点击股票名称时优先拉起的软件（可同时开启）</span>
          </div>
          <select 
            class="select-input" 
            style="width: 140px"
            :value="settings.linkagePreference"
            @change="e => updateSettings({ linkagePreference: (e.target as HTMLSelectElement).value as any })"
          >
            <option value="tdx">仅通达信</option>
            <option value="ths">仅同花顺</option>
            <option value="both">同时开启</option>
          </select>
        </div>
      </div>
    </section>

    <!-- 网络代理 -->
    <section class="setting-section">
      <h3 class="section-title">网络代理</h3>
      <div class="setting-card">
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">启用手动代理</span>
            <span class="setting-desc">当应用无法检查更新或同步数据时，尝试手动运行代理</span>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="settings.proxy.enable"
              @change="handleProxyToggle"
            />
            <span class="toggle-track" />
          </label>
        </div>

        <template v-if="settings.proxy.enable">
          <div class="setting-divider" />
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">代理服务器</span>
              <span class="setting-desc">配置代理协议、地址和端口</span>
            </div>
            <div class="proxy-inputs">
              <select 
                class="select-input" 
                :value="settings.proxy.protocol"
                @change="e => updateProxy({ protocol: (e.target as HTMLSelectElement).value as any })"
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks5">SOCKS5</option>
              </select>
              <input 
                type="text" 
                class="text-input" 
                :value="settings.proxy.host"
                placeholder="127.0.0.1"
                @change="e => updateProxy({ host: (e.target as HTMLInputElement).value })"
              />
              <input 
                type="number" 
                class="text-input port-input" 
                :value="settings.proxy.port"
                placeholder="7890"
                @change="e => updateProxy({ port: Number((e.target as HTMLInputElement).value) })"
              />
            </div>
          </div>
        </template>
        
        <div v-if="settings.proxy.enable" class="proxy-notice">
          <n-text depth="3" style="font-size: 11px">更改代理设置后可能需要重启应用以完全生效</n-text>
        </div>
      </div>
    </section>
    <section class="setting-section">
      <h3 class="section-title">高级</h3>

      <div class="setting-card">
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">重置所有设置</span>
            <span class="setting-desc">恢复默认主题、字体大小等配置，不影响聊天记录</span>
          </div>
          <button class="btn btn-danger-ghost" @click="handleReset">重置</button>
        </div>

        <div class="setting-divider" />

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">同步菜单到 Supabase</span>
            <span class="setting-desc">将当前本地硬编码的菜单配置全量覆盖上传到 Supabase 数据库</span>
          </div>
          <button 
            class="btn btn-primary-ghost" 
            :disabled="isSyncing"
            @click="handleSyncMenus"
          >
            {{ isSyncing ? '同步中...' : '同步菜单' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore, useAuthStore } from '@/stores'
import { log } from '@/utils/logger'
import { useMessage } from 'naive-ui'

const appStore = useAppStore()
const authStore = useAuthStore()
const message = useMessage()
const isSyncing = ref(false)

const settings = computed(() => appStore.settings)

function updateSettings(patch: Parameters<typeof appStore.updateSettings>[0]) {
  appStore.updateSettings(patch)
}

const themeOptions = [
  {
    value: 'light' as const,
    label: '浅色',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  },
  {
    value: 'dark' as const,
    label: '深色',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    value: 'auto' as const,
    label: '跟随系统',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
      <path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  },
]

function handleThemeChange(theme: 'light' | 'dark' | 'auto') {
  updateSettings({ theme })
}

function handleFontSizeChange(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value)
  updateSettings({ fontSize: val })
}

function handleSidebarWidthChange(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value)
  updateSettings({ sidebarWidth: val })
}

async function handleLoginItemChange(e: Event) {
  const enabled = (e.target as HTMLInputElement).checked
  try {
    await appStore.setLoginItem(enabled)
    alert(enabled ? '已开启开机自启' : '已关闭开机自启')
  } catch (err) {
    log.error(err)
    alert('设置开机自启失败')
  }
}

async function handleSelectTdxPath() {
  try {
    const path = await window.electronAPI.app.selectDirectory()
    if (path) {
      updateSettings({ tdxPath: path })
      message.success('已选择路径')
    }
  } catch (err) {
    log.error('[Settings] 选择目录失败:', err)
    message.error('选择目录失败')
  }
}

async function handleSelectThsPath() {
  try {
    const path = await window.electronAPI.app.selectDirectory()
    if (path) {
      updateSettings({ thsPath: path })
      message.success('已选择路径')
    }
  } catch (err) {
    log.error('[Settings] 选择目录失败:', err)
    message.error('选择目录失败')
  }
}

function handleProxyToggle(e: Event) {
  const enable = (e.target as HTMLInputElement).checked
  updateSettings({
    proxy: { ...settings.value.proxy, enable }
  })
}

function updateProxy(patch: Partial<AppConfig['proxy']>) {
  updateSettings({
    proxy: { ...settings.value.proxy, ...patch }
  })
}

function handleReset() {
  if (window.confirm('确认恢复默认设置？\n所有应用设置将恢复为初始状态。')) {
    appStore.resetSettings()
    // 更新主进程配置
    if (window.electronAPI) {
      window.electronAPI.app.setLoginItem(false)
    }
  }
}

async function handleSyncMenus() {
  isSyncing.value = true
  try {
    const res = await authStore.syncLocalMenus()
    if (res.success) {
      message.success('菜单同步成功')
    } else {
      message.error(`同步失败: ${res.error}`)
    }
  } catch (err: any) {
    message.error(`意外错误: ${err.message}`)
  } finally {
    isSyncing.value = false
  }
}
</script>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 680px;
}

.page-header {
  margin-bottom: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.page-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.setting-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0;
}

.setting-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
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
  background: var(--border-color);
  margin: 0 20px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.setting-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

/* 主题选择器 */
.theme-selector {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: var(--border-radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  font-family: var(--font-family);
}

.theme-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.theme-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-bg);
  color: var(--primary-color);
}

.theme-icon {
  display: flex;
  align-items: center;
}

/* 滑块 */
.slider-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.slider-label {
  font-size: 12px;
  color: var(--text-tertiary);
  min-width: 28px;
  text-align: center;
}

.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 140px;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  transition: transform var(--transition-fast);
  box-shadow: 0 1px 4px rgba(20, 86, 255, 0.3);
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

/* Toggle 开关 */
.toggle {
  position: relative;
  display: inline-flex;
  cursor: pointer;
  flex-shrink: 0;
}

.toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-track {
  width: 40px;
  height: 22px;
  background: var(--border-color-strong);
  border-radius: 11px;
  transition: background var(--transition-base);
  display: block;
}

.toggle-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform var(--transition-base);
}

.toggle input:checked + .toggle-track {
  background: var(--primary-color);
}

.toggle input:checked + .toggle-track::after {
  transform: translateX(18px);
}

/* 输入框组合 */
.input-action-wrap {
  display: flex;
  gap: 12px;
  flex: 1;
  max-width: 400px;
}

.text-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: all var(--transition-fast);
}

.text-input:focus {
  border-color: var(--primary-color);
  background: var(--bg-primary);
}

.proxy-inputs {
  display: flex;
  gap: 8px;
  flex: 1;
  max-width: 400px;
}

.select-input {
  width: 90px;
  padding: 8px;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.port-input {
  width: 80px;
  flex: none;
}

.proxy-notice {
  padding: 0 20px 16px;
  margin-top: -8px;
}

.btn-primary-ghost {
  padding: 6px 12px;
  border-radius: var(--border-radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--primary-color);
  background: transparent;
  color: var(--primary-color);
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.btn-primary-ghost:hover:not(:disabled) {
  background: var(--primary-bg);
}

.btn-primary-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 危险按钮 */
.btn-danger-ghost {
  padding: 6px 16px;
  border-radius: var(--border-radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--danger-color);
  transition: all var(--transition-fast);
  font-family: var(--font-family);
  flex-shrink: 0;
}

.btn-danger-ghost:hover {
  background: var(--danger-bg);
  border-color: var(--danger-color);
}
</style>
