import { app, globalShortcut, ipcMain, BrowserWindow, screen } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win = null;
function createWindow() {
  const NABBER_WIDTH = 300;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  win = new BrowserWindow({
    width: NABBER_WIDTH,
    height,
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
      preload: path.join(__dirname$1, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      partition: "persist:ai_session"
    }
  });
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.webContents.openDevTools({ mode: "detach" });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.whenReady().then(() => {
  createWindow();
  globalShortcut.register("Alt+Q", () => {
    if (!win) return;
    win.isVisible() ? win.hide() : win.show();
  });
});
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
ipcMain.handle("window:set-height", (_, height) => {
  const win2 = BrowserWindow.getFocusedWindow();
  if (!win2) return;
  const [width] = win2.getSize();
  win2.setSize(width, height, true);
});
ipcMain.handle("window:minimize-to-bar", () => {
  const win2 = BrowserWindow.getFocusedWindow();
  if (!win2) return;
  const COLLAPSED_HEIGHT = 120;
  const display = screen.getDisplayMatching(win2.getBounds());
  const { x, y, width: screenW, height: screenH } = display.workArea;
  const [winWidth] = win2.getSize();
  win2.setBounds(
    {
      x: x + screenW - winWidth,
      y: y + screenH - COLLAPSED_HEIGHT,
      width: winWidth,
      height: COLLAPSED_HEIGHT
    },
    true
    // animate
  );
});
ipcMain.handle("window:expand-full", () => {
  const win2 = BrowserWindow.getFocusedWindow();
  if (!win2) return;
  const display = screen.getDisplayMatching(win2.getBounds());
  const { x, y, width: screenW, height: screenH } = display.workArea;
  const [winWidth] = win2.getSize();
  win2.setBounds(
    {
      x: x + screenW - winWidth,
      y,
      width: winWidth,
      height: screenH
    },
    true
    // animate
  );
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
