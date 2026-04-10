import log from 'electron-log'
import { initAppHandlers } from './appHandlers'
import { initTongHuaShunHandlers } from './tonghuashunHandlers'
import { initDbHandlers } from './dbHandlers'
import { initFileHandlers } from './fileHandlers'
import { initUpdateHandlers } from './updateHandlers'

export function initAllHandlers(): void {
  log.info('[IPCRegistry] 初始化所有 IPC 处理器')

  initDbHandlers()
  initFileHandlers()
  initAppHandlers()
  initTongHuaShunHandlers()
  initUpdateHandlers()

  log.info('[IPCRegistry] 所有 IPC 处理器初始化完成')
}
