"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifications = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var users_1 = require("./users");
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    type: (0, pg_core_1.varchar)('type', { length: 64 }).notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    body: (0, pg_core_1.text)('body').notNull(),
    data: (0, pg_core_1.jsonb)('data').$type(),
    isRead: (0, pg_core_1.boolean)('is_read').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('notifications_user_created_idx').on(t.userId, t.createdAt),
    (0, pg_core_1.index)('notifications_user_read_idx').on(t.userId, t.isRead),
]; });
