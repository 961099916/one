/**
 * 文件存储服务
 *
 * 图片与文件存储在操作系统的 userData 目录下
 * 数据库只存储文件路径
 */
import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs/promises'
import { existsSync } from 'fs'
import log from 'electron-log'

// ==================== 目录定义 ====================

/**
 * 获取存储根目录
 */
export function getStorageRoot(): string {
  return path.join(app.getPath('userData'), 'storage')
}

/**
 * 获取文件存储目录
 */
export function getFilesDir(): string {
  return path.join(getStorageRoot(), 'files')
}

/**
 * 获取图片存储目录
 */
export function getImagesDir(): string {
  return path.join(getStorageRoot(), 'images')
}

/**
 * 获取模型存储目录
 */
export function getModelsDir(): string {
  return path.join(getStorageRoot(), 'models')
}

/**
 * 确保目录存在
 */
async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true })
    log.debug('[StorageService] 创建目录:', dirPath)
  }
}

/**
 * 初始化存储目录
 */
export async function initStorageDirs(): Promise<void> {
  await ensureDir(getStorageRoot())
  await ensureDir(getFilesDir())
  await ensureDir(getImagesDir())
  await ensureDir(getModelsDir())
  log.info('[StorageService] 存储目录初始化完成')
}

// ==================== 文件操作 ====================

/**
 * 生成唯一文件名
 */
function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName)
  const name = path.basename(originalName, ext)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${name}-${timestamp}-${random}${ext}`
}

/**
 * 保存文件到 files 目录
 * 返回相对路径（相对于 storage 根目录）
 */
export async function saveFile(
  sourcePath: string,
  originalName: string
): Promise<string> {
  const filename = generateUniqueFilename(originalName)
  const destPath = path.join(getFilesDir(), filename)

  await ensureDir(getFilesDir())
  await fs.copyFile(sourcePath, destPath)

  const relativePath = path.join('files', filename)
  log.debug('[StorageService] 保存文件:', relativePath)
  return relativePath
}

/**
 * 保存图片到 images 目录
 * 返回相对路径（相对于 storage 根目录）
 */
export async function saveImage(
  sourcePath: string,
  originalName: string
): Promise<string> {
  const filename = generateUniqueFilename(originalName)
  const destPath = path.join(getImagesDir(), filename)

  await ensureDir(getImagesDir())
  await fs.copyFile(sourcePath, destPath)

  const relativePath = path.join('images', filename)
  log.debug('[StorageService] 保存图片:', relativePath)
  return relativePath
}

/**
 * 保存 Base64 图片
 */
export async function saveBase64Image(
  base64Data: string,
  extension: string = 'png'
): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`
  const destPath = path.join(getImagesDir(), filename)

  await ensureDir(getImagesDir())

  // 移除 data:image/png;base64, 前缀
  const data = base64Data.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(data, 'base64')
  await fs.writeFile(destPath, buffer)

  const relativePath = path.join('images', filename)
  log.debug('[StorageService] 保存 Base64 图片:', relativePath)
  return relativePath
}

/**
 * 获取文件的绝对路径
 */
export function getAbsolutePath(relativePath: string): string {
  return path.join(getStorageRoot(), relativePath)
}

/**
 * 检查文件是否存在
 */
export function fileExists(relativePath: string): boolean {
  const absolutePath = getAbsolutePath(relativePath)
  return existsSync(absolutePath)
}

/**
 * 删除文件
 */
export async function deleteFile(relativePath: string): Promise<void> {
  const absolutePath = getAbsolutePath(relativePath)
  if (existsSync(absolutePath)) {
    await fs.unlink(absolutePath)
    log.debug('[StorageService] 删除文件:', relativePath)
  }
}

/**
 * 读取文件内容
 */
export async function readFile(relativePath: string): Promise<Buffer> {
  const absolutePath = getAbsolutePath(relativePath)
  return await fs.readFile(absolutePath)
}

/**
 * 获取文件大小（字节）
 */
export async function getFileSize(relativePath: string): Promise<number> {
  const absolutePath = getAbsolutePath(relativePath)
  const stats = await fs.stat(absolutePath)
  return stats.size
}
