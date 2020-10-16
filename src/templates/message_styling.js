import xss from "xss/dist/xss";
import { html } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";

export default (o) => {
    const whiteList = {
        b: [],
        blockquote: [],
        code: ['class'],
        del: [],
        em: [],
        i: [],
    };
    return html`${unsafeHTML(xss.filterXSS(o.html, { whiteList }))}`;
}
