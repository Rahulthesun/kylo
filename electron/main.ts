import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  dialog,
  clipboard,
  globalShortcut
} from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { exec } from 'child_process'

const projects: { id: string; path: string }[] = []

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null = null

function createWindow() {
  const NABBER_WIDTH = 300//300

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  win = new BrowserWindow({
    width: NABBER_WIDTH,
    height: height,
    x: width - NABBER_WIDTH,
    y: 0,

    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    movable: false,
    focusable: true,
    hasShadow: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:ai_session'
    }
  })

  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.whenReady().then(() => {
  createWindow()

  // Alt + Q → toggle visibility
  globalShortcut.register('Alt+Q', () => {
    if (!win) return
    win.isVisible() ? win.hide() : win.show()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})


// --- HELPER: Native Paste ---
/*
 function simulatePaste() {
  const platform = process.platform

  if (platform === 'win32') {
    exec(
      'powershell -c "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys(\'^v\')"'
    )
  } else if (platform === 'darwin') {
    exec(
      'osascript -e \'tell application "System Events" to keystroke "v" using command down\''
    )
  }
}
 
 */



// --- IPC HANDLERS ---


ipcMain.handle('window:set-height', (_, height: number) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;

  const [width] = win.getSize();
  win.setSize(width, height, true);
});

ipcMain.handle('window:minimize-to-bar', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;

  const COLLAPSED_HEIGHT = 120;

  const display = screen.getDisplayMatching(win.getBounds());
  const { x, y, width: screenW, height: screenH } = display.workArea;

  const [winWidth] = win.getSize();

  win.setBounds(
    {
      x: x + screenW - winWidth,
      y: y + screenH - COLLAPSED_HEIGHT,
      width: winWidth,
      height: COLLAPSED_HEIGHT,
    },
    true // animate
  );
});

ipcMain.handle('window:expand-full', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;

  const display = screen.getDisplayMatching(win.getBounds());
  const { x, y, width: screenW, height: screenH } = display.workArea;

  const [winWidth] = win.getSize();

  win.setBounds(
    {
      x: x + screenW - winWidth,
      y,
      width: winWidth,
      height: screenH,
    },
    true // animate
  );

  
});


/*


// OLD CONTEXT OS FUNCTIONS 
ipcMain.handle('dialog:openDirectory', async () => {
  if (!win) return null

  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  })

  if (canceled || filePaths.length === 0) return null

  const folderPath = filePaths[0]
  const projectName = path.basename(folderPath)

  if (!projects.find(p => p.id === projectName)) {
    projects.push({ id: projectName, path: folderPath })
  }

  watcher.watchProject(folderPath, projectName)
  return { id: projectName, path: folderPath }
})

ipcMain.handle('context:refresh', async (_, projectId) => {
  const project = projects.find(p => p.id === projectId)
  if (!project) return false

  watcher.watchProject(project.path, project.id)
  return true
})


// 🧠 SMART PASTE ONLY (ask/query removed)
ipcMain.handle('context:paste-to-ai', async (_, { query, projectId }) => {
  console.log(`🚀 Preparing paste for [${projectId}]`)

  const contextResults = await engine.queryContext(query, projectId)
  const contextBlock = contextResults.join('\n\n')

  const finalPrompt = `I am working on a project named "${projectId}". Here is the relevant code context:\n\n${contextBlock}\n\n---\n\nQuestion: ${query}`

  clipboard.writeText(finalPrompt)

  win?.hide()

  setTimeout(simulatePaste, 600)
  return true
})


*/



// ❌ COMMENTED OUT — NOT NEEDED
// ipcMain.handle('context:ask', async (_, { query, projectId }) => {
//   return await engine.queryContext(query, projectId)
// })

// ipcMain.on('capture-enable', () => setTrackingEnabled(true))
// ipcMain.on('capture-disable', () => setTrackingEnabled(false))