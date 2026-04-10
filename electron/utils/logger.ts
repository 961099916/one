import log from 'electron-log'
import path from 'node:path'
import { app } from 'electron'

export function initLogger(): void {
  const userDataPath = app.getPath('userData')

  log.transports.file.level = 'debug'
  log.transports.file.maxSize = 5 * 1024 * 1024
  log.transports.file.archiveLog = (oldFile) => {
    const time = new Date().toISOString().replace(/[:.]/g, '-')
    return path.join(path.dirname(oldFile.path), `archive-${time}.log`)
  }

  log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

  log.transports.file.resolvePathFn = () => path.join(userDataPath, 'logs', 'main.log')

  log.info('[Logger] 日志系统初始化完成')
  log.info('[Logger] 日志文件路径:', log.transports.file.getFile().path)
}

export const logger = log
export default logger
