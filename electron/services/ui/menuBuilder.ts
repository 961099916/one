import { Menu, shell } from 'electron'
import log from 'electron-log'
import { VITE_DEV_SERVER_URL } from '../../core/appBootstrap'

export function buildAppMenu(): void {
  const appName = 'One AI'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: appName,
            submenu: [
              { label: `关于 ${appName}`, role: 'about' as const },
              { type: 'separator' as const },
              { label: '服务', role: 'services' as const },
              { type: 'separator' as const },
              { label: `隐藏 ${appName}`, role: 'hide' as const },
              { label: '隐藏其他', role: 'hideOthers' as const },
              { label: '显示全部', role: 'unhide' as const },
              { type: 'separator' as const },
              { label: '退出', role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' as const, accelerator: 'CmdOrCtrl+Z' },
        { label: '重做', role: 'redo' as const, accelerator: 'Shift+CmdOrCtrl+Z' },
        { type: 'separator' as const },
        { label: '剪切', role: 'cut' as const, accelerator: 'CmdOrCtrl+X' },
        { label: '复制', role: 'copy' as const, accelerator: 'CmdOrCtrl+C' },
        { label: '粘贴', role: 'paste' as const, accelerator: 'CmdOrCtrl+V' },
        { label: '全选', role: 'selectAll' as const, accelerator: 'CmdOrCtrl+A' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', role: 'reload' as const, accelerator: 'CmdOrCtrl+R' },
        { label: '强制重新加载', role: 'forceReload' as const, accelerator: 'Shift+CmdOrCtrl+R' },
        ...(VITE_DEV_SERVER_URL ? [{ label: '开发者工具', role: 'toggleDevTools' as const }] : []),
        { type: 'separator' as const },
        { label: '实际大小', role: 'resetZoom' as const },
        { label: '放大', role: 'zoomIn' as const },
        { label: '缩小', role: 'zoomOut' as const },
        { type: 'separator' as const },
        { label: '全屏', role: 'togglefullscreen' as const },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' as const, accelerator: 'CmdOrCtrl+M' },
        ...(process.platform === 'darwin'
          ? [
              { label: '关闭窗口', role: 'close' as const, accelerator: 'CmdOrCtrl+W' },
              { type: 'separator' as const },
              { label: '全部置于顶层', role: 'front' as const },
            ]
          : [{ label: '关闭', role: 'close' as const }]),
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '查看日志',
          click: () => {
            shell.openExternal('https://github.com/one-ai/one/issues')
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  log.info('[MenuBuilder] 应用菜单已设置')
}
