"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
function default_1(str) {
    return new Formatter(str).render();
}
exports.default = default_1;
const tokens = {
    /*
     * *bold*
     */
    bold: {
        start: /(?<boldStart>(?<!\\)\*)/,
        content: /(?<boldContent>.*?)/,
        stop: /(?<boldStop>(?<!\\)\*)/,
        embeddableAsParent: true,
        embeddableAsChild: true,
        render: (content) => `<strong>${content}</strong>`,
    },
    boldEscaped: {
        start: /(?<boldEscapedStart>\\\*)/,
        content: /(?<boldEscapedContent>.*?)/,
        stop: /(?<boldEscapedStop>\\\*)/,
        embeddableAsParent: true,
        embeddableAsChild: true,
        render: (content) => `*${content}*`,
    },
    /*
     * /italic/
     */
    italic: {
        start: /(?<italicStart>(?<!\\)\/)/,
        content: /(?<italicContent>.*?)/,
        stop: /(?<italicStop>(?<!\\)\/)/,
        embeddableAsParent: true,
        embeddableAsChild: true,
        render: (content) => `<em>${content}</em>`,
    },
    italicEscaped: {
        start: /(?<italicEscapedStart>\\\/)/,
        content: /(?<italicEscapedContent>.*?)/,
        stop: /(?<italicEscapedStop>\\\/)/,
        embeddableAsParent: true,
        embeddableAsChild: true,
        render: (content) => `&sol;${content}&sol;`,
    },
    /*
     * _underline_
     */
    underline: {
        start: /(?<underlineStart>(?<!\\)_)/,
        content: /(?<underlineContent>.*?)/,
        stop: /(?<underlineStop>(?<!\\)_)/,
        embeddableAsParent: true,
        embeddableAsChild: true,
        render: (content) => `<u>${content}</u>`,
    },
    underlineEscaped: {
        start: /(?<underlineEscapedStart>\\_)/,
        content: /(?<underlineEscapedContent>.*?)/,
        stop: /(?<underlineEscapedStop>\\_)/,
        embeddableAsParent: true,
        embeddableAsChild: true,
        render: (content) => `_${content}_`,
    },
    /*
     * ~strike~
     */
    strike: {
        start: /(?<strikeStart>(?<!\\)~)/,
        content: /(?<strikeContent>.*?)/,
        stop: /(?<strikeStop>(?<!\\)~)/,
        embeddableAsParent: true,
        embeddableAsChild: true,
        render: (content) => `<del>${content}</del>`,
    },
    strikeEscaped: {
        start: /(?<strikeEscapedStart>\\~)/,
        content: /(?<strikeEscapedContent>.*?)/,
        stop: /(?<strikeEscapedStop>\\~)/,
        embeddableAsParent: true,
        embeddableAsChild: true,
        render: (content) => `~${content}~`,
    },
    /*
     * `code`
     */
    code: {
        start: /(?<codeStart>(?<!\\)`)/,
        content: /(?<codeContent>.*?)/,
        stop: /(?<codeStop>(?<!\\)`)/,
        embeddableAsParent: false,
        embeddableAsChild: false,
        render: (content) => `<code class="code">${content}</code>`,
    },
    codeEscaped: {
        start: /(?<codeEscapedStart>\\`)/,
        content: /(?<codeEscapedContent>.*?)/,
        stop: /(?<codeEscapedStop>\\`)/,
        embeddableAsParent: false,
        embeddableAsChild: false,
        render: (content) => `\`${content}\``,
    },
    /*
     * ^sup^
     */
    sup: {
        start: /(?<supStart>(?<!\\)\^)/,
        content: /(?<supContent>.*?)/,
        stop: /(?<supStop>(?<!\\)\^)/,
        embeddableAsParent: false,
        embeddableAsChild: true,
        render: (content) => `<sup>${content}</sup>`,
    },
    supEscaped: {
        start: /(?<supEscapedStart>\\\^)/,
        content: /(?<supEscapedContent>.*?)/,
        stop: /(?<supEscapedStop>\\\^)/,
        embeddableAsParent: false,
        embeddableAsChild: true,
        render: (content) => `^${content}^`,
    },
    /*
     * ¡sub¡
     */
    sub: {
        start: /(?<subStart>(?<!\\)¡)/,
        content: /(?<subContent>.*?)/,
        stop: /(?<subStop>(?<!\\)¡)/,
        embeddableAsParent: false,
        embeddableAsChild: true,
        render: (content) => `<sub>${content}</sub>`,
    },
    subEscaped: {
        start: /(?<subEscapedStart>\\¡)/,
        content: /(?<subEscapedContent>.*?)/,
        stop: /(?<subEscapedStop>\\¡)/,
        embeddableAsParent: false,
        embeddableAsChild: true,
        render: (content) => `¡${content}¡`,
    },
    /*
     * [spoiler]
     */
    spoiler: {
        start: /(?<spoilerStart>(?<!\\)\[(?!ref\s?\d))/,
        content: /(?<spoilerContent>.*?)/,
        stop: /(?<spoilerStop>(?<!\\)\])/,
        embeddableAsParent: true,
        embeddableAsChild: true,
        render: (content) => `<span class="spoiler">${content}</span>`,
    },
    spoilerEscaped: {
        start: /(?<spoilerEscapedStart>\\\[)/,
        content: /(?<spoilerEscapedContent>.*?)/,
        stop: /(?<spoilerEscapedStop>\\\])/,
        embeddableAsParent: true,
        embeddableAsChild: true,
        render: (content) => `[${content}]`,
    },
    /*
     * >greentext
     */
    greentext: {
        start: /(?<greentextStart>^(?<!\\)&gt;(?!&gt;))/,
        content: /(?<greentextContent>.*?)/,
        stop: /(?<greentextStop>$)/,
        embeddableAsParent: true,
        embeddableAsChild: false,
        render: (content, stop) => `<span class="greentext block">&gt;${content}</span>${stop}`,
    },
    greentextEscaped: {
        start: /(?<greentextEscapedStart>\\&gt;)/,
        embeddableAsParent: false,
        embeddableAsChild: true,
        render: () => `&gt;`,
    },
    /*
     * <redtext
     */
    redtext: {
        start: /(?<redtextStart>^(?<!\\)&lt;)/,
        content: /(?<redtextContent>.*?)/,
        stop: /(?<redtextStop>$)/,
        embeddableAsParent: true,
        embeddableAsChild: false,
        render: (content, stop) => `<span class="redtext block">&lt;${content}</span>${stop}`,
    },
    redtextEscaped: {
        start: /(?<redtextEscapedStart>\\&lt;)/,
        embeddableAsParent: false,
        embeddableAsChild: true,
        render: () => `&lt;`,
    },
    /*
     * (((echoes)))
     */
    echoes: {
        start: /(?<echoesStart>(?<!\\)\({3})/,
        content: /(?<echoesContent>.*?)/,
        stop: /(?<echoesStop>(?<!\\)\){3})/,
        embeddableAsParent: true,
        embeddableAsChild: false,
        render: (content) => `<span class="echoes">(((${content})))</span>`,
    },
    /*
     * >>123
     */
    reference: {
        start: /(?<referenceStart>(?<!\\)&gt;(?<!\\)&gt;)/,
        content: /(?<referenceContent>[1-9][0-9]*?)/,
        stop: /(?<referenceStop>\s|$)/,
        embeddableAsParent: false,
        embeddableAsChild: true,
        render: (content, stop) => `<a class="reference" href="#${content}" data-uri="${content}">&gt;&gt;${content}</a>${stop}`,
        metadata: (metadata, content) => {
            if (!metadata.references) {
                metadata.references = new Set();
            }
            const id = parseInt(content);
            if (!isNaN(id)) {
                metadata.references.add(id);
            }
        },
    },
};
/*
 * Combined regular expression of all formatting patterns.
 */
