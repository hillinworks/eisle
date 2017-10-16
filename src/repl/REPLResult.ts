export interface REPLResult {
    type: "text" | "image",
    content: string
}

export module REPLResult {
    export function text(content: string): REPLResult {
        return {
            type: "text",
            content: content
        };
    }
}