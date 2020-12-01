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
        debug(`Criando cache ${app.info.name}-${level}`);
        const cacheoptions = {
            namespace: `${app.info.name}${level}`,
            defaultTtl: app.config.cache.ttl[level],
            sessionAware: true,
            genCacheKey: (req, res) => {
                const system = req.sistema ? req.sistema.identificacao : undefined;
                const userId = req.usuario ? req.usuario.id : 'unknown';
                const method = req.method;
                const resource = req.originalUrl;
                if (userCache) {
                    return `${app.info.name}-${level}-${system}-${method}-user:${userId}-${resource}`;
                }
                return `${app.info.name}-${level}-${system}-${method}-${resource}`;
            },
            engine: expeditious_engine_redis_1.default(app.config)
        };
        const instance = express_expeditious_1.default(cacheoptions);
        debug(`Armazenando cache ${app.info.name}-${level}`);
        Cache.caches.push({
            name: userCache ? `${app.info.name}-${level}-p` : `${app.info.name}-${level}`,
            level,
            instance
        });
        return instance;
    }
    static flush(level, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            debug(`Invalidando caches de nível ${level}`);
            for (const cache of Cache.caches) {
                if (cache.level === level) {
                    cache.instance.flush(cache.name, callback ? callback : () => {
                        //
                    });
                }
            }
            return Promise.resolve();
        });
    }
}
Cache.caches = [];
exports.default = Cache;
