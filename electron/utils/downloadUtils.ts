/**
 * 模型下载工具函数
 *
 * 功能说明：
 * - 支持 HTTP/HTTPS 下载
 * - 自动处理 301/302/303/307/308 重定向
 * - 实时下载进度反馈
 * - 文件完整性验证（文件大小检查）
 * - 失败时自动清理临时文件
 */

import * as fs from 'fs'
import * as https from 'https'
import type { BrowserWindow } from 'electron'
import { safeDeleteFile } from './fileUtils'
import { DownloadConfig, IpcChannel } from '@common/constants'

// ==================== 类型定义 ====================

/**
 * 下载选项接口
 */
interface DownloadOptions {
  /** 下载 URL */
  url: string
  /** 保存文件的完整路径 */
  destPath: string
  /** 文件名（用于进度显示） */
  filename: string
  /** 主窗口实例（用于发送 IPC 事件） */
  mainWindow: BrowserWindow
}

// ==================== 公共函数 ====================

/**
 * 下载文件（支持 HTTP 重定向）
 *
 * 下载流程：
 * 1. 发送 HTTP GET 请求
 * 2. 检查是否为重定向（301/302/303/307/308）
 * 3. 如果是重定向，递归调用下载新地址
 * 4. 如果正常响应，开始下载并更新进度
 * 5. 下载完成后验证文件完整性
 *
 * @param options - 下载选项
 */
export function downloadFile(options: DownloadOptions): void {
  const { url, destPath, filename, mainWindow } = options

  // 创建可写文件流
  const file = fs.createWriteStream(destPath)

  // 发送 HTTPS GET 请求
  https
    .get(url, response => {
      // ==================== 处理重定向 ====================
      if (DownloadConfig.REDIRECT_STATUS_CODES.includes(response.statusCode as unknown as 301 | 302 | 303 | 307 | 308)) {
        const location = response.headers.location
        if (location) {
          // 关闭当前文件流
          file.close()
          // 删除已创建的空文件
          safeDeleteFile(destPath)
          // 递归下载重定向后的地址
          downloadFile({ ...options, url: location })
          return
        }
      }

      // ==================== 检查响应状态 ====================
      if (response.statusCode !== 200) {
        file.close()
        safeDeleteFile(destPath)
        // 通知渲染进程下载失败
        sendDownloadComplete(mainWindow, {
          success: false,
          error: `HTTP ${response.statusCode}`,
        })
        return
      }

      // ==================== 下载进度跟踪 ====================
      const totalSize = parseInt(response.headers['content-length'] || '0', 10)
      let downloaded = 0

      // 监听数据块接收事件，更新进度
      response.on('data', chunk => {
        downloaded += chunk.length
        if (totalSize > 0) {
          const progress = (downloaded / totalSize) * 100
          sendDownloadProgress(mainWindow, { name: filename, progress })
        }
      })

      // 将响应数据流写入文件
      response.pipe(file)

      // ==================== 下载完成验证 ====================
      file.on('finish', () => {
        file.close()
        // 验证下载的文件是否完整
        validateDownload(destPath, totalSize, filename, mainWindow)
      })
    })
    // ==================== 网络错误处理 ====================
    .on('error', err => {
      file.close()
      safeDeleteFile(destPath)
      sendDownloadComplete(mainWindow, {
        success: false,
        error: err.message,
      })
    })
}

// ==================== 私有辅助函数 ====================

/**
 * 验证下载的文件是否完整有效
 *
 * 验证规则：
 * 1. 文件大小必须大于最小阈值（1MB），避免下载到 HTML 错误页面
 * 2. 如果服务器返回了 Content-Length，文件大小必须完全匹配
 *
 * @param destPath - 下载的文件路径
 * @param totalSize - 服务器声明的文件总大小（字节）
 * @param filename - 文件名
 * @param mainWindow - 主窗口实例
 */
function validateDownload(
  destPath: string,
  totalSize: number,
  filename: string,
  mainWindow: BrowserWindow
): void {
  try {
    // 获取文件状态信息
    const stats = fs.statSync(destPath)

    // 验证 1：文件大小必须大于 1MB
    // 原因：Hugging Face 等网站有时会返回 HTML 错误页面而非模型文件
    if (stats.size < DownloadConfig.MIN_FILE_SIZE) {
      safeDeleteFile(destPath)
      sendDownloadComplete(mainWindow, {
        success: false,
        error: '下载文件过小 (< 1MB)，可能不是有效的模型文件',
      })
      return
    }

    // 验证 2：如果服务器返回了 Content-Length，文件大小必须完全匹配
    if (totalSize > 0 && stats.size !== totalSize) {
      safeDeleteFile(destPath)
      const downloadedMB = Math.round(stats.size / 1024 / 1024)
      const totalMB = Math.round(totalSize / 1024 / 1024)
      sendDownloadComplete(mainWindow, {
        success: false,
        error: `网络连接中断。已下载 ${downloadedMB}MB / ${totalMB}MB，请检查网络后重试`,
      })
      return
    }

    // 验证通过，通知下载成功
    sendDownloadComplete(mainWindow, { success: true, name: filename })
  } catch (err) {
    // 验证过程出错，删除文件
    safeDeleteFile(destPath)
    sendDownloadComplete(mainWindow, {
      success: false,
      error: err instanceof Error ? err.message : '下载验证失败',
    })
  }
}

/**
 * 发送下载进度更新到渲染进程
 *
 * @param mainWindow - 主窗口实例
 * @param data - 进度数据
 */
function sendDownloadProgress(
  mainWindow: BrowserWindow,
  data: { name: string; progress: number }
): void {
  mainWindow.webContents.send(IpcChannel.DOWNLOAD_PROGRESS, data)
}

/**
 * 发送下载完成事件到渲染进程
 *
 * @param mainWindow - 主窗口实例
 * @param result - 下载结果
 */
function sendDownloadComplete(
  mainWindow: BrowserWindow,
  result: { success: boolean; name?: string; error?: string }
): void {
  mainWindow.webContents.send(IpcChannel.DOWNLOAD_COMPLETE, result)
}
