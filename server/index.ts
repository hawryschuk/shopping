#!/usr/bin/env ts-node

import { MemoryDAO, ShoppingApplication } from '../model';
import { SQLiteDAO } from '../sqlite/dao.sqlite';
import { ShoppingApplicationRestApiServer } from './ShoppingApplicationRestApiServer';
const port = process.argv.map(a => parseInt((/--port=(\d+)/.exec(a) || [])[1])).find(port => !!port) || 8001;
const dao = process.argv.find(a => /memory/.test(a)) ? new MemoryDAO() : new SQLiteDAO('shopping.sqlite', ShoppingApplication.models);
const server = new ShoppingApplicationRestApiServer(new ShoppingApplication(dao));
server.expressApp.listen(port);
console.log(`Listening on port ${port}`);
