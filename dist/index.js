"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheLevel = void 0;
const debug_1 = __importDefault(require("debug"));
const expeditious_engine_redis_1 = __importDefault(require("expeditious-engine-redis"));
const express_expeditious_1 = __importDefault(require("express-expeditious"));
const cacheLevel_1 = __importDefault(require("./enums/cacheLevel"));
exports.CacheLevel = cacheLevel_1.default;
/* Module */
const debug = debug_1.default('api:cache');
class Cache {
    static create(app, level, userCache) {
        debug(`Creating cache ${app.info.name}-${level}`);
        const cacheoptions = {
            namespace: `${app.info.name}${level}`,
            defaultTtl: app.config.cache.ttl[level],
            sessionAware: true,
            genCacheKey: (req, res) => {
                const system = req.system ? req.system.id : 'unknown';
                const method = req.method;
                const resource = req.originalUrl;
                if (userCache) {
                    const userId = req.user ? req.user.identificacao : undefined;
                    return `${system}-${method}-user:${userId}-${resource}`;
                }
                return `${system}-${method}-${resource}`;
            },
            engine: expeditious_engine_redis_1.default(app.config)
        };
        const instance = express_expeditious_1.default(cacheoptions);
        debug(`Storing cache ${app.info.name}-${level}`);
        Cache.caches.push({
            name: userCache ? `${app.info.name}-${level}-p` : `${app.info.name}-${level}`,
            level,
            instance
        });
        return instance;
    }
    static async flush(level, callback) {
        debug(`Invalidating level ${level} cache`);
        for (const cache of Cache.caches) {
            if (cache.level === level) {
                cache.instance.flush(cache.name, callback ? callback : () => {
                    //
                });
            }
        }
        return Promise.resolve();
    }
}
Cache.caches = [];
exports.default = Cache;
