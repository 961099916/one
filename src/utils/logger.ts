/**
 * 日志工具封装
 * 统一的日志接口，根据环境切换实现
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

function getTimestamp(): string {
  const now = new Date()
  const pad = (n: number): string => n.toString().padStart(2, '0')
  const pad3 = (n: number): string => n.toString().padStart(3, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad3(now.getMilliseconds())}`
}

const consoleLogger: Logger = {
  debug: (...args) => {
    // eslint-disable-next-line no-console
    console.debug(`[${getTimestamp()}] [DEBUG]`, ...args)
  },
  info: (...args) => {
    // eslint-disable-next-line no-console
    console.info(`[${getTimestamp()}] [INFO]`, ...args)
  },
  warn: (...args) => {
    // eslint-disable-next-line no-console
    console.warn(`[${getTimestamp()}] [WARN]`, ...args)
  },
  error: (...args) => {
    // eslint-disable-next-line no-console
    console.error(`[${getTimestamp()}] [ERROR]`, ...args)
  },
}

const silentLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: (...args) => {
    // eslint-disable-next-line no-console
    console.warn(`[${getTimestamp()}] [WARN]`, ...args)
  },
  error: (...args) => {
    // eslint-disable-next-line no-console
    console.error(`[${getTimestamp()}] [ERROR]`, ...args)
  },
}

const isDev = import.meta.env.DEV
const logger: Logger = isDev ? consoleLogger : silentLogger

export const log = logger
export { logger }
export default logger
