import { ipcMain } from 'electron'
import log from 'electron-log'
import { cronOps, type ScheduledTask, type CreateTaskInput } from '../../core/cronService'
import { IpcChannel } from '../../constants'

export function initCronHandlers(): void {
  log.info('[CronHandlers] 初始化定时任务 IPC 处理器')

  ipcMain.handle(IpcChannel.CRON_LIST, async (): Promise<ScheduledTask[]> => {
    log.info('[IPC] 调用 CRON_LIST')
    try {
      return cronOps.getAll()
    } catch (err) {
      log.error('[CronHandlers] 获取任务列表失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.CRON_CREATE, async (_, input: CreateTaskInput): Promise<ScheduledTask> => {
    log.info('[IPC] 调用 CRON_CREATE, name:', input.name)
    try {
      return cronOps.create(input)
    } catch (err) {
      log.error('[CronHandlers] 创建任务失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.CRON_UPDATE, async (_, id: number, updates: Partial<CreateTaskInput & { enabled: boolean }>): Promise<ScheduledTask | null> => {
    log.info('[IPC] 调用 CRON_UPDATE, id:', id)
    try {
      return cronOps.update(id, updates)
    } catch (err) {
      log.error('[CronHandlers] 更新任务失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.CRON_DELETE, async (_, id: number): Promise<void> => {
    log.info('[IPC] 调用 CRON_DELETE, id:', id)
    try {
      cronOps.delete(id)
    } catch (err) {
      log.error('[CronHandlers] 删除任务失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.CRON_TOGGLE, async (_, id: number, enabled: boolean): Promise<ScheduledTask | null> => {
    log.info('[IPC] 调用 CRON_TOGGLE, id:', id, 'enabled:', enabled)
    try {
      return cronOps.toggle(id, enabled)
    } catch (err) {
      log.error('[CronHandlers] 切换任务状态失败:', err)
      throw err
    }
  })
}
