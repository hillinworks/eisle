import { IUser } from "../platforms/weixin/db/interfaces/IUser";
import { IUserSettings } from "../platforms/weixin/db/interfaces/IUserSettings";
import { Scanner } from "../music-core/Parsing/Scanner";
import { IREPLResult } from "./REPLResult";
export interface ICommandProcessor {
    readonly name: string;
    process(scanner: Scanner, user: IUser, userSettings: IUserSettings): Promise<IREPLResult>;
}