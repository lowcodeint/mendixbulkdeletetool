console.log('Worker initialized');
self.onmessage = function (e) {
  console.log('Message received in worker:', e.data);
};
// csvWorker.js
self.onmessage = function (e) {
    const { csvContent, excludedModules } = e.data;
    const rows = csvContent.split('\n').slice(1).filter((row) => row.trim().length > 0);
    const results = [];
  
    // Parse rows
    rows.forEach((row, index) => {
      const columns = row.split(',').map((col) => col.trim());
      if (columns.length >= 4) {
        const moduleName = columns[1];
        const itemName = columns[2];
        const itemType = columns[3].split(" '")[0].toLowerCase();
  
        // Check exclusion and normalize item types
        if (!excludedModules.includes(moduleName)) {
          results.push({ moduleName, itemName, itemType });
        }
      }
    });
  
    // Send parsed results back to the main thread
    self.postMessage({ results });
  };
  