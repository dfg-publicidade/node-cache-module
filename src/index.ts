import appDebugger from 'debug';
import expeditousRedis from 'expeditious-engine-redis';
import { Request, Response } from 'express';
import expeditious, { ExpeditiousOptions, ExpressExpeditiousInstance } from 'express-expeditious';
import CacheLevel from './enums/cacheLevel';
import App from '@dfgpublicidade/node-app-module';

/* Module */
const debug: appDebugger.IDebugger = appDebugger('api:cache');

class Cache {
    private static caches: { name: string; level: CacheLevel; instance: ExpressExpeditiousInstance }[] = [];

    public static create(app: App, level: CacheLevel, userCache: boolean): ExpressExpeditiousInstance {
        debug(`Criando cache ${app.info.name}-${level}`);

        const cacheoptions: ExpeditiousOptions = {
            namespace: `${app.info.name}${level}`,
            defaultTtl: app.config.cache.ttl[level],
            sessionAware: true,
            genCacheKey: (req: Request, res: Response): string => {
                const system: string = req.sistema ? req.sistema.identificacao : undefined;
                const userId: string = req.usuario ? req.usuario.id : 'unknown';
                const method: string = req.method;
                const resource: string = req.originalUrl;

                if (userCache) {
                    return `${app.info.name}-${level}-${system}-${method}-user:${userId}-${resource}`;
                }

                return `${app.info.name}-${level}-${system}-${method}-${resource}`;
            },
            engine: expeditousRedis(app.config)
        };

        const instance: ExpressExpeditiousInstance = expeditious(cacheoptions);

        debug(`Armazenando cache ${app.info.name}-${level}`);

        Cache.caches.push({
            name: userCache ? `${app.info.name}-${level}-p` : `${app.info.name}-${level}`,
            level,
            instance
        });

        return instance;
    }

    public static async flush(level: CacheLevel, callback?: () => void): Promise<void> {
        debug(`Invalidando caches de nível ${level}`);

        for (const cache of Cache.caches) {
            if (cache.level === level) {
                cache.instance.flush(cache.name, callback ? callback : (): void => {
                    //
                });
            }
        }

        return Promise.resolve();
    }
}

export default Cache;
export { CacheLevel, ExpressExpeditiousInstance };
