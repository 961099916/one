<template>
  <div class="chat-input-container">
    <div class="input-box" :class="{ focused: isFocused, disabled: !hasModel }">
      <textarea
        ref="inputRef"
        v-model="inputValue"
        :placeholder="placeholder"
        :disabled="isGenerating || !hasModel"
        rows="1"
        class="input-field"
        @keydown="handleKeydown"
        @input="autoResize"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <div class="input-actions">
        <button
          v-if="isGenerating"
          type="button"
          class="action-btn stop-btn"
          @click="$emit('stop')"
          title="停止生成"
        >
          <n-icon size="18"><stop-outline /></n-icon>
        </button>

        <button
          v-else
          type="button"
          class="action-btn send-btn"
          :disabled="!canSend"
          :class="{ active: canSend }"
          @click="handleSubmit"
          title="发送 (Enter)"
        >
          <n-icon size="18"><arrow-up-outline /></n-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ArrowUpOutline, StopOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

interface Props {
  modelValue: string
  isGenerating: boolean
  hasModel: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  hasModel: true,
  placeholder: '问问壹复盘：今日连板核心是谁？'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
  stop: []
}>()

const inputRef = ref<HTMLTextAreaElement>()
const inputValue = ref(props.modelValue)
const isFocused = ref(false)

const canSend = computed(() => {
  return inputValue.value.trim().length > 0 && !props.isGenerating && props.hasModel
})

watch(() => props.modelValue, (val) => {
  inputValue.value = val
  if (!val) resetHeight()
})

watch(inputValue, (val) => {
  emit('update:modelValue', val)
})

function handleSubmit(): void {
  if (!canSend.value) return
  emit('submit')
  resetHeight()
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSubmit()
  }
}

function autoResize(): void {
  const el = inputRef.value
  if (!el) return

  el.style.height = 'auto'
  const newHeight = Math.min(el.scrollHeight, 200)
  el.style.height = `${newHeight}px`
}

function resetHeight(): void {
  const el = inputRef.value
  if (el) el.style.height = 'auto'
}

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<style scoped>
.chat-input-container {
  width: 100%;
}

.input-box {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.input-box.focused {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 2px 16px rgba(var(--el-color-primary-rgb), 0.1);
}

.input-box.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-field {
  flex: 1;
  min-height: 24px;
  max-height: 200px;
  padding: 6px 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 15px;
  line-height: 1.6;
  resize: none;
  font-family: inherit;
}

.input-field::placeholder {
  color: var(--el-text-color-placeholder);
}

.input-field:disabled {
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  align-items: center;
  padding-bottom: 2px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-btn {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
}

.send-btn.active {
  background: var(--el-color-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
}

.send-btn.active:hover {
  transform: scale(1.05);
  background: var(--el-color-primary-light-3);
}

.stop-btn {
  background: var(--el-text-color-primary);
  color: white;
}

.stop-btn:hover {
  transform: scale(1.05);
  background: var(--el-text-color-regular);
}
</style>
