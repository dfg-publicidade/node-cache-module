import App from '@dfgpublicidade/node-app-module';
import chai, { expect } from 'chai';
import expeditiousEngineMemory from 'expeditious-engine-memory';
import express, { Express, NextFunction, Request, Response } from 'express';
import { ExpressExpeditiousInstance } from 'express-expeditious';
import http from 'http';
import { after, before, describe, it } from 'mocha';
import Cache, { CacheLevel } from '../src';
import ChaiHttp = require('chai-http');

/* Tests */
chai.use(ChaiHttp);

describe('index.ts', (): void => {
    let exp: Express;
    let app: App;
    let httpServer: http.Server;
    let count: number = 0;

    before(async (): Promise<void> => {
        exp = express();
        const port: number = 3000;

        exp.set('port', port);

        httpServer = http.createServer(exp);

        app = new App({
            appInfo: {
                name: 'test',
                version: 'v1'
            },
            config: {
                cache: {
                    system: {
                        idField: 'identificacao'
                    },
                    ttl: {
                        // eslint-disable-next-line no-magic-numbers
                        L1: '20 seconds',
                        // eslint-disable-next-line no-magic-numbers
                        L2: '5 minutes'
                    }
                }
            }
        });

        const cacheL1: ExpressExpeditiousInstance = Cache.create(app, CacheLevel.L1);
        Cache.create(app, CacheLevel.L2, expeditiousEngineMemory());
        const cacheL1User: ExpressExpeditiousInstance = Cache.create(app, CacheLevel.L1, undefined, true);

        exp.use((req: Request, res: Response, next: NextFunction): void => {
            if (!req.headers.anonimous) {
                req.system = {
                    identificacao: 'sistema-teste'
                };
                req.user = {
                    id: req.headers.id
                };
            }

            if (req.headers.misconfigsystem) {
                req.system = {};
                req.user = {
                    id: req.headers.id
                };
            }

            next();
        });

        exp.get('/', cacheL1, async (req: Request, res: Response): Promise<void> => {
            res.send(`${count}`);
        });

        exp.get('/user', cacheL1User, async (req: Request, res: Response): Promise<void> => {
            res.send(`${count}`);
        });

        exp.use((error: any, req: Request, res: Response, next: NextFunction): void => {
            // eslint-disable-next-line no-magic-numbers
            res.status(500);
            res.send(error.message);
        });

        return new Promise<void>((
            resolve: () => void
        ): void => {
            httpServer.listen(port, (): void => {
                resolve();
            });
        });
    });

    after(async (): Promise<void> => {
        await Cache.flush(CacheLevel.L2);
        await Cache.flush(CacheLevel.L1);

        return new Promise<void>((
            resolve: () => void
        ): void => {
            httpServer.close((): void => {
                resolve();
            });
        });
    });

    it('1. create', async (): Promise<void> => {
        expect((): void => {
            Cache.create(undefined, undefined, undefined, undefined);
        }).to.throw('Application was not provided.');
    });

    it('2. create', async (): Promise<void> => {
        const app: App = new App({
            appInfo: {
                name: 'test',
                version: 'v1'
            },
            config: {
                cache: undefined
            }
        });

        expect((): void => {
            Cache.create(app, undefined, undefined, undefined);
        }).to.throw('Cache config. was not provided.');
    });

    it('3. create', async (): Promise<void> => {
        const app: App = new App({
            appInfo: {
                name: 'test',
                version: 'v1'
            },
            config: {
                cache: {
                    ttl: undefined
                }
            }
        });

        expect((): void => {
            Cache.create(app, undefined, undefined, undefined);
        }).to.throw('Cache config. was not provided.');
    });

    it('4. create', async (): Promise<void> => {
        const app: App = new App({
            appInfo: {
                name: 'test',
                version: 'v1'
            },
            config: {
                cache: {
                    ttl: {
                        // eslint-disable-next-line no-magic-numbers
                        L1: '20 seconds',
                        // eslint-disable-next-line no-magic-numbers
                        L2: '5 minutes'
                    }
                }
            }
        });

        expect((): void => {
            Cache.create(app, undefined, undefined, undefined);
        }).to.throw('Cache config. was not provided.');
    });

    it('5. create', async (): Promise<void> => {
        const app: App = new App({
            appInfo: {
                name: 'test',
                version: 'v1'
            },
            config: {
                cache: {
                    ttl: {
                        // eslint-disable-next-line no-magic-numbers
                        L1: '20 seconds',
                        // eslint-disable-next-line no-magic-numbers
                        L2: '5 minutes'
                    },
                    system: undefined
                }
            }
        });

        expect((): void => {
            Cache.create(app, undefined, undefined, undefined);
        }).to.throw('Cache config. was not provided.');
    });

    it('6. create', async (): Promise<void> => {
        const app: App = new App({
            appInfo: {
                name: 'test',
                version: 'v1'
            },
            config: {
                cache: {
                    ttl: {
                        // eslint-disable-next-line no-magic-numbers
                        L1: '20 seconds'
                    },
                    system: {
                        idField: 'identificacao'
                    }
                }
            }
        });

        expect((): void => {
            Cache.create(app, undefined, undefined, undefined);
        }).to.throw('Cache config. was not provided.');
    });

    it('6. create', async (): Promise<void> => {
        const app: App = new App({
            appInfo: {
                name: 'test',
                version: 'v1'
            },
            config: {
                cache: {
                    ttl: {
                        // eslint-disable-next-line no-magic-numbers
                        L1: '20 seconds',
                        // eslint-disable-next-line no-magic-numbers
                        L2: '5 minutes'
                    },
                    system: {
                        idField: 'identificacao'
                    }
                }
            }
        });

        expect((): void => {
            Cache.create(app, undefined, undefined, undefined);
        }).to.throw('Cache level was not provided.');
    });

    it('7. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res.text).to.be.eq('0');
        expect(count).to.be.eq(0);

        count++;
    });

    it('8. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res.text).to.be.eq('0');
        expect(count).to.be.eq(1);

        await Cache.flush(CacheLevel.L1);

        count++;
    });

    it('9. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res.text).to.be.eq('2');
        expect(count).to.be.eq(2);

        await Cache.flush(CacheLevel.L1);

        count++;
    });

    it('10. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/user').set('ID', '1');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res.text).to.be.eq('3');
        // eslint-disable-next-line no-magic-numbers
        expect(count).to.be.eq(3);

        count++;
    });

    it('11. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/user').set('ID', '2');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res.text).to.be.eq('4');
        // eslint-disable-next-line no-magic-numbers
        expect(count).to.be.eq(4);

        count++;

        await Cache.flush(CacheLevel.L1);
    });

    it('12. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/user').set('anonimous', 'true');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res.text).to.be.eq('5');
        // eslint-disable-next-line no-magic-numbers
        expect(count).to.be.eq(5);

        await Cache.flush(CacheLevel.L1);
    });

    it('13. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/').set('misconfigsystem', 'true');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(500);
        expect(res.text).to.be.eq('System has not identification value: identificacao.');
    });

    it('14. flush', async (): Promise<void> => {
        let flushError: Error;
        try {
            await Cache.flush(undefined);
        }
        catch (error: any) {
            flushError = error;
        }

        expect(flushError.message).to.be.eq('Cache level was not provided.');
    });
});
