import App from '@dfgpublicidade/node-app-module';
import appDebugger from 'debug';
import expeditousRedis from 'expeditious-engine-redis';
import { Request, Response } from 'express';
import expeditious, { ExpeditiousOptions, ExpressExpeditiousInstance } from 'express-expeditious';
import CacheLevel from './enums/cacheLevel';

/* Module */
const debug: appDebugger.IDebugger = appDebugger('module:cache');

class Cache {
    private static caches: { name: string; level: CacheLevel; instance: ExpressExpeditiousInstance }[] = [];

    public static create(app: App, level: CacheLevel, userCache: boolean): ExpressExpeditiousInstance {
        debug(`Creating cache ${app.info.name} ${level}`);

        const cacheoptions: ExpeditiousOptions = {
            namespace: app.info.name + level,
            defaultTtl: app.config.cache.ttl[level],
            sessionAware: false,
            genCacheKey: (req: Request, res: Response): string => {
                const system: string = req.system ? req.system[app.config.cache.system.idField] : 'unknown';
                const method: string = req.method;
                const resource: string = req.originalUrl;

                if (userCache) {
                    const userId: string = req.user ? req.user.id : undefined;
                    return `${system}-${method}-user:${userId}-${resource}`;
                }

                return `${system}-${method}-${resource}`;
            },
            engine: expeditousRedis(app.config)
        };

        const instance: ExpressExpeditiousInstance = expeditious(cacheoptions);

        debug(`Storing cache ${app.info.name}-${level}`);

        Cache.caches.push({
            name: userCache ? `${app.info.name}-${level}-p` : `${app.info.name}-${level}`,
            level,
            instance
        });

        return instance;
    }

    public static async flush(level: CacheLevel): Promise<void[]> {
        debug(`Invalidating level ${level} cache`);

        const promises: Promise<void>[] = [];

        for (const cache of Cache.caches) {
            if (cache.level === level) {
                promises.push(new Promise<void>((
                    resolve: () => void
                ): void => {
                    cache.instance.flush(undefined, (): void => {
                        resolve();
                    });
                }));
            }
        }

        return Promise.all(promises);
    }
}

export default Cache;
export { CacheLevel };
