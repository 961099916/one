/**
 * 数据库迁移与表结构管理
 * 基于 PRAGMA user_version 实现轻量级迁移引擎
 */
import log from 'electron-log'
import type { Database } from 'better-sqlite3'
import { getDB } from './connection'

// 当前数据库期望的最新版本
const LATEST_SCHEMA_VERSION = 8

/**
 * 初始化数据库架构并执行迁移
 */
export function initDatabaseSchema(): void {
  const db = getDB()
  
  // 获取当前数据库的版本号
  const currentVersion = db.pragma('user_version', { simple: true }) as number
  
  log.info(`[Database] 当前数据库版本: ${currentVersion}, 期望版本: ${LATEST_SCHEMA_VERSION}`)

  if (currentVersion < LATEST_SCHEMA_VERSION) {
    try {
      // 使用事务包裹迁移过程，确保原子性
      db.transaction(() => {
        if (currentVersion < 1) {
          log.info('[Database] 正在执行迁移 V1: 初始化基础聊天表...')
          migrateToV1(db)
        }
        
        if (currentVersion < 2) {
          log.info('[Database] 正在执行迁移 V2: 初始化选股通数据表...')
          migrateToV2(db)
        }
        
        if (currentVersion < 3) {
          log.info('[Database] 正在执行迁移 V3: 增加涨跌停统计字段...')
          migrateToV3(db)
        }

        if (currentVersion < 4) {
          log.info('[Database] 正在执行迁移 V4: 增加炸板统计字段...')
          migrateToV4(db)
        }

        if (currentVersion < 5) {
          log.info('[Database] 正在执行迁移 V5: 增加市场温度字段...')
          migrateToV5(db)
        }

        if (currentVersion < 6) {
          log.info('[Database] 正在执行迁移 V6: 初始化个股分池数据表...')
          migrateToV6(db)
        }

        if (currentVersion < 7) {
          log.info('[Database] 正在执行迁移 V7: 初始化每日题材热点数据表...')
          migrateToV7(db)
        }

        if (currentVersion < 8) {
          log.info('[Database] 正在执行迁移 V8: 为热点数据增加时间戳支持...')
          migrateToV8(db)
        }
        
        // 更新版本号
        db.pragma(`user_version = ${LATEST_SCHEMA_VERSION}`)
      })()
      
      log.info(`[Database] 数据库成功升级至版本 ${LATEST_SCHEMA_VERSION}`)
    } catch (err) {
      log.error('[Database] 数据库迁移失败:', err)
      throw err
    }
  } else {
    log.debug('[Database] 数据库版本已是最新，无需迁移')
  }
}

/**
 * 迁移 V1: 基础聊天模块
 */
function migrateToV1(db: Database): void {
  // 会话表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // 消息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `)

  // 索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC)`)
}

/**
 * 迁移 V2: 选股通管理模块
 */
function migrateToV2(db: Database): void {
  // 市场数据表
  db.exec(`
    CREATE TABLE IF NOT EXISTS market_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL UNIQUE,
      rise_count INTEGER DEFAULT 0,
      fall_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `)

  // 交易日历表
  db.exec(`
    CREATE TABLE IF NOT EXISTS trading_days (
      date TEXT PRIMARY KEY,
      is_trading INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // 索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_market_data_date ON market_data(date)`)
}

/**
 * 迁移 V3: 增加涨跌停统计字段
 */
function migrateToV3(db: Database): void {
  // SQLite 不支持一次性添加多列，需分两次执行
  try {
    db.exec(`ALTER TABLE market_data ADD COLUMN limit_up_count INTEGER DEFAULT 0`)
    db.exec(`ALTER TABLE market_data ADD COLUMN limit_down_count INTEGER DEFAULT 0`)
  } catch (err) {
    // 忽略“列已存在”的错误（防御性编程）
    log.warn('[Database] 迁移 V3 警告:', err)
  }
}
/**
 * 迁移 V4: 增加炸板统计字段
 */
function migrateToV4(db: Database): void {
  try {
    db.exec(`ALTER TABLE market_data ADD COLUMN limit_up_broken_count INTEGER DEFAULT 0`)
    db.exec(`ALTER TABLE market_data ADD COLUMN limit_up_broken_ratio REAL DEFAULT 0`)
  } catch (err) {
    log.warn('[Database] 迁移 V4 警告:', err)
  }
}
/**
 * 迁移 V5: 增加市场温度字段
 */
