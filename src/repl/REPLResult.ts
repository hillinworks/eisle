export interface REPLResult {
    type: "text" | "image";
    content: string;
}

export namespace REPLResult {
    export function text(content: string): REPLResult {
        return {
            type: "text",
            content: content
        };
    }
}