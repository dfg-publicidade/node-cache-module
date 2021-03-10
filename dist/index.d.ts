import App from '@dfgpublicidade/node-app-module';
import { ExpressExpeditiousInstance } from 'express-expeditious';
import CacheLevel from './enums/cacheLevel';
declare class Cache {
    private static caches;
    static create(app: App, level: CacheLevel, userCache: boolean): ExpressExpeditiousInstance;
    static flush(level: CacheLevel): Promise<void[]>;
}
export default Cache;
export { CacheLevel };
