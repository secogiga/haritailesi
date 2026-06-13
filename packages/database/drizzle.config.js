"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var drizzle_kit_1 = require("drizzle-kit");
exports.default = (0, drizzle_kit_1.defineConfig)({
    schema: './src/schema/index.ts',
    out: './migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: (_a = process.env['DATABASE_URL']) !== null && _a !== void 0 ? _a : 'postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi',
    },
    verbose: true,
    strict: true,
});
