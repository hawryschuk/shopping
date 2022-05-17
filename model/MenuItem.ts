import { Purchase } from "./Purchase";
import { Model } from "../abstract/Model";
import { Util } from "../abstract/Util";

export class MenuItem extends Model<MenuItem> {
    name!: string;
    description!: string;
    price!: string;
    inventory: number = (this as any).inventory || 0;
    async invalid() { return '' }
}
