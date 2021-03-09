import chai from 'chai';
import chaiHttp from 'chai-http';
import express, { Express, Request, Response } from 'express';
import http from 'http';
import { after, before, describe, it } from 'mocha';
import { promisify } from 'util';

/* Tests */
chai.use(chaiHttp);

describe('index.ts', (): void => {
    let httpServer: http.Server;
    let count: number = 0;

    before(async (): Promise<void> => {
        const app: Express = express();
        const port: number = 3000;

        httpServer = http.createServer(express);

        app.get('/', (req: Request, res: Response): void => {
            res.send(count++);
        });

        const listen: any = promisify(httpServer.listen).bind(httpServer);
        await listen(port);
    });

    after(async (): Promise<void> => {
        const close: any = promisify(httpServer.close).bind(httpServer);
        await close();
    });

    it('constructor (incomplete)', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(appServer.getServer()).keepOpen()
            .options('/');

        console.log(res.body);

        expect(res).to.have.status(200);
    });
});
