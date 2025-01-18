# Mendix Delete Utility
Use Studio Pro to find unused items and export to a CSV. Upload the CSV to this tool. You can preview and manage the items you wish to delete before confirming and deleting in bulk.

1. Setup a Mendix PAT in your OS Environment Variables to authenticate to your Mendix Platform
2. Get your Mendix APP ID from the Mendix Portal
3. Launch the server and navigate to localhost:3000
4. Use the Data page to add your app(s) and any modules you want to exclude from deletes (marketplace modules, sensitive modules, etc)
5. I strongly recommend going through studio pro and "marking as used" all items that studio pro may not pickup (information pages/snippets, reference microflows, microflows configured at runtime (export/import, database replication, document generation, etc))
6. Use Find Advanced > Unused Items and then export the full list (you can filter down the object if you'd like at this point, but the app will support a full export without modification)
7. Select your app from the home page, type your branch line name, and upload the CSV file
8. Optionally: use the eraser on the item preview to remove specific items from the delete process
9. Click delete
10. Watch the log

## Description
A Node.js tool for working with Mendix SDK to delete items in bulk.

## Requirements
- Node.js 20 or later
- `pkg` installed globally (`npm install -g pkg`)

## Build
Run the following command to create executables for Windows, Linux, and macOS:
```bash
npm run build
