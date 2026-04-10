/**
 * 模型下载服务
 * 负责模型文件的下载功能
 */
import * as path from 'path'
import * as fs from 'fs/promises'
import * as https from 'https'
import { type BrowserWindow } from 'electron'
import log from 'electron-log'
import { IpcChannel } from '../../constants'
import { getModelsDirectory } from '../../utils/fileUtils'

export interface DownloadProgress {
  filename: string
  progress: number
}

/**
 * 模型下载服务
 */
export class ModelDownloadService {
  private mainWindow: BrowserWindow
  private isDownloading = false

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  /**
   * 下载模型文件
   */
  async downloadModel(url: string, filename: string): Promise<void> {
    try {
      if (this.isDownloading) {
        log.warn('[ModelDownloadService] 已有下载任务进行中')
        return
      }

      this.isDownloading = true

      const modelsDir = getModelsDirectory()
      await fs.mkdir(modelsDir, { recursive: true })

      const filePath = path.join(modelsDir, filename)
      const tempFilePath = filePath + '.download'

      log.info('[ModelDownloadService] 开始下载模型:', filename)
      log.info('[ModelDownloadService] 下载地址:', url)
      log.info('[ModelDownloadService] 保存路径:', filePath)

      this.sendDownloadProgress(filename, 0)

      const file = await fs.open(tempFilePath, 'w')
      const fileStream = file.createWriteStream()

      await new Promise<void>((resolve, reject) => {
        const request = https.get(url, response => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            const redirectUrl = response.headers.location
            if (redirectUrl) {
              log.info('[ModelDownloadService] 重定向到:', redirectUrl)
              this.downloadModel(redirectUrl, filename).then(resolve).catch(reject)
              return
            }
          }

          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}`))
            return
          }

          const totalSize = Number(response.headers['content-length']) || 0
          let downloadedSize = 0

          response.on('data', chunk => {
            downloadedSize += chunk.length
            fileStream.write(chunk)

            if (totalSize > 0) {
              const progress = Math.round((downloadedSize / totalSize) * 100)
              this.sendDownloadProgress(filename, progress)
            }
          })

          response.on('end', () => {
            fileStream.end()
            resolve()
          })

          response.on('error', reject)
        })

        request.on('error', reject)
      })

      await fs.rename(tempFilePath, filePath)
      log.info('[ModelDownloadService] 模型下载完成:', filename)

      this.sendDownloadComplete(filename)
    } catch (err) {
      log.error('[ModelDownloadService] 模型下载失败:', err)
      this.sendDownloadError(err instanceof Error ? err.message : String(err))
    } finally {
      this.isDownloading = false
    }
  }

  private sendDownloadProgress(filename: string, progress: number): void {
    this.mainWindow.webContents.send(IpcChannel.DOWNLOAD_PROGRESS, { filename, progress })
  }

  private sendDownloadComplete(filename: string): void {
    this.mainWindow.webContents.send(IpcChannel.DOWNLOAD_COMPLETE, { filename })
  }

  private sendDownloadError(error: string): void {
    this.mainWindow.webContents.send(IpcChannel.CHAT_ERROR, error)
  }
}
