const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 可以暴露一些 Electron 特有的 API
});
