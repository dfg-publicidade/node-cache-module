import { ExpressExpeditiousInstance } from 'express-expeditious';
import CacheLevel from './enums/cacheLevel';
import App from '@dfgpublicidade/node-app-module';
declare class Cache {
    private static caches;
    static create(app: App, level: CacheLevel, userCache: boolean): ExpressExpeditiousInstance;
    static flush(level: CacheLevel, callback?: () => void): Promise<void>;
}
export default Cache;
export { CacheLevel };
