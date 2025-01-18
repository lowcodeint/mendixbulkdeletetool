import { MendixPlatformClient } from "mendixplatformsdk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// Custom log function with levels
const sendLog = (level: "INFO" | "SUCCESS" | "ERROR", message: string) => {
    const timestamp = new Date().toISOString();
    process.stdout.write(`${JSON.stringify({ timestamp, level, message })}\n`);
};

async function main() {
    const args = yargs(hideBin(process.argv))
        .option("appId", {
            type: "string",
            demandOption: true,
            describe: "The App ID of the Mendix project",
        })
        .option("moduleName", {
            type: "string",
            demandOption: true,
            describe: "The module name containing the items to delete",
        })
        .option("branchName", {
            type: "string",
            demandOption: true,
            describe: "The branch name of the Mendix project",
        })
        .option("itemType", {
            type: "string",
            choices: ["microflows", "nanoflows", "pages"],
            demandOption: true,
            describe: "The type of item to delete (microflows, nanoflows, pages)",
        })
        .option("itemName", {
            type: "string",
            demandOption: true,
            describe: "The exact name of the item to delete",
        })
        .help()
        .parseSync();

    const { appId, moduleName, branchName, itemType, itemName } = args;

    sendLog("INFO", "Starting script with parameters:");
    sendLog("INFO", `App ID: ${appId}`);
    sendLog("INFO", `Module Name: ${moduleName}`);
    sendLog("INFO", `Branch Name: ${branchName}`);
    sendLog("INFO", `Item Type: ${itemType}`);
    sendLog("INFO", `Item Name: ${itemName}`);

    const client = new MendixPlatformClient();
    const app = client.getApp(appId);

    try {
        sendLog("INFO", "Fetching the working copy...");
        const workingCopy = await app.createTemporaryWorkingCopy(branchName);
        sendLog("SUCCESS", "Working copy created successfully.");

        const model = await workingCopy.openModel();
        sendLog("SUCCESS", "Model opened successfully.");

        let itemsToDelete: any[] = [];
        if (itemType === "microflows") {
            itemsToDelete = (await model.allMicroflows()).filter((microflow) =>
                microflow.qualifiedName === `${moduleName}.${itemName}`
            );
        } else if (itemType === "nanoflows") {
            itemsToDelete = (await model.allNanoflows()).filter((nanoflow) =>
                nanoflow.qualifiedName === `${moduleName}.${itemName}`
            );
        } else if (itemType === "pages") {
            itemsToDelete = (await model.allPages()).filter((page) =>
                page.qualifiedName === `${moduleName}.${itemName}`
            );
        }

        if (itemsToDelete.length === 0) {
            sendLog("INFO", `No ${itemType} found with name "${moduleName}.${itemName}".`);
        } else {
            for (const item of itemsToDelete) {
                const itemQualifiedName = item.qualifiedName;
                sendLog("INFO", `Attempting to delete ${itemType}: ${itemQualifiedName}`);
                try {
                    const loadedItem = await item.load();
                    await loadedItem.delete();
                    sendLog("SUCCESS", `Successfully deleted ${itemType}: ${itemQualifiedName}`);
                } catch (error: any) {
                    sendLog("ERROR", `Failed to delete ${itemType}: ${itemQualifiedName}. Error: ${error.message}`);
                }
            }

            await model.flushChanges();
            sendLog("SUCCESS", "Changes flushed successfully.");

            await workingCopy.commitToRepository(branchName, {
                commitMessage: `Deleted ${itemType} named "${itemName}" from module "${moduleName}".`,
            });
            sendLog("SUCCESS", "Changes committed successfully.");
        }
    } catch (error: any) {
        sendLog("ERROR", `An error occurred: ${error.message}`);
    }
}

main().catch((error: any) => {
    sendLog("ERROR", `Unhandled error: ${error.message}`);
});
