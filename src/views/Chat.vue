<template>
  <n-layout class="chat-root" :native-scrollbar="false">
    <n-layout-header bordered class="chat-header">
      <div class="header-content">
        <h2 class="chat-title">{{ currentSession?.title || 'One AI' }}</h2>
        <n-tag v-if="activeModel" type="primary" size="small" round :bordered="false" class="model-tag">
          {{ activeModel }}
        </n-tag>
        <n-tag v-else type="warning" size="small" round pointer @click="goToSettings">
          请选择模型
        </n-tag>
        <div class="header-actions">
          <n-button
            v-if="messages.length > 0"
            quaternary
            circle
            @click="clearCurrentSession"
            title="清空对话"
          >
            <template #icon>
              <n-icon><trash-outline /></n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </n-layout-header>

    <n-layout-content class="chat-main" ref="messagesContainer">
      <n-scrollbar ref="scrollbarRef">
        <div class="messages-inner">
          <EmptyState v-if="messages.length === 0" @suggestion-click="onSuggestionClick" />
          <MessageItem
            v-for="(msg, index) in messages"
            v-else
            :key="index"
            :message="msg"
            :show-cursor="isGenerating && index === messages.length - 1 && msg.role === 'assistant'"
          />
        </div>
      </n-scrollbar>
    </n-layout-content>

    <n-layout-footer class="chat-footer">
      <ChatInput
        v-model="input"
        :is-generating="isGenerating"
        :has-model="!!activeModel"
        @submit="sendMessage"
        @stop="stopGeneration"
      />
    </n-layout-footer>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useChat } from '@/composables/useChat'
import { NLayout, NLayoutHeader, NLayoutContent, NLayoutFooter, NTag, NButton, NIcon, NScrollbar } from 'naive-ui'
import MessageItem from '@/components/MessageItem.vue'
import EmptyState from '@/components/EmptyState.vue'
import ChatInput from '@/components/ChatInput.vue'
import { TrashOutline } from '@vicons/ionicons5'

const {
  messages,
  input,
  isGenerating,
  activeModel,
  currentSession,
  goToSettings,
  sendMessage,
  stopGeneration,
  clearCurrentSession,
} = useChat()

const scrollbarRef = ref<any>(null)

function onSuggestionClick(text: string) {
  input.value = text
}

// 自动滚动到底部
watch(() => messages.value.length, () => {
  nextTick(() => {
    scrollbarRef.value?.scrollTo({ position: 'bottom', silent: true })
  })
}, { deep: true })
</script>

<style scoped>
.chat-root {
  height: 100%;
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.chat-header {
  height: 64px;
  display: flex;
  align-items: center;
  background-color: var(--bg-primary);
}

.header-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 24px;
  position: relative;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.model-tag {
  font-size: 11px;
}

.header-actions {
  position: absolute;
  right: 24px;
}

.chat-main {
  flex: 1;
  background-color: var(--bg-app);
}

.messages-inner {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.chat-footer {
  padding: 0 24px 24px;
  background-color: var(--bg-app);
}
</style>
