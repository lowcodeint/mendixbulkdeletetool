const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const multer = require('multer');
const readline = require('readline');
const fs = require('fs');
const { MendixPlatformClient } = require('mendixplatformsdk');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

app.use(express.json());

// Detect if running inside a pkg binary
const isPkg = typeof process.pkg !== 'undefined';

// Resolve base path for serving static files
const basePath = isPkg ? path.dirname(process.execPath) : __dirname;

// Serve static files (CSS, JS, images, etc.)
app.use('/public', express.static(path.join(basePath, 'public')));

// Serve index.html as the default route
app.get('/', (req, res) => {
    res.sendFile(path.join(basePath, 'public/index.html'));
});

// Function to read CSV file incrementally
const readCSVFile = async (filePath, processRow) => {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream });
    for await (const line of rl) {
        processRow(line);
    }
};

// Serve static files (CSS, JS, images, etc.)
app.use('/public', express.static(path.join(basePath, 'public')));

// SSE endpoint to stream logs for dynamic logging using operationId
const activeStreams = {}; // Store active streams by operationId

app.get('/stream-logs', (req, res) => {
    const { operationId } = req.query;

    if (!operationId) {
        res.status(400).send('Missing operationId');
        return;
    }

    // Set up headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Register the stream
    activeStreams[operationId] = (message) => res.write(`data: ${message}\n\n`);

    req.on('close', () => {
        console.log(`Stream closed for operationId: ${operationId}`);
        delete activeStreams[operationId];
    });
});

// Helper function to send logs
const sendLogToStream = (res, operationId, type, message) => {
    if (activeStreams[operationId]) {
        const logMessage = JSON.stringify({ operationId, type, message });
        activeStreams[operationId](`${logMessage}\n`);
    } else {
        console.log(`No active stream for operationId: ${operationId}`);
    }
};

