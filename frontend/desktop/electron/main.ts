import { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = !app.isPackaged;

let currentModels = {
  asr: 'Whisper Large v3',
  translation: 'GPT-4o',
  correction: 'Claude 3.5 Sonnet',
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
  const winWidth = 700;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: 160,
    x: Math.max(0, Math.round((screenWidth - winWidth) / 2)),
    y: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    minWidth: 400,
    minHeight: 54,
    maxWidth: 800,
    maxHeight: 400,
    skipTaskbar: false,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
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
  tray.setToolTip('AI同声转译助手');
  tray.on('double-click', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  });
}

function updateTrayMenu() {
  const ctx = Menu.buildFromTemplate([
    { label: 'AI同声转译助手', enabled: false },
    { type: 'separator' },
    {
      label: '显示/隐藏工具栏',
      click: () => { if (mainWindow) mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show(); },
    },
    { type: 'separator' },
    {
      label: 'ASR 模型',
      submenu: [
        { label: 'Whisper Large v3', type: 'radio', checked: currentModels.asr === 'Whisper Large v3', click: () => switchModel('asr', 'Whisper Large v3') },
        { label: 'Whisper Medium', type: 'radio', checked: currentModels.asr === 'Whisper Medium', click: () => switchModel('asr', 'Whisper Medium') },
        { label: 'FunASR Paraformer', type: 'radio', checked: currentModels.asr === 'FunASR Paraformer', click: () => switchModel('asr', 'FunASR Paraformer') },
        { label: 'SenseVoice', type: 'radio', checked: currentModels.asr === 'SenseVoice', click: () => switchModel('asr', 'SenseVoice') },
      ],
    },
    {
      label: '翻译模型',
      submenu: [
        { label: 'GPT-4o', type: 'radio', checked: currentModels.translation === 'GPT-4o', click: () => switchModel('translation', 'GPT-4o') },
        { label: 'GPT-4o-mini', type: 'radio', checked: currentModels.translation === 'GPT-4o-mini', click: () => switchModel('translation', 'GPT-4o-mini') },
        { label: 'Claude 3.5 Sonnet', type: 'radio', checked: currentModels.translation === 'Claude 3.5 Sonnet', click: () => switchModel('translation', 'Claude 3.5 Sonnet') },
        { label: 'DeepSeek V3', type: 'radio', checked: currentModels.translation === 'DeepSeek V3', click: () => switchModel('translation', 'DeepSeek V3') },
      ],
    },
    {
      label: '纠错模型',
      submenu: [
        { label: 'Claude 3.5 Sonnet', type: 'radio', checked: currentModels.correction === 'Claude 3.5 Sonnet', click: () => switchModel('correction', 'Claude 3.5 Sonnet') },
        { label: 'GPT-4o', type: 'radio', checked: currentModels.correction === 'GPT-4o', click: () => switchModel('correction', 'GPT-4o') },
        { label: '关闭纠错', type: 'radio', checked: currentModels.correction === '关闭纠错', click: () => switchModel('correction', '关闭纠错') },
      ],
    },
    { type: 'separator' },
    { label: '退出 TransFlow', click: () => app.quit() },
  ]);
  tray?.setContextMenu(ctx);
}

function switchModel(type: string, model: string) {
  (currentModels as Record<string, string>)[type] = model;
  updateTrayMenu();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('model-changed', { type, model, all: currentModels });
  }
}

// ========== IPC ==========
ipcMain.handle('get-models', () => currentModels);
ipcMain.handle('set-model', (_e, { type, model }: { type: string; model: string }) => {
  (currentModels as Record<string, string>)[type] = model;
  updateTrayMenu();
  return currentModels;
});
ipcMain.on('hide-toolbar', () => mainWindow?.hide());
ipcMain.on('show-toolbar', () => { mainWindow?.show(); mainWindow?.focus(); });
ipcMain.on('start-resize', (_e, edge: string) => {
  const win = BrowserWindow.fromWebContents(_e.sender);
  if (!win) return;
  const bounds = win.getBounds();
  const p = screen.getCursorScreenPoint();
  const minW = 400, minH = 54, maxW = 800, maxH = 400;

  const onMove = (e2: Electron.IpcMainEvent, pos: { x: number; y: number }) => {
    const dx = pos.x - p.x;
    const dy = pos.y - p.y;
    let { x, y, width, height } = bounds;
    if (edge.includes('right')) width = Math.min(maxW, Math.max(minW, bounds.width + dx));
    if (edge.includes('bottom')) height = Math.min(maxH, Math.max(minH, bounds.height + dy));
    win.setBounds({ x, y, width, height });
  };

  ipcMain.on('resize-move', onMove);
  ipcMain.once('resize-end', () => {
    ipcMain.removeListener('resize-move', onMove);
  });
});

// ========== 生命周期 ==========
app.whenReady().then(() => {
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
