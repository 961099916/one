import log from 'electron-log'
import { bootstrap } from './core/appBootstrap'

log.info('[Main] 应用启动中...')

bootstrap().catch((err) => {
  log.error('[Main] 应用启动失败:', err)
})

