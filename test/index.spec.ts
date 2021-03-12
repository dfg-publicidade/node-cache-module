import App from '@dfgpublicidade/node-app-module';
import chai, { expect } from 'chai';
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
    let httpServer: http.Server;
    let count: number = 0;

    before(async (): Promise<void> => {
        exp = express();
        const port: number = 3000;

        exp.set('port', port);

        httpServer = http.createServer(express);

        if (!process.env.REDIS_TEST_HOST || !process.env.REDIS_TEST_PASSWORD) {
            throw new Error('REDIS_TEST_HOST and REDIS_TEST_PASSWORD must be set');
        }

        const app: App = new App({
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
                },
                redis: {
                    host: process.env.REDIS_TEST_HOST,
                    password: process.env.REDIS_TEST_PASSWORD
                }
            },
            connectionName: '',
            db: undefined
        });

        const cacheL1: ExpressExpeditiousInstance = Cache.create(app, CacheLevel.L1, false);
        Cache.create(app, CacheLevel.L2, false);
        const cacheL1User: ExpressExpeditiousInstance = Cache.create(app, CacheLevel.L1, true);

        exp.use((req: Request, res: Response, next: NextFunction): void => {
            if (!req.headers.anonimous) {
                req.system = {
                    identificacao: 'sistema-teste'
                };
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

    it('1. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res.text).to.be.eq('0');
        expect(count).to.be.eq(0);

        count++;
    });


    it('2. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res.text).to.be.eq('0');
        expect(count).to.be.eq(1);

        await Cache.flush(CacheLevel.L1);

        count++;
    });

    it('3. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res.text).to.be.eq('2');
        expect(count).to.be.eq(2);

        await Cache.flush(CacheLevel.L1);

        count++;
    });

    it('4. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/user').set('ID', '1');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res.text).to.be.eq('3');
        // eslint-disable-next-line no-magic-numbers
        expect(count).to.be.eq(3);

        count++;
    });

    it('5. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/user').set('ID', '2');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res.text).to.be.eq('4');
        // eslint-disable-next-line no-magic-numbers
        expect(count).to.be.eq(4);

        count++;

        await Cache.flush(CacheLevel.L1);
    });

    it('6. create / flush', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/user').set('anonimous', 'true');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);
        expect(res.text).to.be.eq('5');
        // eslint-disable-next-line no-magic-numbers
        expect(count).to.be.eq(5);

        await Cache.flush(CacheLevel.L1);
    });
});
