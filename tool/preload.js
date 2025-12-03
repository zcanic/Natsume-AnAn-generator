const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  onGenerateMeme: (callback) => ipcRenderer.on('generate-meme-from-text', (event, text) => callback(text)),
  sendMemeGenerated: (buffer) => ipcRenderer.send('meme-generated', buffer)
});
