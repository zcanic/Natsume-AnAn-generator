const { app, BrowserWindow, globalShortcut, clipboard, ipcMain, Notification } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const startUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '.next/server/app/index.html')}`; // Adjust for production

  // For now, in dev mode, we load localhost
  if (process.env.NODE_ENV === 'development') {
      mainWindow.loadURL('http://localhost:3000');
      mainWindow.webContents.openDevTools();
  } else {
      // In production, we might need a different strategy for Next.js
      // Often it's easier to run a local server or use static export
      // For this MVP, let's assume we are focusing on the dev/tool aspect first
      // But for a real build, we should use 'next export' (output: export) and load index.html
      // OR use a custom server.
      // Let's try to load the dev URL for now or a static file if exported.
      // To keep it simple for the "tool" request:
      mainWindow.loadURL('http://localhost:3000'); 
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Register a 'CommandOrControl+Shift+M' shortcut listener.
  // Alt+M might be conflicting or reserved.
  const ret = globalShortcut.register('CommandOrControl+Shift+M', () => {
    console.log('CommandOrControl+Shift+M is pressed');
    
    const text = clipboard.readText();
    
    if (text) {
        if (mainWindow) {
            mainWindow.webContents.send('generate-meme-from-text', text);
            mainWindow.show();
            mainWindow.focus();
        }
    } else {
        console.log('Clipboard is empty');
    }
  });

  if (!ret) {
    console.log('registration failed');
  }

  console.log(globalShortcut.isRegistered('CommandOrControl+Shift+M'));

  app.on('activate', function () {
    if (mainWindow === null) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  // Unregister a shortcut.
  globalShortcut.unregisterAll();
});

// Handle IPC from renderer
ipcMain.on('meme-generated', (event, buffer) => {
    // buffer is the PNG image buffer
    try {
        const image = require('electron').nativeImage.createFromBuffer(Buffer.from(buffer));
        clipboard.writeImage(image);
        
        new Notification({
            title: '夏目安安Bot',
            body: 'Meme 已生成并复制到剪贴板！'
        }).show();
        
    } catch (error) {
        console.error('Failed to write image to clipboard:', error);
    }
});
