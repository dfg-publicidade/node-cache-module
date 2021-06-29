"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheLevel = void 0;
const debug_1 = __importDefault(require("debug"));
const express_expeditious_1 = __importDefault(require("express-expeditious"));
const cacheLevel_1 = __importDefault(require("./enums/cacheLevel"));
exports.CacheLevel = cacheLevel_1.default;
/* Module */
const debug = debug_1.default('module:cache');
class Cache {
    static create(app, level, engine, userCache) {
        var _a;
        if (!app) {
            throw new Error('Application was not provided.');
        }
        if (!app.config.cache || !app.config.cache.ttl || !((_a = app.config.cache.system) === null || _a === void 0 ? void 0 : _a.idField)) {
            throw new Error('Cache config. was not provided.');
        }
        for (const cacheLevel of Object.keys(cacheLevel_1.default)) {
            if (!app.config.cache.ttl[cacheLevel]) {
                throw new Error('Cache config. was not provided.');
            }
        }
        if (!level) {
            throw new Error('Cache level was not provided.');
        }
        debug(`Creating cache ${app.info.name} ${level}`);
        const cacheoptions = {
            namespace: app.info.name + level,
            defaultTtl: app.config.cache.ttl[level],
            sessionAware: false,
            genCacheKey: this.creteCacheKeyGenerator(app, userCache)
        };
        if (engine) {
            cacheoptions.engine = engine;
        }
        const instance = express_expeditious_1.default(cacheoptions);
        debug(`Storing cache ${app.info.name}-${level}`);
        Cache.caches.push({
            name: userCache ? `${app.info.name}-${level}-p` : `${app.info.name}-${level}`,
            level,
            instance
        });
        return instance;
    }
    static async flush(level) {
        if (!level) {
            throw new Error('Cache level was not provided.');
        }
        debug(`Invalidating level ${level} cache`);
        const promises = [];
        for (const cache of Cache.caches) {
            if (cache.level === level) {
                promises.push(new Promise((resolve) => {
                    cache.instance.flush(undefined, () => {
                        resolve();
                    });
                }));
            }
        }
        return Promise.all(promises);
    }
    static creteCacheKeyGenerator(app, userCache) {
        return (req, res) => {
            if (req.system && !req.system[app.config.cache.system.idField]) {
                throw new Error(`System has not identification value: ${app.config.cache.system.idField}.`);
            }
            const system = req.system ? req.system[app.config.cache.system.idField] : 'unknown';
            const method = req.method;
            const resource = req.originalUrl;
            if (userCache) {
                const userId = req.user ? req.user.id : undefined;
                return `${system}-${method}-user:${userId}-${resource}`;
            }
            return `${system}-${method}-${resource}`;
        };
    }
}
Cache.caches = [];
exports.default = Cache;
