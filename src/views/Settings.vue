<template>
  <div class="page-wrap">
    <div class="page-header">
      <h2 class="page-title">AI 服务设置</h2>
      <p class="page-desc">配置云端 AI 服务商（DeepSeek / OpenAI）与生成参数</p>
    </div>

    <!-- 核心设置：AI 提供商切换 -->
    <section class="setting-section">
      <h3 class="section-title">核心设置</h3>
      <div class="setting-card">
        <!-- AI 服务商 -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">AI 服务来源</span>
            <span class="setting-desc">选择当前激活的云端 AI 模型提供商</span>
          </div>
          <div class="provider-toggle">
            <button 
              :class="['toggle-btn', { active: settingsStore.activeAiProvider === 'deepseek' }]"
              @click="settingsStore.setActiveAiProvider('deepseek')"
            >
              DeepSeek
            </button>
            <button 
              :class="['toggle-btn', { active: settingsStore.activeAiProvider === 'openai' }]"
              @click="settingsStore.setActiveAiProvider('openai')"
            >
              OpenAI
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 云端 API 设置 (DeepSeek) -->
    <section v-if="settingsStore.activeAiProvider === 'deepseek'" class="setting-section">
      <h3 class="section-title">DeepSeek 配置</h3>
      <div class="setting-card">
        <!-- API Key -->
        <div class="setting-row">
          <div class="setting-info" style="flex: 1">
            <span class="setting-label">API Key</span>
            <span class="setting-desc">输入从 DeepSeek 开放平台申请的 API Key</span>
            <input
              type="password"
              class="param-input-wide"
              placeholder="sk-..."
              :value="settingsStore.deepSeekConfig.apiKey"
              @change="(e: Event) => updateDeepSeek('apiKey', (e.target as HTMLInputElement).value)"
            />
          </div>
        </div>
        <div class="setting-divider" />

        <!-- Base URL -->
        <div class="setting-row">
          <div class="setting-info" style="flex: 1">
            <span class="setting-label">接口地址 (Base URL)</span>
            <span class="setting-desc">官方地址: https://api.deepseek.com</span>
            <input
              type="text"
              class="param-input-wide"
              placeholder="https://api.deepseek.com"
              :value="settingsStore.deepSeekConfig.baseUrl"
              @change="(e: Event) => updateDeepSeek('baseUrl', (e.target as HTMLInputElement).value)"
            />
          </div>
        </div>
        <div class="setting-divider" />

        <!-- Model Name -->
        <div class="setting-row">
          <div class="setting-info" style="flex: 1">
            <span class="setting-label">模型名称</span>
            <span class="setting-desc">建议: deepseek-chat (V3), deepseek-reasoner (R1)</span>
            <input
              type="text"
              class="param-input-wide"
              placeholder="deepseek-chat"
              :value="settingsStore.deepSeekConfig.model"
              @change="(e: Event) => updateDeepSeek('model', (e.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 云端 API 设置 (OpenAI) -->
    <section v-if="settingsStore.activeAiProvider === 'openai'" class="setting-section">
      <h3 class="section-title">OpenAI 配置</h3>
      <div class="setting-card">
        <!-- API Key -->
        <div class="setting-row">
          <div class="setting-info" style="flex: 1">
            <span class="setting-label">API Key</span>
            <span class="setting-desc">输入 OpenAI API 密钥</span>
            <input
              type="password"
              class="param-input-wide"
              placeholder="sk-..."
              :value="settingsStore.openAiConfig.apiKey"
              @change="(e: Event) => updateOpenAi('apiKey', (e.target as HTMLInputElement).value)"
            />
          </div>
        </div>
        <div class="setting-divider" />

        <!-- Base URL -->
        <div class="setting-row">
          <div class="setting-info" style="flex: 1">
            <span class="setting-label">接口地址 (Base URL)</span>
            <span class="setting-desc">默认: https://api.openai.com/v1</span>
            <input
              type="text"
              class="param-input-wide"
              placeholder="https://api.openai.com/v1"
              :value="settingsStore.openAiConfig.baseUrl"
              @change="(e: Event) => updateOpenAi('baseUrl', (e.target as HTMLInputElement).value)"
            />
          </div>
        </div>
        <div class="setting-divider" />

        <!-- Model Name -->
        <div class="setting-row">
          <div class="setting-info" style="flex: 1">
            <span class="setting-label">模型名称</span>
            <span class="setting-desc">例如: gpt-4o, gpt-3.5-turbo</span>
            <input
              type="text"
              class="param-input-wide"
              placeholder="gpt-4o"
              :value="settingsStore.openAiConfig.model"
              @change="(e: Event) => updateOpenAi('model', (e.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 通用生成参数 (对云端同样有效) -->
    <section class="setting-section">
      <h3 class="section-title">通用生成参数</h3>
      <div class="setting-card">
        <!-- System Prompt -->
        <div class="setting-row">
          <div class="setting-info" style="flex: 1">
            <span class="setting-label">系统提示词 (System Prompt)</span>
            <span class="setting-desc">定义 AI 的人设与基础响应规则</span>
            <textarea
              class="param-textarea"
              :value="settingsStore.generationParams.systemPrompt"
              rows="4"
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
            <span class="setting-label">回复最大长度 (Max Tokens)</span>
            <span class="setting-desc">控制 AI 单次输出的上限</span>
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
              >多样性控制 (Temperature): {{ settingsStore.generationParams.temperature }}</span
            >
            <span class="setting-desc">值越大回答越随机，值越小越严谨</span>
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
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/stores'

const settingsStore = useSettingsStore()

const updateParams = (
  key: keyof typeof settingsStore.generationParams, 
  val: string | number
) => {
  settingsStore.updateGenerationParams({ [key]: val })
}

const updateOpenAi = (
  key: keyof typeof settingsStore.openAiConfig,
  val: string
) => {
  settingsStore.updateOpenAiConfig({ [key]: val })
}

const updateDeepSeek = (
  key: keyof typeof settingsStore.deepSeekConfig,
  val: string
) => {
  settingsStore.updateDeepSeekConfig({ [key]: val })
}
</script>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
}

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

.setting-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

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

.param-input-wide {
  width: 100%;
  margin-top: 8px;
  padding: 10px 16px;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.param-input:focus,
.param-input-wide:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.param-slider {
  accent-color: var(--el-color-primary);
  width: 140px;
}

.provider-toggle {
  display: flex;
  background: var(--el-fill-color-light);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.toggle-btn {
  padding: 6px 16px;
  border-radius: 6px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
</style>
