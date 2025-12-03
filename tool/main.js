const { app, BrowserWindow, globalShortcut, clipboard, ipcMain, Notification } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load static export from 'out' folder
    mainWindow.loadFile(path.join(__dirname, 'out', 'index.html'));
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
            // Silent mode: do not show or focus window
            // mainWindow.show();
            // mainWindow.focus();
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
