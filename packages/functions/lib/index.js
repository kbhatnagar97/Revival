"use strict";
// Core Cloud Functions as specified in CLOUD_FUNCTIONS_IMPLEMENTATION_PLAN.md
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldHabitEntries = exports.migrateToDailyEntries = exports.recalculateSummary = exports.onHabitEntryWrite = exports.onHabitDelete = exports.onHabitUpdate = exports.deleteHabitEntry = exports.updateHabitEntry = exports.getHabitEntriesForHabit = exports.getHabitEntries = exports.deleteHabit = exports.updateHabit = exports.createHabit = exports.getUserHabits = exports.onUserCreate = void 0;
// User Functions
var onUserCreate_1 = require("./users/onUserCreate");
Object.defineProperty(exports, "onUserCreate", { enumerable: true, get: function () { return onUserCreate_1.onUserCreate; } });
// Habit CRUD Functions (Callable)
var getUserHabits_1 = require("./habits/getUserHabits");
Object.defineProperty(exports, "getUserHabits", { enumerable: true, get: function () { return getUserHabits_1.getUserHabits; } });
var createHabit_1 = require("./habits/createHabit");
Object.defineProperty(exports, "createHabit", { enumerable: true, get: function () { return createHabit_1.createHabit; } });
var updateHabit_1 = require("./habits/updateHabit");
Object.defineProperty(exports, "updateHabit", { enumerable: true, get: function () { return updateHabit_1.updateHabit; } });
var deleteHabit_1 = require("./habits/deleteHabit");
Object.defineProperty(exports, "deleteHabit", { enumerable: true, get: function () { return deleteHabit_1.deleteHabit; } });
// Habit Entry CRUD Functions (Callable)
var getHabitEntries_1 = require("./habits/getHabitEntries");
Object.defineProperty(exports, "getHabitEntries", { enumerable: true, get: function () { return getHabitEntries_1.getHabitEntries; } });
var getHabitEntriesForHabit_1 = require("./habits/getHabitEntriesForHabit");
Object.defineProperty(exports, "getHabitEntriesForHabit", { enumerable: true, get: function () { return getHabitEntriesForHabit_1.getHabitEntriesForHabit; } });
var updateHabitEntry_1 = require("./habits/updateHabitEntry");
Object.defineProperty(exports, "updateHabitEntry", { enumerable: true, get: function () { return updateHabitEntry_1.updateHabitEntry; } });
var deleteHabitEntry_1 = require("./habits/deleteHabitEntry");
Object.defineProperty(exports, "deleteHabitEntry", { enumerable: true, get: function () { return deleteHabitEntry_1.deleteHabitEntry; } });
// Habit Trigger Functions (Firestore Triggers)
var onHabitUpdate_1 = require("./habits/onHabitUpdate");
Object.defineProperty(exports, "onHabitUpdate", { enumerable: true, get: function () { return onHabitUpdate_1.onHabitUpdate; } });
var onHabitDelete_1 = require("./habits/onHabitDelete");
Object.defineProperty(exports, "onHabitDelete", { enumerable: true, get: function () { return onHabitDelete_1.onHabitDelete; } });
var onHabitEntryWrite_1 = require("./habits/onHabitEntryWrite");
Object.defineProperty(exports, "onHabitEntryWrite", { enumerable: true, get: function () { return onHabitEntryWrite_1.onHabitEntryWrite; } });
var recalculateSummary_1 = require("./habits/recalculateSummary");
Object.defineProperty(exports, "recalculateSummary", { enumerable: true, get: function () { return recalculateSummary_1.recalculateSummary; } });
// Migration Functions (Schema Migration)
var migrateToDaily_Entries_1 = require("./migration/migrateToDaily Entries");
Object.defineProperty(exports, "migrateToDailyEntries", { enumerable: true, get: function () { return migrateToDaily_Entries_1.migrateToDailyEntries; } });
Object.defineProperty(exports, "cleanupOldHabitEntries", { enumerable: true, get: function () { return migrateToDaily_Entries_1.cleanupOldHabitEntries; } });
//# sourceMappingURL=index.js.map