"use strict";
// Core Cloud Functions as specified in CLOUD_FUNCTIONS_IMPLEMENTATION_PLAN.md
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeConsent = exports.updateConsentPreferences = exports.getConsentHistory = exports.storeConsentRecord = exports.detectUserLocation = exports.createSessionEnhanced = exports.cleanupOldSessions = exports.getUserSessions = exports.updateSessionHeartbeat = exports.createSession = exports.cleanupInactiveDevices = exports.getUserDevices = exports.registerDevice = exports.cleanupOldHabitEntries = exports.migrateToDailyEntries = exports.recalculateSummary = exports.onHabitEntryWrite = exports.onHabitDelete = exports.onHabitUpdate = exports.deleteHabitEntry = exports.updateHabitEntry = exports.getHabitEntriesForHabit = exports.getHabitEntries = exports.reorderHabits = exports.deleteHabit = exports.updateHabit = exports.createHabit = exports.getUserHabits = exports.onUserCreate = void 0;
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
var reorderHabits_1 = require("./habits/reorderHabits");
Object.defineProperty(exports, "reorderHabits", { enumerable: true, get: function () { return reorderHabits_1.reorderHabits; } });
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
// Device Management Functions (Phase 3)
var registerDevice_1 = require("./devices/registerDevice");
Object.defineProperty(exports, "registerDevice", { enumerable: true, get: function () { return registerDevice_1.registerDevice; } });
var getUserDevices_1 = require("./devices/getUserDevices");
Object.defineProperty(exports, "getUserDevices", { enumerable: true, get: function () { return getUserDevices_1.getUserDevices; } });
var cleanupInactiveDevices_1 = require("./devices/cleanupInactiveDevices");
Object.defineProperty(exports, "cleanupInactiveDevices", { enumerable: true, get: function () { return cleanupInactiveDevices_1.cleanupInactiveDevices; } });
// Session Management Functions (Phase 3)
var createSession_1 = require("./sessions/createSession");
Object.defineProperty(exports, "createSession", { enumerable: true, get: function () { return createSession_1.createSession; } });
var updateSessionHeartbeat_1 = require("./sessions/updateSessionHeartbeat");
Object.defineProperty(exports, "updateSessionHeartbeat", { enumerable: true, get: function () { return updateSessionHeartbeat_1.updateSessionHeartbeat; } });
var getUserSessions_1 = require("./sessions/getUserSessions");
Object.defineProperty(exports, "getUserSessions", { enumerable: true, get: function () { return getUserSessions_1.getUserSessions; } });
var cleanupOldSessions_1 = require("./sessions/cleanupOldSessions");
Object.defineProperty(exports, "cleanupOldSessions", { enumerable: true, get: function () { return cleanupOldSessions_1.cleanupOldSessions; } });
// Enhanced Session Functions
var createSessionEnhanced_1 = require("./sessions/createSessionEnhanced");
Object.defineProperty(exports, "createSessionEnhanced", { enumerable: true, get: function () { return createSessionEnhanced_1.createSessionEnhanced; } });
Object.defineProperty(exports, "detectUserLocation", { enumerable: true, get: function () { return createSessionEnhanced_1.detectUserLocation; } });
// Privacy and Consent Functions
var consentManager_1 = require("./privacy/consentManager");
Object.defineProperty(exports, "storeConsentRecord", { enumerable: true, get: function () { return consentManager_1.storeConsentRecord; } });
Object.defineProperty(exports, "getConsentHistory", { enumerable: true, get: function () { return consentManager_1.getConsentHistory; } });
Object.defineProperty(exports, "updateConsentPreferences", { enumerable: true, get: function () { return consentManager_1.updateConsentPreferences; } });
Object.defineProperty(exports, "revokeConsent", { enumerable: true, get: function () { return consentManager_1.revokeConsent; } });
//# sourceMappingURL=index.js.map