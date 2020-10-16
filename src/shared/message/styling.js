/**
 * @copyright 2020, the Converse.js contributors
 * @license Mozilla Public License (MPLv2)
 * @description Utility functions to help with parsing XEP-393 message styling hints
 * @todo Other parsing helpers can be made more abstract and placed here.
 */
import { html } from 'lit-element';
import { renderStylingDirectiveBody } from '../../templates/directives/styling.js';


const styling_directives = ['*', '_', '~', '`', '```', '>'];
const styling_map = {
    '*': {'name': 'strong', 'type': 'span'},
    '_': {'name': 'emphasis', 'type': 'span'},
    '~': {'name': 'strike', 'type': 'span'},
    '`': {'name': 'preformatted', 'type': 'span'},
    '```': {'name': 'preformatted_block', 'type': 'block'},
    '>': {'name': 'quote', 'type': 'block'}
};

const styling_templates = {
    // m is the chatbox model
    // i is the offset of this directive relative to the start of the original message
    'emphasis': (txt, m, i) => html`<span class="styling-directive">_</span><i>${renderStylingDirectiveBody(txt, m, i)}</i><span class="styling-directive">_</span>`,
    'preformatted': txt => html`<span class="styling-directive">\`</span><code>${txt}</code><span class="styling-directive">\`</span>`,
    'preformatted_block': txt => html`<div class="styling-directive">\`\`\`</div><code class="block">${txt}</code><div class="styling-directive">\`\`\`</div>`,
    'quote': (txt, m, i) => html`<blockquote>${renderStylingDirectiveBody(txt, m, i)}</blockquote>`,
    'strike': (txt, m, i) => html`<span class="styling-directive">~</span><del>${renderStylingDirectiveBody(txt, m, i)}</del><span class="styling-directive">~</span>`,
    'strong': (txt, m, i) => html`<span class="styling-directive">*</span><b>${renderStylingDirectiveBody(txt, m, i)}</b><span class="styling-directive">*</span>`,
};

function getDirective (text, i, opening=true) {
    // TODO: blockquote is only valid if on own line
    // TODO: blockquote without end quote is valid until end of text or of containing quote
    let d;
    if (styling_directives.includes(text.slice(i, i+4))) {
        d = text.slice(i, i+4);
    } else if (
        text.slice(i).match(/(^```\s*\n|^```\s*$)/) &&
        (i === 0 || text[i-1] === '\n' || text[i-1] === '>')
    ) {
        d = text.slice(i, i+3);
    } else if (styling_directives.includes(text.slice(i, i+1)) && text[i] !== text[i+1]) {
        d = text.slice(i, i+1);
    } else {
        return null;
    }
    if (opening && styling_map[d].type === 'span' && !text.slice(i+1).split('\n').shift().includes(d)) {
        // span directive without closing part before end or line-break, so not valid
        return null;
    } else {
        return d;
    }
}


function isDirectiveEnd (d, i, text) {
    const dtype = styling_map[d].type; // directive type
    return i === text.length || getDirective(text, i, false) === d || (dtype === 'span' && text[i] === '\n');
}


function getDirectiveLength (d, text, i) {
    if (!d) { return 0; }
    const begin = i;
    i += d.length;
    if (isQuoteDirective(d)) {
        i += text.slice(i).split(/\n[^>]/).shift().length;
        return i-begin;
    } else {
        // Set i to the last char just before the end of the direcive
        while (!isDirectiveEnd(d, i, text)) { i++; }
        if (i <= text.length) {
            i += d.length;
            return i-begin;
        }
    }
    return 0;
}


export function getDirectiveAndLength (text, i) {
    const d = getDirective(text, i);
    const length = d ? getDirectiveLength(d, text, i) : 0;
    return  { d, length };
}


export const isQuoteDirective = (d) => ['>', '&gt;'].includes(d);


export function getDirectiveTemplate (d, text, model, offset) {
    const template = styling_templates[styling_map[d].name];
    if (isQuoteDirective(d)) {
        return template(text.replace(/\n>/g, '\n'), model, offset);
    } else {
        return template(text, model, offset);
    }
}


export function containsDirectives (text) {
    for (let i=0; i<styling_directives.length; i++) {
        if (text.includes(styling_directives[i])) {
            return true;
        }
    }
}


export function escapeDirectiveText (text) {
    return text
        .replace(/\&/g, "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/(\p{L}|\p{N}|\p{P})>/g,  "$1&gt;")
        .replace(/'/g,  "&apos;")
        .replace(/"/g,  "&quot;");
}
