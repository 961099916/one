<template>
  <n-config-provider 
    :locale="zhCN" 
    :date-locale="dateZhCN"
    :theme="activeTheme"
    :theme-overrides="activeThemeOverrides"
  >
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-loading-bar-provider>
            <div id="app-container">
              <router-view />
            </div>
          </n-loading-bar-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,
  zhCN,
  dateZhCN
} from 'naive-ui'
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import { arcoTechThemeOverrides, lightArcoThemeOverrides, darkTheme } from '@/styles/naive-theme'

const appStore = useAppStore()

const activeTheme = computed(() => {
  return appStore.currentTheme === 'dark' ? darkTheme : null
})

const activeThemeOverrides = computed(() => {
  return appStore.currentTheme === 'dark' ? arcoTechThemeOverrides : lightArcoThemeOverrides
})
</script>

<style>
#app {
  width: 100%;
  height: 100%;
}

#app-container {
  width: 100%;
  height: 100%;
}
</style>
