import { Scanner } from "../music-core/Parsing/Scanner";
import { REPLResult } from "./REPLResult";
export interface ICommandProcessor {
    readonly name: string;
    process(scanner: Scanner): REPLResult;
}