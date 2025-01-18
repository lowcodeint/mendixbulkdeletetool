"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mendixplatformsdk_1 = require("mendixplatformsdk");
var yargs_1 = require("yargs");
var helpers_1 = require("yargs/helpers");
// Custom log function with levels
var sendLog = function (level, message) {
    var timestamp = new Date().toISOString();
    process.stdout.write("".concat(JSON.stringify({ timestamp: timestamp, level: level, message: message }), "\n"));
};
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, appId, moduleName, branchName, itemType, itemName, client, app, workingCopy, model, itemsToDelete, _i, itemsToDelete_1, item, itemQualifiedName, loadedItem, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    args = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
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
                    appId = args.appId, moduleName = args.moduleName, branchName = args.branchName, itemType = args.itemType, itemName = args.itemName;
                    sendLog("INFO", "Starting script with parameters:");
                    sendLog("INFO", "App ID: ".concat(appId));
                    sendLog("INFO", "Module Name: ".concat(moduleName));
                    sendLog("INFO", "Branch Name: ".concat(branchName));
                    sendLog("INFO", "Item Type: ".concat(itemType));
                    sendLog("INFO", "Item Name: ".concat(itemName));
                    client = new mendixplatformsdk_1.MendixPlatformClient();
                    app = client.getApp(appId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 21, , 22]);
                    sendLog("INFO", "Fetching the working copy...");
                    return [4 /*yield*/, app.createTemporaryWorkingCopy(branchName)];
                case 2:
                    workingCopy = _a.sent();
                    sendLog("SUCCESS", "Working copy created successfully.");
                    return [4 /*yield*/, workingCopy.openModel()];
                case 3:
                    model = _a.sent();
                    sendLog("SUCCESS", "Model opened successfully.");
                    itemsToDelete = [];
                    if (!(itemType === "microflows")) return [3 /*break*/, 5];
                    return [4 /*yield*/, model.allMicroflows()];
                case 4:
                    itemsToDelete = (_a.sent()).filter(function (microflow) {
                        return microflow.qualifiedName === "".concat(moduleName, ".").concat(itemName);
                    });
                    return [3 /*break*/, 9];
                case 5:
                    if (!(itemType === "nanoflows")) return [3 /*break*/, 7];
                    return [4 /*yield*/, model.allNanoflows()];
                case 6:
                    itemsToDelete = (_a.sent()).filter(function (nanoflow) {
                        return nanoflow.qualifiedName === "".concat(moduleName, ".").concat(itemName);
                    });
                    return [3 /*break*/, 9];
                case 7:
                    if (!(itemType === "pages")) return [3 /*break*/, 9];
                    return [4 /*yield*/, model.allPages()];
                case 8:
                    itemsToDelete = (_a.sent()).filter(function (page) {
                        return page.qualifiedName === "".concat(moduleName, ".").concat(itemName);
                    });
                    _a.label = 9;
                case 9:
                    if (!(itemsToDelete.length === 0)) return [3 /*break*/, 10];
                    sendLog("INFO", "No ".concat(itemType, " found with name \"").concat(moduleName, ".").concat(itemName, "\"."));
                    return [3 /*break*/, 20];
                case 10:
                    _i = 0, itemsToDelete_1 = itemsToDelete;
                    _a.label = 11;
                case 11:
                    if (!(_i < itemsToDelete_1.length)) return [3 /*break*/, 17];
                    item = itemsToDelete_1[_i];
                    itemQualifiedName = item.qualifiedName;
                    sendLog("INFO", "Attempting to delete ".concat(itemType, ": ").concat(itemQualifiedName));
                    _a.label = 12;
                case 12:
                    _a.trys.push([12, 15, , 16]);
                    return [4 /*yield*/, item.load()];
                case 13:
                    loadedItem = _a.sent();
                    return [4 /*yield*/, loadedItem.delete()];
                case 14:
                    _a.sent();
                    sendLog("SUCCESS", "Successfully deleted ".concat(itemType, ": ").concat(itemQualifiedName));
                    return [3 /*break*/, 16];
                case 15:
                    error_1 = _a.sent();
                    sendLog("ERROR", "Failed to delete ".concat(itemType, ": ").concat(itemQualifiedName, ". Error: ").concat(error_1.message));
                    return [3 /*break*/, 16];
                case 16:
                    _i++;
                    return [3 /*break*/, 11];
                case 17: return [4 /*yield*/, model.flushChanges()];
                case 18:
                    _a.sent();
                    sendLog("SUCCESS", "Changes flushed successfully.");
                    return [4 /*yield*/, workingCopy.commitToRepository(branchName, {
                            commitMessage: "Deleted ".concat(itemType, " named \"").concat(itemName, "\" from module \"").concat(moduleName, "\"."),
                        })];
                case 19:
                    _a.sent();
                    sendLog("SUCCESS", "Changes committed successfully.");
                    _a.label = 20;
                case 20: return [3 /*break*/, 22];
                case 21:
                    error_2 = _a.sent();
                    sendLog("ERROR", "An error occurred: ".concat(error_2.message));
                    return [3 /*break*/, 22];
                case 22: return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    sendLog("ERROR", "Unhandled error: ".concat(error.message));
});
