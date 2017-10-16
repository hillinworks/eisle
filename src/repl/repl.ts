export interface REPLResult {
    type: "text" | "image",
    content: string
}

export class REPL {
    public static process(command: string): REPLResult {
        return { type: "text", content: command };
    }
}