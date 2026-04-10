<template>
  <div class="page-card">
    <div class="home-container">
      <div class="home-content">
        <div class="welcome-section">
          <div class="logo-big">
            <n-icon size="64" color="var(--el-color-primary)">
              <library-outline />
            </n-icon>
          </div>
          <h1 class="welcome-title">欢迎使用 One AI !!!</h1>
          <p class="welcome-desc">本地 LLM 聊天助手，保护您的隐私安全</p>
        </div>

        <div class="quick-actions">
          <button class="action-card primary" @click="goToChat">
            <div class="action-icon">
              <n-icon size="32">
                <chatbox-outline />
              </n-icon>
            </div>
            <h3 class="action-title">开始对话</h3>
            <p class="action-desc">与 AI 进行智能对话</p>
          </button>

          <button class="action-card" @click="goToSettings">
            <div class="action-icon">
              <n-icon size="32">
                <settings-outline />
              </n-icon>
            </div>
            <h3 class="action-title">系统设置</h3>
            <p class="action-desc">配置模型和应用参数</p>
          </button>
        </div>

        <div class="features-section">
          <h2 class="section-title">产品特性</h2>
          <div class="features-grid">
            <div class="feature-item">
              <div class="feature-icon">
                <n-icon size="32">
                  <lock-closed-outline />
                </n-icon>
              </div>
              <h4 class="feature-title">隐私保护</h4>
              <p class="feature-desc">本地运行，数据完全离线</p>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <n-icon size="32">
                  <flash-outline />
                </n-icon>
              </div>
              <h4 class="feature-title">极速响应</h4>
              <p class="feature-desc">无需网络，即时反馈</p>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <n-icon size="32">
                  <cube-outline />
                </n-icon>
              </div>
              <h4 class="feature-title">多种模型</h4>
              <p class="feature-desc">支持多种主流 LLM 模型</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { RoutePath } from '@/constants'
import {
  ChatboxOutline,
  SettingsOutline,
  LockClosedOutline,
  FlashOutline,
  CubeOutline,
  LibraryOutline,
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const router = useRouter()

function goToChat() {
  router.push(RoutePath.CHAT)
}

function goToSettings() {
  router.push(RoutePath.SETTINGS)
}
</script>

<style scoped>
.page-card {
  flex: 1;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-base);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.home-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

.home-content {
  max-width: 800px;
  padding: 40px 24px;
  text-align: center;
}

.welcome-section {
  margin-bottom: 48px;
}

.logo-big {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 12px;
}

.welcome-desc {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 48px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-large);
  cursor: pointer;
  transition: all var(--el-transition-duration);
  text-align: center;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--el-box-shadow-light);
  border-color: var(--el-border-color);
}

.action-card.primary {
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border-color: var(--el-color-primary);
}

.action-card.primary .action-icon,
.action-card.primary .action-title,
.action-card.primary .action-desc {
  color: #fff;
}

.action-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-color-primary-light-9);
  border-radius: var(--el-border-radius-large);
  margin-bottom: 16px;
  color: var(--el-color-primary);
}

.action-card.primary .action-icon {
  background-color: rgba(255, 255, 255, 0.2);
}

.action-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px;
}

.action-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.features-section {
  padding-top: 32px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 24px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 24px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.feature-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: var(--el-color-primary);
}

.feature-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 6px;
}

.feature-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}
</style>
