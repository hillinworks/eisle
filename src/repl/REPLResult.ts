
export interface IREPLResult {
    fillResponse(xml: any): void;
}


export class REPLTextResult implements IREPLResult {

    readonly text: string;

    constructor(text: string) {
        this.text = text;
    }

    fillResponse(xml: any) {
        xml.MsgType = "text";
        xml.Content = this.text;
    }
}

export interface IArticle {
    readonly title: string;
    readonly description?: string;
    readonly picUrl: string;
    readonly url?: string;
}

export class REPLArticlesResult implements IREPLResult {
    private readonly articles: IArticle[];

    constructor(...articles: IArticle[]) {
        this.articles = articles;
    }

    fillResponse(xml: any) {
        xml.MsgType = "news";
        xml.ArticleCount = this.articles.length;
        xml.Articles = { item: [] };
        const items = xml.Articles.item;
        for (const article of this.articles) {
            const item = {
                Title: article.title,
                Description: article.description,
                PicUrl: article.picUrl,
                Url: article.url
            };

            items.push(item);
        }
    }
}