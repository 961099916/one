/**
 * 文件存储 IPC 处理器
 *
 * 将文件操作通过 IPC 暴露给渲染进程
 */
import { ipcMain } from 'electron'
import {
  saveFile,
  saveImage,

  saveBase64Image,
  getAbsolutePath,
  fileExists,
  deleteFile,
  readFile,
} from '../../infrastructure/database'
import { IpcChannel } from '@common/constants'
import log from 'electron-log'

/**
 * 初始化文件存储 IPC 处理器
 */
export function initFileHandlers(): void {
  /** 保存文件 */
  ipcMain.handle(IpcChannel.FILE_SAVE, async (_event, sourcePath: string, originalName: string) => {
    log.info('[IPC] 调用 FILE_SAVE, originalName:', originalName)
    try {
      const relativePath = await saveFile(sourcePath, originalName)
      return { success: true, path: relativePath }
    } catch (err) {
      log.error('[File IPC] save 失败:', err)
      throw err
    }
  })

  /** 保存图片 */
  ipcMain.handle(IpcChannel.FILE_SAVE_IMAGE, async (_event, sourcePath: string, originalName: string) => {
    log.info('[IPC] 调用 FILE_SAVE_IMAGE, originalName:', originalName)
    try {
      const relativePath = await saveImage(sourcePath, originalName)
      return { success: true, path: relativePath }
    } catch (err) {
      log.error('[File IPC] save-image 失败:', err)
      throw err
    }
  })

  /** 保存 Base64 图片 */
  ipcMain.handle(IpcChannel.FILE_SAVE_BASE64_IMAGE, async (_event, base64Data: string, extension?: string) => {
    log.info('[IPC] 调用 FILE_SAVE_BASE64_IMAGE, extension:', extension)
    try {
      const relativePath = await saveBase64Image(base64Data, extension)
      return { success: true, path: relativePath }
    } catch (err) {
      log.error('[File IPC] save-base64-image 失败:', err)
      throw err
    }
  })

  /** 获取文件绝对路径 */
  ipcMain.handle(IpcChannel.FILE_GET_PATH, (_event, relativePath: string) => {
    log.info('[IPC] 调用 FILE_GET_PATH, relativePath:', relativePath)
    try {
      return getAbsolutePath(relativePath)
    } catch (err) {
      log.error('[File IPC] get-path 失败:', err)
      throw err
    }
  })

  /** 检查文件是否存在 */
  ipcMain.handle(IpcChannel.FILE_EXISTS, (_event, relativePath: string) => {
    log.info('[IPC] 调用 FILE_EXISTS, relativePath:', relativePath)
    try {
      return fileExists(relativePath)
    } catch (err) {
      log.error('[File IPC] exists 失败:', err)
      throw err
    }
  })

  /** 删除文件 */
  ipcMain.handle(IpcChannel.FILE_DELETE, async (_event, relativePath: string) => {
    log.info('[IPC] 调用 FILE_DELETE, relativePath:', relativePath)
    try {
      await deleteFile(relativePath)
      return { success: true }
    } catch (err) {
      log.error('[File IPC] delete 失败:', err)
      throw err
    }
  })

  /** 读取文件 */
  ipcMain.handle(IpcChannel.FILE_READ, async (_event, relativePath: string) => {
    log.info('[IPC] 调用 FILE_READ, relativePath:', relativePath)
    try {
      const buffer = await readFile(relativePath)
      return { success: true, data: buffer.toString('base64') }
    } catch (err) {
      log.error('[File IPC] read 失败:', err)
      throw err
    }
  })

  log.info('[File IPC] 文件存储 IPC 处理器注册完成')
}
