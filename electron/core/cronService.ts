import cron, { type ScheduledTask as CronScheduledTask } from 'node-cron'
import Database from 'better-sqlite3'
import log from 'electron-log'
import { getDBInstance } from '../infrastructure/database/sqlite'
import { executeTask } from '../services/tasks'

export interface ScheduledTask {
  id: number
  name: string
  cronExpression: string
  taskType: string
  enabled: boolean
  lastRunAt: number | null
  nextRunAt: number | null
  createdAt: number
  updatedAt: number
}

export interface CreateTaskInput {
  name: string
  cronExpression: string
  taskType: string
  enabled?: boolean
}

let db: Database.Database | null = null
const activeJobs = new Map<number, CronScheduledTask>()

export function initCronService(): void {
  try {
    db = getDBInstance()
    if (!db) {
      throw new Error('数据库未初始化，请先调用 initDB()')
    }

    log.info('[CronService] 定时任务服务初始化完成')
  } catch (err) {
    log.error('[CronService] 初始化失败:', err)
    throw err
  }
}

export const cronOps = {
  create(input: CreateTaskInput): ScheduledTask {
    if (!db) throw new Error('数据库未初始化')

    const now = Date.now()
    const stmt = db.prepare(`
      INSERT INTO scheduled_tasks
      (name, cron_expression, task_type, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      input.name,
      input.cronExpression,
      input.taskType,
      input.enabled !== false ? 1 : 0,
      now,
      now
    )

    const task = this.getById(Number(result.lastInsertRowid))
    if (task && task.enabled) {
      this.scheduleJob(task)
    }

    return task!
  },

  getAll(): ScheduledTask[] {
    if (!db) throw new Error('数据库未初始化')

    const stmt = db.prepare('SELECT * FROM scheduled_tasks ORDER BY created_at DESC')
    const rows = stmt.all() as any[]

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      cronExpression: row.cron_expression,
      taskType: row.task_type,
      enabled: !!row.enabled,
      lastRunAt: row.last_run_at,
      nextRunAt: row.next_run_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  },

  getById(id: number): ScheduledTask | null {
    if (!db) throw new Error('数据库未初始化')

    const stmt = db.prepare('SELECT * FROM scheduled_tasks WHERE id = ?')
    const row = stmt.get(id) as any

    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      cronExpression: row.cron_expression,
      taskType: row.task_type,
      enabled: !!row.enabled,
      lastRunAt: row.last_run_at,
      nextRunAt: row.next_run_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  },

  update(
    id: number,
    updates: Partial<CreateTaskInput & { enabled: boolean }>
  ): ScheduledTask | null {
    if (!db) throw new Error('数据库未初始化')

    const now = Date.now()
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.cronExpression !== undefined) {
      fields.push('cron_expression = ?')
      values.push(updates.cronExpression)
    }
    if (updates.taskType !== undefined) {
      fields.push('task_type = ?')
      values.push(updates.taskType)
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?')
      values.push(updates.enabled ? 1 : 0)
    }

    if (fields.length === 0) return this.getById(id)

    fields.push('updated_at = ?')
    values.push(now, id)

    const stmt = db.prepare(`UPDATE scheduled_tasks SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values)

    this.unscheduleJob(id)
    const task = this.getById(id)
    if (task && task.enabled) {
      this.scheduleJob(task)
    }

    return task
  },

  delete(id: number): void {
    if (!db) throw new Error('数据库未初始化')

    this.unscheduleJob(id)

    const stmt = db.prepare('DELETE FROM scheduled_tasks WHERE id = ?')
    stmt.run(id)
  },

  toggle(id: number, enabled: boolean): ScheduledTask | null {
    return this.update(id, { enabled })
  },

  scheduleJob(task: ScheduledTask): void {
    if (!cron.validate(task.cronExpression)) {
      log.error('[CronService] 无效的 Cron 表达式:', task.cronExpression)
      return
    }

    this.unscheduleJob(task.id)

    const job = cron.schedule(task.cronExpression, async () => {
      try {
        await this.executeTask(task)
      } catch (err) {
        log.error('[CronService] 任务执行异常:', task.name, err)
      }
    })

    activeJobs.set(task.id, job)
    log.info('[CronService] 任务已调度:', task.name)
  },

  unscheduleJob(id: number): void {
    const job = activeJobs.get(id)
    if (job) {
      job.stop()
      activeJobs.delete(id)
      log.debug('[CronService] 任务已取消:', id)
    }
  },

  async executeTask(task: ScheduledTask): Promise<void> {
    if (!db) throw new Error('数据库未初始化')

    const now = Date.now()

    // 更新最后运行时间
    const stmt = db.prepare(`
      UPDATE scheduled_tasks
      SET last_run_at = ?, updated_at = ?
      WHERE id = ?
    `)
    stmt.run(now, now, task.id)

    // 使用任务处理器执行业务逻辑
    await executeTask(task)
  },

  loadAndScheduleAll(): void {
    const tasks = this.getAll()
    log.info('[CronService] 加载任务数量:', tasks.length)

    // 延迟调度任务，避免启动时内存占用过高
    setTimeout(() => {
      for (const task of tasks) {
        if (task.enabled) {
          try {
            this.scheduleJob(task)
          } catch (err) {
            log.error('[CronService] 调度任务失败:', task.name, err)
          }
        }
      }
      log.info('[CronService] 所有任务调度完成')
    }, 3000) // 3秒后再调度任务
  },

  stopAll(): void {
    for (const [id, job] of activeJobs) {
      job.stop()
      log.debug('[CronService] 停止任务:', id)
    }
    activeJobs.clear()
  },
}

export function closeCronService(): void {
  cronOps.stopAll()
  log.info('[CronService] 定时任务服务已关闭')
}
