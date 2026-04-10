/**
 * 文件操作工具函数
 *
 * 提供模型文件相关的文件系统操作
 * 包括目录管理、文件列表、安全删除等功能
 */

import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

/**
 * 获取模型存储目录路径
 *
 * 模型存储在用户数据目录下的 models 文件夹中：
 * - macOS: ~/Library/Application Support/One/models
 * - Windows: %APPDATA%/One/models
 * - Linux: ~/.config/One/models
 *
 * @returns 模型目录的绝对路径
 */
export function getModelsDirectory(): string {
  const modelsDir = path.join(app.getPath('userData'), 'models')
  // 确保目录存在，不存在则创建
  ensureDirectoryExists(modelsDir)
  return modelsDir
}

/**
 * 确保指定目录存在，如果不存在则递归创建
 *
 * @param dirPath - 要检查的目录路径
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    // recursive: true 表示递归创建所有必需的父目录
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * 安全删除文件（忽略删除错误）
 *
 * 使用场景：
 * - 下载失败时清理临时文件
 * - 删除不再需要的模型文件
 *
 * @param filePath - 要删除的文件路径
 */
export function safeDeleteFile(filePath: string): void {
  try {
    // 先检查文件是否存在，避免异常
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch {
    // 静默失败，不抛出异常
    // 因为删除失败通常不影响核心功能
  }
}

/**
 * 列出指定目录下的所有 GGUF 格式模型文件
 *
 * @param modelsDir - 模型目录路径
 * @returns 模型信息数组，包含文件名和完整路径
 */
export function listModelFiles(modelsDir: string): Array<{ name: string; path: string }> {
  try {
    // 检查目录是否存在
    if (!fs.existsSync(modelsDir)) {
      return []
    }

    // 读取目录下的所有文件
    const files = fs.readdirSync(modelsDir)

    // 过滤 GGUF 文件并返回文件信息
    return files
      .filter(file => file.endsWith('.gguf'))
      .map(file => ({
        name: file,
        path: path.join(modelsDir, file),
      }))
  } catch {
    // 出错时返回空数组，避免应用崩溃
    return []
  }
}
