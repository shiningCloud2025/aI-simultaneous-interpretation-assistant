import { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain, globalShortcut, shell, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = !app.isPackaged;
// 桌面端 dev 端口（与平台端 5173 错开，避免加载到平台端页面）
const devUrl = process.env.DEV_URL || 'http://localhost:5174';
const platformUrl = process.env.PLATFORM_URL || 'http://www.easyapplyresume.com/';
const secureOrigins = [
  'http://www.easyapplyresume.com',
  'http://easyapplyresume.com',
  'http://120.48.177.183',
].join(',');

app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', secureOrigins);

/**
 * 托盘里展示的模型来自后端（用户在平台端配置的 BYOK 模型偏好），
 * 不再使用写死的示例模型。渲染进程登录后通过 update-tray-models 推送真实列表。
 */
let currentModels = {
  asr: '',
  llm: '',
};

/** 托盘菜单可用的模型选项（真实数据，未登录时为空） */
let trayModelOptions: {
  asr: { current: string; options: string[] };
  llm: { current: string; options: string[] };
} = {
  asr: { current: '', options: [] },
  llm: { current: '', options: [] },
};

// ========== 生成托盘图标 PNG ==========
function createTrayIconPNG(): Buffer {
  const w = 16, h = 16;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  const ihdr = makeChunk('IHDR', ihdrData);

  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    const off = y * (1 + w * 4);
    raw[off] = 0;
    for (let x = 0; x < w; x++) {
      const p = off + 1 + x * 4;
      const corner = (x < 2 && y < 2) || (x > 13 && y < 2) || (x < 2 && y > 13) || (x > 13 && y > 13);
      if (corner) {
        raw[p] = 0; raw[p + 1] = 0; raw[p + 2] = 0; raw[p + 3] = 0;
      } else {
        raw[p] = 0x2c; raw[p + 1] = 0x2c; raw[p + 2] = 0x2c; raw[p + 3] = 0xff;
      }
    }
  }
  const compressed = deflateSync(raw);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const tb = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([len, tb, data, crcBuf]);
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[i] = c;
}

// ========== 工具栏窗口 ==========
function createToolbarWindow() {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
  const winWidth = 900;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: 160,
    x: Math.max(0, Math.round((screenWidth - winWidth) / 2)),
    y: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    thickFrame: false,
    minWidth: 400,
    minHeight: 54,
    skipTaskbar: false,
    hasShadow: true,
    vibrancy: 'under-window',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ========== 托盘 ==========
function createTray() {
  const png = createTrayIconPNG();
  const icon = nativeImage.createFromBuffer(png, { width: 18, height: 18 });
  tray = new Tray(icon);
  updateTrayMenu();
  tray.setToolTip('智语同航');
  tray.on('double-click', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  });
}

function updateTrayMenu() {
  const ctx = Menu.buildFromTemplate([
    { label: '智语同航', enabled: false },
    { type: 'separator' },
    {
      label: '显示/隐藏工具栏',
      click: () => { if (mainWindow) mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show(); },
    },
    {
      label: '进入平台模式',
      click: () => switchWindowMode('platform'),
    },
    {
      label: '浏览器打开平台',
      click: () => shell.openExternal(platformUrl),
    },
    { type: 'separator' },
    buildModelSubmenu('ASR 模型', 'asr'),
    buildModelSubmenu('翻译模型', 'llm'),
    // 纠错与翻译一体：后端 CorrectionAgent 复用同一份 LLM 偏好，不提供独立选择
    { label: `纠错模型：${currentModels.llm || '随翻译'}`, enabled: false },
    { type: 'separator' },
    { label: '退出智语同航', click: () => app.quit() },
  ]);
  tray?.setContextMenu(ctx);
}

function switchWindowMode(mode: 'toolbar' | 'platform') {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.show();
  mainWindow.focus();

  if (mode === 'platform') {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const winWidth = Math.min(1280, Math.max(960, Math.round(width * 0.78)));
    const winHeight = Math.min(860, Math.max(640, Math.round(height * 0.78)));
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setMinimumSize(960, 640);
    mainWindow.setBounds({
      x: Math.max(0, Math.round((width - winWidth) / 2)),
      y: Math.max(0, Math.round((height - winHeight) / 2)),
      width: winWidth,
      height: winHeight,
    });
  } else {
    const { width } = screen.getPrimaryDisplay().workAreaSize;
    const winWidth = 900;
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setMinimumSize(400, 54);
    mainWindow.setBounds({
      x: Math.max(0, Math.round((width - winWidth) / 2)),
      y: 60,
      width: winWidth,
      height: 160,
    });
  }

  mainWindow.webContents.send('app-mode-changed', mode);
}