function migrateToV5(db: Database): void {
  try {
    db.exec(`ALTER TABLE market_data ADD COLUMN market_temperature REAL DEFAULT 0`)
  } catch (err) {
    log.warn('[Database] 迁移 V5 警告:', err)
  }
}

/**
 * 迁移 V6: 初始化个股分池数据表 (涨停池、跌停池等)
 */
function migrateToV6(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_pool_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_name TEXT NOT NULL,
      date TEXT NOT NULL,
      symbol TEXT NOT NULL,
      stock_name TEXT,
      reason_info TEXT,
      latest_price REAL,
      change_percent REAL,
      buy_lock_ratio REAL,
      turnover_ratio REAL,
      non_restricted_cap REAL,
      total_cap REAL,
      first_limit_up_time INTEGER,
      last_limit_up_time INTEGER,
      break_count INTEGER DEFAULT 0,
      board_count INTEGER DEFAULT 0,
      raw_data TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(pool_name, date, symbol)
    )
  `)

  // 索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_stock_pool_date ON stock_pool_data(date)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_stock_pool_symbol ON stock_pool_data(symbol)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_stock_pool_query ON stock_pool_data(pool_name, date)`)
}

/**
 * 迁移 V7: 初始化每日题材热点数据表
 */
function migrateToV7(db: Database): void {
  // 题材板块表
  db.exec(`
    CREATE TABLE IF NOT EXISTS surge_plates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      plate_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(date, plate_id)
    )
  `)

  // 热点个股表
  db.exec(`
    CREATE TABLE IF NOT EXISTS surge_stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      symbol TEXT NOT NULL,
      stock_name TEXT NOT NULL,
      price REAL,
      change_percent REAL,
      description TEXT,
      plate_ids TEXT, -- 存储为 JSON 字符串: [id1, id2, ...]
      is_limit_up INTEGER DEFAULT 0,
       enter_time INTEGER,
      raw_data TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(date, symbol)
    )
  `)

  // 索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_surge_plates_date ON surge_plates(date)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_surge_stocks_date ON surge_stocks(date)`)
}

/**
 * 迁移 V8: 为热点数据增加时间戳支持
 */
function migrateToV8(db: Database): void {
  // 1. 迁移 surge_plates (题材板块表)
  // 虽然 SQLite 不支持直接修改唯一约束，我们可以通过影子表迁移原始数据
  db.exec('ALTER TABLE surge_plates RENAME TO surge_plates_old')
  db.exec(`
    CREATE TABLE IF NOT EXISTS surge_plates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      plate_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(timestamp, plate_id)
    )
  `)
  // 将旧数据迁移，时间戳默认取当天 15:00:00 (Unix 秒)
  db.exec(`
    INSERT INTO surge_plates (date, timestamp, plate_id, name, description, created_at)
    SELECT date, strftime('%s', date || ' 15:00:00'), plate_id, name, description, created_at FROM surge_plates_old
  `)
  db.exec('DROP TABLE surge_plates_old')
  db.exec(`CREATE INDEX IF NOT EXISTS idx_surge_plates_timestamp ON surge_plates(timestamp)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_surge_plates_date ON surge_plates(date)`)

  // 2. 迁移 surge_stocks (热点个股表)
  db.exec('ALTER TABLE surge_stocks RENAME TO surge_stocks_old')
  db.exec(`
    CREATE TABLE IF NOT EXISTS surge_stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      stock_name TEXT NOT NULL,
      price REAL,
      change_percent REAL,
      description TEXT,
      plate_ids TEXT, 
      is_limit_up INTEGER DEFAULT 0,
       enter_time INTEGER,
      raw_data TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(timestamp, symbol)
    )
  `)
  db.exec(`
    INSERT INTO surge_stocks (date, timestamp, symbol, stock_name, price, change_percent, description, plate_ids, is_limit_up, enter_time, raw_data, created_at)
    SELECT date, strftime('%s', date || ' 15:00:00'), symbol, stock_name, price, change_percent, description, plate_ids, is_limit_up, enter_time, raw_data, created_at FROM surge_stocks_old
  `)
  db.exec('DROP TABLE surge_stocks_old')
  db.exec(`CREATE INDEX IF NOT EXISTS idx_surge_stocks_timestamp ON surge_stocks(timestamp)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_surge_stocks_date ON surge_stocks(date)`)
}
