/**
 * 定时任务处理器注册表
 */
import log from 'electron-log'
import type { ScheduledTask } from '../../core/cronService'

// 任务处理器接口
export interface TaskHandler {
  name: string
  execute: (task: ScheduledTask) => Promise<void> | void
}

// 任务处理器注册表
const taskHandlers = new Map<string, TaskHandler>()

/**
 * 注册任务处理器
 */
export function registerTaskHandler(handler: TaskHandler): void {
  taskHandlers.set(handler.name, handler)
  log.info('[TaskRegistry] 注册任务处理器:', handler.name)
}

/**
 * 获取任务处理器
 */
export function getTaskHandler(taskType: string): TaskHandler | undefined {
  return taskHandlers.get(taskType)
}

/**
 * 获取所有已注册的任务处理器
 */
export function getAllTaskHandlers(): TaskHandler[] {
  return Array.from(taskHandlers.values())
}

/**
 * 执行任务
 */
export async function executeTask(task: ScheduledTask): Promise<void> {
  const handler = getTaskHandler(task.taskType)
  if (!handler) {
    log.warn('[TaskRegistry] 未找到任务处理器:', task.taskType)
    return
  }

  try {
    log.info('[TaskRegistry] 执行任务:', task.name, '类型:', task.taskType)
    await handler.execute(task)
  } catch (err) {
    log.error('[TaskRegistry] 任务执行失败:', task.name, err)
    throw err
  }
}
