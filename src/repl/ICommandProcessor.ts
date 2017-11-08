import { IUserSettings } from "../platforms/weixin/db/interfaces/IUserSettings";
import { Scanner } from "../music-core/Parsing/Scanner";
import { IREPLResult } from "./REPLResult";
export interface ICommandProcessor {
    readonly name: string;
    process(scanner: Scanner, userSettings: IUserSettings): Promise<IREPLResult>;
}