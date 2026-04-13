<template>
  <div class="login-container">
    <div class="login-card glass-effect">
      <div class="login-header">
        <div class="logo-wrapper">
          <n-icon size="48" color="var(--primary-color)">
            <LeafOutline />
          </n-icon>
        </div>
        <h1 class="login-title">One Review</h1>
        <p class="login-subtitle">专业 A 股短线复盘与智能助手</p>
      </div>

      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        size="large"
        label-placement="left"
        class="login-form"
      >
        <n-form-item path="email">
          <n-input
            v-model:value="formValue.email"
            placeholder="请输入邮箱账号"
            @keydown.enter="handleLogin"
          >
            <template #prefix>
              <n-icon :component="MailOutline" />
            </template>
          </n-input>
        </n-form-item>
        
        <n-form-item path="password">
          <n-input
            v-model:value="formValue.password"
            type="password"
            show-password-on="click"
            placeholder="请输入登录密码"
            @keydown.enter="handleLogin"
          >
            <template #prefix>
              <n-icon :component="LockClosedOutline" />
            </template>
          </n-input>
        </n-form-item>

        <div class="form-actions">
          <n-button
            type="primary"
            block
            strong
            :loading="authStore.loading"
            @click="handleLogin"
            class="submit-btn"
          >
            立即登录
          </n-button>
        </div>
      </n-form>

      <div class="login-footer">
        <p>默认启用单设备登录校验</p>
      </div>
    </div>
    
    <div class="bg-decoration">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { useMessage, NIcon, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { MailOutline, LockClosedOutline, LeafOutline } from '@vicons/ionicons5'

const authStore = useAuthStore()
const router = useRouter()
const message = useMessage()

const formRef = ref(null)
const formValue = ref({
  email: '',
  password: ''
})

const rules = {
  email: {
    required: true,
    message: '请输入邮箱',
    trigger: 'blur'
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: 'blur'
  }
}

async function handleLogin() {
  if (!formValue.value.email || !formValue.value.password) {
    message.warning('请填写完整的登录信息')
    return
  }

  const result = await authStore.login(formValue.value.email, formValue.value.password)
  
  if (result.success) {
    message.success('登录成功')
    router.push('/')
  } else {
    message.error(result.error || '登录失败，请检查账号密码')
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-app);
  position: relative;
  overflow: hidden;
}

.login-card {
  width: 400px;
  padding: 48px;
  border-radius: 24px;
  z-index: 10;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-wrapper {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.login-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  opacity: 0.8;
}

.login-form {
  margin-top: 24px;
}

.submit-btn {
  height: 48px;
  font-size: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #3a7bd5 100%);
  border: none;
  margin-top: 12px;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3);
}

.login-footer {
  margin-top: 32px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 背景修饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
}

.blob-1 {
  width: 500px;
  height: 500px;
  background: var(--primary-color);
  top: -100px;
  right: -100px;
}

.blob-2 {
  width: 400px;
  height: 400px;
  background: #3498db;
  bottom: -50px;
  left: -50px;
}
</style>