const tokenPattern = new RegExp((() => {
    const delimiters = [];
    for (const key in tokens) {
        const { start, content, stop } = tokens[key];
        delimiters.push(`(?<${key}>${start.source}${(content === null || content === void 0 ? void 0 : content.source) || ''}${(stop === null || stop === void 0 ? void 0 : stop.source) || ''})`);
    }
    return delimiters.join('|');
})(), 
// Global and multiline flags. Without global, only one token will be formatted.
// Without multiline, the ^ and $ matching operators don't work correctly.
'gm');
/*
 * Regular expression to match URLs.
 */
const urlPattern = new RegExp(
// Optional protocol identifier.
// Short syntax // is still required.
'(?:(?:(?:https?|ftp):)?\\/\\/)' +
    // Optional user:pass.
    '(?:\\S+(?::\\S*)?@)?' +
    '(?:' +
    // Exclude private and local networks.
    '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
    '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
    '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
    // Exclude loopback network 0.0.0.0.
    // Exclude reserved space >= 224.0.0.0.
    // Exclude network and broadcast addresses (first and last IP address of each class).
    '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
    '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
    '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
    '|' +
    // Host and domain names. May end with dot.
    // Can be replaced with the shortest alternative.
    // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
    '(?:' +
    '(?:' +
    '[a-z0-9\\u00a1-\\uffff]' +
    '[a-z0-9\\u00a1-\\uffff_-]{0,62}' +
    ')?' +
    '[a-z0-9\\u00a1-\\uffff]\\.' +
    ')+' +
    // TLD name. May end with dot.
    '(?:[a-z\\u00a1-\\uffff]{2,}\\.?)' +
    ')' +
    // Optional port number.
    '(?::\\d{2,5})?' +
    // Optional resource path.
    '(?:[/?#]\\S*)?', 'ig');
