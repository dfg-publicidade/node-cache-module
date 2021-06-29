import App from '@dfgpublicidade/node-app-module';
import { ExpressExpeditiousInstance } from 'express-expeditious';
import CacheLevel from './enums/cacheLevel';
declare class Cache {
    private static caches;
    static create(app: App, level: CacheLevel, engine?: any, userCache?: boolean): ExpressExpeditiousInstance;
    static flush(level: CacheLevel): Promise<void[]>;
    private static creteCacheKeyGenerator;
}
export default Cache;
export { CacheLevel };
