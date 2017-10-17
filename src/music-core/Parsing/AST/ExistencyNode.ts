import { Node } from "./Node";
import { Scanner } from "../Scanner";

import { TextRange } from "../../Core/Parsing/TextRange";
import { ParseResult, ParseHelper } from "../ParseResult";

export class ExistencyNode extends Node {

    constructor(range?: TextRange) {
        super(range);
    }

}

export namespace ExistencyNode {
    export function parseCharExistency(scanner: Scanner, char: string): ParseResult<ExistencyNode> {
        if (scanner.expectChar(char)) {
            return ParseHelper.success(new ExistencyNode(scanner.lastReadRange));
        }

        return ParseHelper.fail();
    }
}