class Formatter {
    constructor(str) {
        this.original = '' + (str || '');
        this.metadata = {};
        this.map = {};
    }
    /*
     * Renders post comment input to browser-ready HTML.
     */
    render() {
        let str = this.original;
        str = this.escapeHtml(str);
        str = this.formatFootnotesPre(str);
        str = this.formatLinks(str);
        str = this.formatTokens(str);
        str = this.formatPlaceholders(str);
        str = this.formatWhitespace(str);
        return {
            original: this.original,
            rendered: str,
            metadata: this.metadata,
        };
    }
    /*
     * Escapes all "'&<>{} characters.
     */
    escapeHtml(str) {
        const matchHtmlRegExp = /["'&<>]/;
        const match = matchHtmlRegExp.exec(str);
        if (!match) {
            return str;
        }
        let escape;
        let html = '';
        let index = 0;
        let lastIndex = 0;
        for (index = match.index; index < str.length; index++) {
            switch (str.charCodeAt(index)) {
                case 34: // "
                    escape = '&quot;';
                    break;
                case 38: // &
                    escape = '&amp;';
                    break;
                case 39: // '
                    escape = '&#39;';
                    break;
                case 60: // <
                    escape = '&lt;';
                    break;
                case 62: // >
                    escape = '&gt;';
                    break;
                case 123: // {
                    escape = '&lbrace;';
                    break;
                case 125: // }
                    escape = '&rbrace;';
                    break;
                default:
                    continue;
            }
            // I have no memory of this place...
            if (lastIndex !== index) {
                html += str.substring(lastIndex, index);
            }
            lastIndex = index + 1;
            html += escape;
        }
        return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
    }
    /*
     * Replaces all inline footnote references with a placeholder, which
     * will be replaced later by calling formatFootnotesPost().
     *
     * Example: Here is a footnote[ref 1 https://google.com "Some Article Title"].
     */
    formatFootnotesPre(str) {
        const footnotes = [];
        const numberPart = /(?<number>[1-9][0-9]?)/.source;
        const linkPart = /(?<link>(?!&quot;)[^ ]+(?!&quot;))/.source;
        const titlePart = /(?<title>.*?)/.source; /* eslint-disable-next-line */
        const footnotePattern = new RegExp(`\\[ref\\s${numberPart}\\s${linkPart}?\\s?(&quot;${titlePart}&quot;)?\\]`, 'g');
        const placeholder = str.replace(footnotePattern, (match, ...args) => {
            const groups = args.pop();
            const { number, link, title } = groups;
            const re = new RegExp(`^${urlPattern.source}$`); // Add ^ and $ for safety.
            if ((link && re.test(link.trim())) || title) {
                const id = crypto_1.default.randomBytes(8).toString('hex');
                this.map[id] = {
                    render: (str) => str.replace(`{{${id}}}`, `<sup><a class="link" href="#footnote-${id}">&lbrack;${number}&rbrack;</a></sup>`),
                };
                footnotes.push({ id, number, link, title });
                return `{{${id}}}`;
            }
            else {
                return match;
            }
        });
        const footnotesFormatted = footnotes
            .sort((a, b) => {
            return a.number - b.number;
        })
            .map(({ id, number, link, title }) => {
            const linkTag = link
                ? '<a class="link ml-1" href="' +
                    link +
                    '" target="_blank">' +
                    link +
                    '</a>'
                : '';
            const titleTag = title
                ? '<span class="italic ml-1">' + title + '</span>'
                : '';
            return (`<span id="footnote-${id}" class="footnote">` +
                `<span>&lbrack;${number}&rbrack;</span>` +
                `${linkTag}${titleTag}` +
                `</span>`);
        })
            .join('\n');
        this.map.footnotes = {
            render: (str) => `${str}\n\n${footnotesFormatted}`,
        };
        return placeholder;
    }
    /*
     * Replaces all links with a placeholder.
     */
    formatLinks(str) {
        const placeholder = str.replace(urlPattern, (match) => {
            const id = crypto_1.default.randomBytes(8).toString('hex');
            this.map[id] = {
                render: (str) => str.replace(`{{${id}}}`, `<a class="link" href="${match}">${match}</a>`),
            };
            return `{{${id}}}`;
        });
        return placeholder;
    }
    /*
     * Formats all tokens occurring within the given string.
     */
    formatTokens(str, depth = 0, parent) {
        /*
         * Returns the token for the matched capture group.
         */
        function getToken(groups) {
            for (const key in tokens) {
                if (groups[key]) {
                    return { key, token: tokens[key] };
                }
            }
            throw new Error('token not found');
        }
        // Controls how many levels deep tokens can be formatted.
        // e.g., 3 levels - "This is /italics, this is *bold, here is a [spoiler]*/"
        const depthLimit = 5;
        return str.replace(tokenPattern, (match, ...args) => {
            const groups = args.pop();
            const { key, token } = getToken(groups);
            const stop = groups[`${key}Stop`];
            let content = groups[`${key}Content`];
            if (token.embeddableAsParent && depth <= depthLimit) {
                content = this.formatTokens(content, depth + 1, token);
            }
            if (token.metadata) {
                token.metadata(this.metadata, content);
            }
            if (parent && (!(parent === null || parent === void 0 ? void 0 : parent.embeddableAsParent) || !token.embeddableAsChild)) {
                return match;
            }
            else {
                return token.render(content, stop);
            }
        });
    }
    /*
     * Replaces placeholder tags with a string returned by
     * the render function at each ID in the placeholder map.
     */
    formatPlaceholders(str) {
        for (const id in this.map) {
            const { render } = this.map[id];
            str = render(str);
        }
        return str;
    }
    /*
     * Removes extra whitespace and newlines.
     */
    formatWhitespace(str) {
        // Trim space at beginning and end of string.
        str = str.replace(/^\s+|\s+$/g, '');
        let i = 0;
        const final = [];
        const split = str.split(/\r?\n/).filter((x) => x);
        while (i < split.length) {
            const value = split[i];
            if (/^<span class="(green|red)text/.test(value)) {
                // Cluster groups of green- and redtext in the same <p> tag.
                const arr = [value];
                let next = split[++i];
                while (/^<span class="(green|red)text/.test(next)) {
                    arr.push(next);
                    next = split[++i];
                }
                final.push(`<p>${arr.join('')}</p>`);
            }
            else if (/^<a class="reference/.test(value)) {
                // Cluster groups of references in the same <p> tag.
                const arr = [value];
                let next = split[++i];
                while (/^<a class="reference/.test(next)) {
                    arr.push(next);
                    next = split[++i];
                }
                final.push(`<p>${arr.join('<br>')}</p>`);
            }
            else {
                // Wrap everything else in a <p> tag.
                final.push(`<p>${value}</p>`);
                i++;
            }
        }
        return final.join('');
    }
}