// Endpoint to parse CSV and return parsed results for review
app.post('/parse-csv', upload.single('csvUpload'), async (req, res) => {
    const operationId = req.body.operationId || 'unknown';

    if (!req.file) {
        sendLogToStream(res, operationId, 'error', 'Error: No file uploaded.');
        return res.status(400).send({ error: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const results = [];
    let totalRows = 0;
    let skippedModules = 0;
    let skippedItemTypes = 0;
    let readyToProcess = 0;

    const validItemTypes = new Set([
        'microflow', 'nanoflow', 'page', 'constant', 'enumeration',
        'exportmapping', 'imagecollection', 'importmapping', 'javaaction',
        'javascriptaction', 'jsonstructure', 'layout', 'menu',
        'regularexpression', 'rule', 'snippet'
    ]);

    const normalizeItemType = (itemType) => {
        const normalizationMap = {
            microflow: 'microflow',
            nanoflow: 'nanoflow',
            page: 'page',
            constant: 'constant',
            enumeration: 'enumeration',
            "export mapping": 'exportmapping',
            "image collection": 'imagecollection',
            "import mapping": 'importmapping',
            javaaction: 'javaaction',
            "javascript action": 'javascriptaction',
            json: 'jsonstructure',
            layout: 'layout',
            menu: 'menu',
            "regular expression": 'regularexpression',
            rule: 'rule',
            snippet: 'snippet'
        };
        return normalizationMap[itemType] || itemType;
    };

    let excludedModules = [];
    try {
        excludedModules = JSON.parse(req.headers['excluded-modules'] || '[]');
    } catch (err) {
        sendLogToStream(res, operationId, 'error', 'Invalid excluded-modules header.');
    }

    try {
        await readCSVFile(filePath, (line) => {
            const columns = line.split(',').map((col) => col.trim());
            if (columns.length >= 4) {
                totalRows++;
                const moduleName = columns[1];
                const itemName = columns[2];
                const itemType = normalizeItemType(columns[3].split(" '")[0].toLowerCase());

                if (excludedModules.includes(moduleName)) {
                    skippedModules++;
             
                } else if (!validItemTypes.has(itemType)) {
                    skippedItemTypes++;

                } else {
                    results.push({ moduleName, itemName, itemType });
                    readyToProcess++;
                }
            }
        });

        fs.unlink(filePath, (err) => {
            if (err) sendLogToStream(res, operationId, 'error', 'Error cleaning up temp file.');
        });
        sendLogToStream(res, operationId, 'general', `Total Rows: ${totalRows}`);
        sendLogToStream(res, operationId, 'general', `Skipped Rows (Module): ${skippedModules}`);
        sendLogToStream(res, operationId, 'general', `Skipped Rows (Item Type): ${skippedItemTypes}`);
        sendLogToStream(res, operationId, 'general', `Pending Process Rows: ${readyToProcess}`);
        return res.json({ results });


    } catch (err) {
        sendLogToStream(res, operationId, 'error', `Error processing CSV file: ${err.message}`);
        return res.status(500).send({ error: 'Failed to process CSV file.' });

    }
});


// Bulk delete endpoint
app.post('/delete-bulk', async (req, res) => {
    const { appId, branchName, items, operationId } = req.body;

    if (!appId || !branchName || !items || !Array.isArray(items) || !operationId) {
        sendLogToStream(res, operationId, 'error', 'Invalid request data.');
    }

    sendLogToStream(res, operationId, 'general', 'Starting bulk deletion...');
    let totalDeleted = 0; // Counter for successful deletions
    try {
        const client = new MendixPlatformClient();
        const app = client.getApp(appId);
        sendLogToStream(res, operationId, 'general', `Creating working copy...`);
        const workingCopy = await app.createTemporaryWorkingCopy(branchName);
        sendLogToStream(res, operationId, 'general', `Opening working copy...`);
        const model = await workingCopy.openModel();
    

        for (const { moduleName, itemName, itemType } of items) {
            const qualifiedName = `${moduleName}.${itemName}`;
            let itemsToDelete = [];

             // Identify item type and find matches
             if (itemType === 'microflow') {
                itemsToDelete = (await model.allMicroflows()).filter((mf) => mf.qualifiedName === qualifiedName);
            } else if (itemType === 'nanoflow') {
                itemsToDelete = (await model.allNanoflows()).filter((nf) => nf.qualifiedName === qualifiedName);
            } else if (itemType === 'page') {
                itemsToDelete = (await model.allPages()).filter((pg) => pg.qualifiedName === qualifiedName);
            } else if (itemType === 'snippet') {
                itemsToDelete = (await model.allSnippets()).filter((pg) => pg.qualifiedName === qualifiedName);
            } else if (itemType === 'constant') {
                itemsToDelete = (await model.allConstants()).filter((ac) => ac.qualifiedName === qualifiedName);
            } else if (itemType === 'enumeration') {
                itemsToDelete = (await model.allEnumerations()).filter((ae) => ae.qualifiedName === qualifiedName);
            } else if (itemType === 'exportmapping') {
                itemsToDelete = (await model.allExportMappings()).filter((em) => em.qualifiedName === qualifiedName);
            } else if (itemType === 'importmapping') {
                itemsToDelete = (await model.allImportMappings()).filter((im) => im.qualifiedName === qualifiedName);
            }else if (itemType === 'imagecollection') {
                itemsToDelete = (await model.allImageCollections()).filter((ic) => ic.qualifiedName === qualifiedName);
            } else if (itemType === 'javaaction') {
                itemsToDelete = (await model.allJavaActions()).filter((ja) => ja.qualifiedName === qualifiedName);
            } else if (itemType === 'javascriptaction') {
                itemsToDelete = (await model.allJavaScriptActions()).filter((js) => js.qualifiedName === qualifiedName);
            } else if (itemType === 'jsonstructure') {
                itemsToDelete = (await model.allJsonStructures()).filter((jsn) => jsn.qualifiedName === qualifiedName);
            } else if (itemType === 'layout') {
                itemsToDelete = (await model.allLayouts()).filter((lo) => lo.qualifiedName === qualifiedName);
            } else if (itemType === 'menu') {
                itemsToDelete = (await model.allMenuDocuments()).filter((mu) => mu.qualifiedName === qualifiedName);
            } else if (itemType === 'regularexpression') {
                itemsToDelete = (await model.allRegularExpressions()).filter((rx) => rx.qualifiedName === qualifiedName);
            } else if (itemType === 'rule') {
                itemsToDelete = (await model.allRules()).filter((ru) => ru.qualifiedName === qualifiedName);
            } else {
                sendLogToStream(res, operationId, 'warning', `Unsupported item type: ${itemType}`);
                continue;
            }

            for (const item of itemsToDelete) {
                await item.load();
                await item.delete();
                totalDeleted++; // Increment the counter for each successful deletion
                sendLogToStream(res, operationId, 'general', `Deleted: ${qualifiedName}`);
            }
        }

        await model.flushChanges();
        sendLogToStream(res, operationId, 'general', `Committing working copy with message "Bulk deletion completed."`);
        await workingCopy.commitToRepository(branchName, { commitMessage: 'Bulk deletion completed.' });
        sendLogToStream(res, operationId, 'success', `Deletion process completed successfully. Total items deleted: ${totalDeleted}`);
    } catch (err) {
        sendLogToStream(res, operationId, 'error', `Error during bulk deletion: ${err.message}`);
    }
});

const ncp = require('ncp').ncp;

const assetSrc = path.join(__dirname, 'public');
const assetDest = path.join(basePath, 'public');

if (!fs.existsSync(assetDest)) {
  fs.mkdirSync(assetDest, { recursive: true });
  ncp(assetSrc, assetDest, (err) => {
    if (err) {
      console.error('Error extracting assets:', err);
    } else {
      console.log('Assets extracted successfully!');
    }
  });
}


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
