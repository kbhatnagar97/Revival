"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateUtils = void 0;
const date_fns_tz_1 = require("date-fns-tz");
exports.dateUtils = {
    getTodayMidnight: (timezone) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return (0, date_fns_tz_1.zonedTimeToUtc)(today, timezone);
    },
    isDateScheduled: (date, scheduledDays) => {
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        return scheduledDays.includes(dayOfWeek);
    }
};
//# sourceMappingURL=dateUtils.js.map