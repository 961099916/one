/**
 * 模型文件管理服务
 * 负责模型文件的列表、删除、导入等操作
 */
import * as path from 'path'
import * as fs from 'fs/promises'
import { dialog, type BrowserWindow } from 'electron'
import log from 'electron-log'
import { getModelsDirectory } from '../../utils/fileUtils'

/**
 * 模型文件服务
 */
export class ModelFileService {
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  /**
   * 列出所有模型文件
   */
  async listModels(): Promise<string[]> {
    try {
      const modelsDir = getModelsDirectory()
      log.info('[ModelFileService] 检查模型目录:', modelsDir)

      try {
        await fs.access(modelsDir)
      } catch {
        log.info('[ModelFileService] 模型目录不存在，返回空列表')
        return []
      }

      const files = await fs.readdir(modelsDir)
      const modelFiles = files.filter(file => file.endsWith('.gguf'))

      log.info('[ModelFileService] 找到模型文件:', modelFiles)
      return modelFiles
    } catch (err) {
      log.error('[ModelFileService] 列出模型失败:', err)
      return []
    }
  }

  /**
   * 删除模型文件
   */
  async deleteModel(modelName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const modelsDir = getModelsDirectory()
      const modelPath = path.join(modelsDir, modelName)

      log.info('[ModelFileService] 删除模型文件:', modelPath)

      await fs.unlink(modelPath)
      log.info('[ModelFileService] 模型删除成功')

      return { success: true }
    } catch (err) {
      log.error('[ModelFileService] 删除模型失败:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  /**
   * 导入模型文件
   */
  async importModel(): Promise<{ success: boolean; error?: string }> {
    try {
      log.info('[ModelFileService] importModel 被调用')
      const result = await dialog.showOpenDialog(this.mainWindow, {
        title: '选择模型文件',
        filters: [{ name: 'GGUF Models', extensions: ['gguf'] }],
        properties: ['openFile'],
      })

      log.info('[ModelFileService] 对话框结果:', result)

      if (result.canceled || result.filePaths.length === 0) {
        log.info('[ModelFileService] 用户取消选择')
        return { success: false, error: '用户取消选择' }
      }

      const sourcePath = result.filePaths[0]
      const modelsDir = getModelsDirectory()
      const filename = path.basename(sourcePath)
      const destPath = path.join(modelsDir, filename)

      log.info('[ModelFileService] 导入模型:', sourcePath)
      log.info('[ModelFileService] 目标路径:', destPath)

      await fs.mkdir(modelsDir, { recursive: true })
      await fs.copyFile(sourcePath, destPath)

      log.info('[ModelFileService] 模型导入成功:', filename)
      return { success: true }
    } catch (err) {
      log.error('[ModelFileService] 模型导入失败:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }
}
