/**
 * 存储服务模块
 *
 * 统一管理应用的文件存储功能
 * 包括：目录管理、文件操作、模型目录等
 */
export {
  getStorageRoot,
  getFilesDir,
  getImagesDir,
  getModelsDir,
  initStorageDirs,
  saveFile,
  saveImage,
  saveBase64Image,
  getAbsolutePath,
  fileExists,
  deleteFile,
  readFile,
  getFileSize,
} from './storageService'

export {
  ensureDirectoryExists,
  safeDeleteFile,
  listModelFiles,
} from '../../utils/fileUtils'
