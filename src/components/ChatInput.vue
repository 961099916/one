<template>
  <div class="chat-input-container">
    <form class="input-form" @submit.prevent="handleSubmit">
      <div class="input-wrap">
        <textarea
          ref="inputRef"
          v-model="inputValue"
          placeholder="输入消息，Enter 发送，Shift + Enter 换行..."
          rows="1"
          :disabled="isGenerating || !hasModel"
          class="chat-input"
          @keydown="handleKeydown"
          @input="autoResize"
        />
      </div>
      <button
        v-if="!isGenerating"
        type="submit"
        :disabled="!inputValue.trim() || isGenerating || !hasModel"
        class="send-btn"
      >
        <n-icon size="20">
          <arrow-up-outline />
        </n-icon>
      </button>
      <button v-else type="button" class="stop-btn" @click="$emit('stop')">
        <n-icon size="20">
          <stop-outline />
        </n-icon>
      </button>
    </form>
    <div class="input-tip">内容由 AI 生成，请注意甄别</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ArrowUpOutline, StopOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

interface Props {
  modelValue: string
  isGenerating: boolean
  hasModel: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasModel: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
  stop: []
}>()

const inputRef = ref<HTMLTextAreaElement>()
const inputValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    inputValue.value = val
  }
)

watch(inputValue, (val) => {
  emit('update:modelValue', val)
})

function handleSubmit() {
  if (inputValue.value.trim()) {
    emit('submit')
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSubmit()
    if (inputRef.value) {
      inputRef.value.style.height = 'auto'
    }
  }
}

function autoResize() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}
</script>

<style scoped>
/* 聊天输入容器 */
.chat-input-container {
  padding: 0 24px 20px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

/* 表单样式 */
.input-form {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 12px 12px 12px 16px;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.input-form:focus-within {
  border-color: var(--primary-color);
  background: var(--bg-primary);
  box-shadow: 0 0 0 3px rgba(0, 82, 204, 0.1);
}

/* 输入区域 */
.input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
}

.chat-input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  padding: 0;
  outline: none;
  max-height: 160px;
  min-height: 24px;
  transition: all var(--transition-base);
}

.chat-input::placeholder {
  color: var(--text-placeholder);
}

.chat-input:disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}

/* 按钮样式 */
.send-btn,
.stop-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-md);
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-base);
  font-family: inherit;
}

.send-btn {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.send-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.send-btn:disabled {
  background: var(--border-color);
  color: var(--text-disabled);
  border-color: var(--border-color);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.stop-btn {
  background: var(--danger-color);
  color: white;
  border-color: var(--danger-color);
}

.stop-btn:hover {
  background: var(--danger-hover);
  border-color: var(--danger-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.stop-btn:disabled {
  background: var(--border-color);
  color: var(--text-disabled);
  border-color: var(--border-color);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 提示文字 */
.input-tip {
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 8px;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-input-container {
    padding: 0 16px 16px;
  }
  
  .input-form {
    padding: 10px 10px 10px 14px;
    gap: 10px;
  }
  
  .chat-input {
    font-size: 13px;
    line-height: 1.5;
    max-height: 140px;
  }
  
  .send-btn,
  .stop-btn {
    width: 32px;
    height: 32px;
  }
  
  .send-btn svg,
  .stop-btn svg {
    width: 16px;
    height: 16px;
  }
  
  .input-tip {
    font-size: 11px;
  }
}

/* 深色模式支持 */
[data-theme="dark"] .chat-input-container {
  background: var(--bg-dark);
  border-top-color: var(--border-color-dark);
}

[data-theme="dark"] .input-form {
  background: var(--bg-dark-secondary);
  border-color: var(--border-color-dark);
}

[data-theme="dark"] .chat-input {
  color: var(--text-dark-primary);
}

[data-theme="dark"] .chat-input::placeholder {
  color: var(--text-dark-placeholder);
}

[data-theme="dark"] .input-tip {
  color: var(--text-dark-tertiary);
}
</style>
