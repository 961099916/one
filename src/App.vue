<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN">
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