/**
 * 构建模型单选子菜单。未登录/未配置时给出引导项，点击后进入平台模式配置。
 */
function buildModelSubmenu(label: string, type: 'asr' | 'llm'): Electron.MenuItemConstructorOptions {
  const { current, options } = trayModelOptions[type];
  if (!options.length) {
    return { label: `${label}（未登录，请先登录）`, enabled: false };
  }
  return {
    label,
    submenu: options.map((model) => ({
      label: model,
      type: 'radio' as const,
      checked: current === model,
      click: () => switchModel(type, model),
    })),
  };
}

function switchModel(type: string, model: string) {
  (currentModels as Record<string, string>)[type] = model;
  if (type === 'asr') trayModelOptions.asr.current = model;
  if (type === 'llm') trayModelOptions.llm.current = model;
  updateTrayMenu();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('model-changed', { type, model, all: currentModels });
  }
}

// ========== IPC ==========
ipcMain.handle('get-models', () => currentModels);
ipcMain.handle('set-model', (_e, { type, model }: { type: string; model: string }) => {
  switchModel(type, model);
  return currentModels;
});
// 渲染进程登录后推送真实模型列表，用于重建托盘菜单
ipcMain.on(
  'update-tray-models',
  (
    _e,
    payload: {
      asr: { current: string; options: string[] };
      llm: { current: string; options: string[] };
    }
  ) => {
    trayModelOptions = payload;
    currentModels.asr = payload.asr.current;
    currentModels.llm = payload.llm.current;
    updateTrayMenu();
  }
);

ipcMain.on('hide-toolbar', () => mainWindow?.hide());
ipcMain.on('show-toolbar', () => { mainWindow?.show(); mainWindow?.focus(); });
ipcMain.on('set-window-mode', (_e, mode: 'toolbar' | 'platform') => switchWindowMode(mode));
ipcMain.on('open-platform-external', (_e, url: string) => {
  shell.openExternal(url || platformUrl);
});
ipcMain.on('toggle-fullscreen', () => {
  if (!mainWindow) return;
  const isFullScreen = mainWindow.isFullScreen();
  mainWindow.setFullScreen(!isFullScreen);
});
ipcMain.on('start-resize', (_e, edge: string) => {
  const win = BrowserWindow.fromWebContents(_e.sender);
  if (!win) return;
  const bounds = win.getBounds();
  const startPoint = screen.getCursorScreenPoint();
  // 用固定的最大值（4K）作为上限，不依赖 workAreaSize 防止循环
  const MAX_W = 4000;
  const MAX_H = 4000;
  const MIN_W = 400;
  const MIN_H = 54;

  const interval = setInterval(() => {
    const now = screen.getCursorScreenPoint();
    const dx = now.x - startPoint.x;
    const dy = now.y - startPoint.y;
    let x = bounds.x, y = bounds.y, w = bounds.width, h = bounds.height;

    if (edge.includes('right')) w = Math.max(MIN_W, Math.min(MAX_W, bounds.width + dx));
    if (edge.includes('left')) { w = Math.max(MIN_W, Math.min(MAX_W, bounds.width - dx)); x = bounds.x + dx; }
    if (edge.includes('bottom')) h = Math.max(MIN_H, Math.min(MAX_H, bounds.height + dy));
    if (edge.includes('top')) { h = Math.max(MIN_H, Math.min(MAX_H, bounds.height - dy)); y = bounds.y + dy; }

    // x/y 不能小于 0
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    // 如果 x/y 被调整导致 w/h 越界，再修正
    if (edge.includes('left') && (bounds.x + bounds.width) !== (x + w)) w = Math.max(MIN_W, bounds.x + bounds.width - x);

    win.setBounds({ x, y, width: w, height: h });
  }, 16);

  ipcMain.once('resize-end', () => clearInterval(interval));
});

// ========== 生命周期 ==========
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(['media', 'display-capture', 'fullscreen'].includes(permission));
  });
  createToolbarWindow();
  createTray();
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (mainWindow) mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createToolbarWindow();
  });
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => tray?.destroy());
