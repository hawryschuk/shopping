import { ShoppingApplication as TheApplication } from "../model";
import { SQLiteDAO } from "./dao.sqlite";
import { RUN_SPECS } from '../model/ShoppingApplication.specs';

const dao = new SQLiteDAO('test.sqlite', TheApplication.models);
const dao2 = new SQLiteDAO(':memory:', TheApplication.models);
before(async () => await dao.ready$);
before(async () => await dao2.ready$);
RUN_SPECS(new TheApplication(dao));
RUN_SPECS(new TheApplication(dao2));
