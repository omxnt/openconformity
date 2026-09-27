/**
 * Exercises the drawing check: the strict parser, the acceptance of a
 * real draw.io export, and every refusal, each on a drawing crafted to
 * hold exactly the fault. Run from this directory.
 */

import './shim.js';
import { parseXml, checkDrawing, embeddedModel, pageCount, dataUrl, sizeText, DRAWING_LIMIT, DIMENSION_LIMIT } from '../app/modules/drawing.js';
import { ok, equal, deepEqual, summary } from './harness.js';

const fixture = readFile('fixtures/example.drawio.svg');

/** A small drawing around whatever the case needs. */
const svg = (inner, root = '') => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10"${root}>${inner}</svg>`;
const reason = (text) => {
  const verdict = checkDrawing(text);
  return verdict.ok ? 'accepted' : verdict.reason;
};

// --- The parser (F-DRW-001, N-SEC-001) ---------------------------------------

{
  const { root, instructions } = parseXml('<?xml version="1.0"?><!-- note --><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><a b="1&#xA;2" c=\'x &amp; y\'><!-- inner --><b/><![CDATA[<raw>]]>text &lt;here&gt;<c d="e"></c></a>');
  equal(root.name, 'a', 'the root is read');
  deepEqual(root.attributes, [{ name: 'b', value: '1\n2' }, { name: 'c', value: 'x & y' }], 'attributes decode numeric and named references');
  deepEqual(root.children.map((child) => child.name), ['b', 'c'], 'children in order, comments skipped');
  equal(root.text, '<raw>text <here>', "an element's own text, CDATA raw and references decoded");
  deepEqual(instructions, ['xml version="1.0"'], 'processing instructions are gathered for the check');
  const throws = (text) => {
    try {
      parseXml(text);
      return null;
    } catch (error) {
      return error.message;
    }
  };
  equal(throws('<a><b></a>'), 'a closes b', 'a mismatched end tag is a fault');
  equal(throws('<a>'), 'an unclosed element a', 'an unclosed element is a fault');
  equal(throws('<a x=1/>'), 'an attribute x without quotes', 'an unquoted attribute is a fault');
  equal(throws('<a>&nbsp;</a>'), 'an entity the diagram may not use, nbsp', 'an entity beyond the five is a fault');
  equal(throws('<!DOCTYPE a [<!ELEMENT a ANY>]><a/>'), 'a document type declaration with an internal subset', 'an internal subset is a fault');
  equal(throws('<a/><b/>'), 'content after the root element', 'two roots are a fault');
  equal(throws('<a><!ELEMENT b ANY></a>'), 'a declaration inside the document', 'a declaration in the body is a fault');
  equal(throws('text'), 'no root element', 'text alone is a fault');
}

// --- A real export is accepted, and carries its model (F-DRW-001, F-DRW-002) ---

{
  deepEqual(checkDrawing(fixture), { ok: true }, "draw.io's own export passes, DOCTYPE, foreignObject, PNG fallbacks and all");
  ok(embeddedModel(fixture).startsWith('<mxfile '), 'and carries the editor\'s model in its content attribute, decoded');
  ok(embeddedModel(fixture).includes('<mxCell id="_J7OuV8DenQBRahtQ6Ji-1"'), 'the model whole');
  equal(embeddedModel(svg('<g/>')), null, 'a drawing from elsewhere carries none');
  equal(pageCount(fixture), 1, 'the export holds one page');
  equal(pageCount(svg('<g/>')), 0, 'a drawing without a model holds none');
  equal(pageCount(svg('', ' content="&lt;mxfile&gt;&lt;diagram id=&quot;a&quot;/&gt;&lt;diagram id=&quot;b&quot;&gt;&lt;/diagram&gt;&lt;/mxfile&gt;"')), 2, 'a model of two pages is counted as two');
  ok(dataUrl(fixture).startsWith('data:image/svg+xml;charset=utf-8,%3C%3Fxml'), 'shown from a data URL, the text escaped');
  equal(sizeText(fixture), `${Math.round(fixture.length / 1024)} KB`, 'its size in whole kilobytes');
  equal(sizeText('x'), '1 KB', 'never less than one');
}

// --- What is accepted (F-DRW-001) ----------------------------------------------

{
  equal(reason(svg('<rect width="5" height="5" fill="url(#g)"/><a xlink:href="https://example.org"><text>link</text></a>')), 'accepted', 'a local paint reference and a web link on a shape are fine');
  equal(reason(svg('<image xlink:href="data:image/png;base64,AAAA" width="1" height="1"/><use href="#shape"/>')), 'accepted', 'an embedded image and a local use are fine');
  equal(reason(svg('<style>.a { fill: url(#p); } @font-face { src: url(data:font/woff2;base64,AAAA); }</style>')), 'accepted', 'a stylesheet referencing only local paint and embedded fonts is fine');
  equal(reason(svg('<foreignObject><div xmlns="http://www.w3.org/1999/xhtml" style="color: #000">text</div></foreignObject>')), 'accepted', 'HTML text in a foreignObject is fine');
  equal(reason(`<?xml version="1.0"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">${svg('<g/>')}`), 'accepted', 'a declaration and a DOCTYPE without a subset are fine');
}

// --- What is refused, and why (F-DRW-001, N-SEC-003) -------------------------

{
  equal(reason(''), 'holds nothing', 'nothing');
  equal(reason('x'.repeat(DRAWING_LIMIT + 1)), `is larger than ${DRAWING_LIMIT / 1024} KB`, 'too large, before any parsing');
  equal(reason(`<!DOCTYPE svg [<!ENTITY a "aaaa">]>${svg('&a;')}`), 'declares entities', 'entities, before any parsing');
  equal(reason(`<?xml-stylesheet href="x.css" type="text/css"?>${svg('')}`), 'links a stylesheet', 'a stylesheet instruction');
  equal(reason('<html xmlns="http://www.w3.org/1999/xhtml"><script>1</script></html>'), 'is not an SVG document', 'a document of another kind');
  equal(reason(svg('<rect></svg>')), 'is not well-formed XML, holding svg closes rect', 'malformed markup, with the parser\'s word');
  equal(reason(svg('<script>alert(1)</script>')), 'holds a script element', 'a script');
  equal(reason(svg('<foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><iframe src="https://x"></iframe></div></foreignObject>')), 'holds a iframe element', 'a frame inside HTML');
  equal(reason(svg('<rect onload="x()" width="1" height="1"/>')), 'holds an event handler', 'an event handler');
  equal(reason(svg('<a xlink:href="java\nscript:alert(1)"><rect/></a>')), 'links to code', 'a code link, even split by whitespace');
  equal(reason(svg('<a href="data:text/html,x"><rect/></a>')), 'links to code', 'a document link');
  equal(reason(svg('<image href="https://example.org/a.png" width="1" height="1"/>')), 'references an image outside the diagram', 'an image on the web');
  equal(reason(svg('<image href="file.png" width="1" height="1"/>')), 'references an image outside the diagram', 'an image on disk');
  equal(reason(svg('<use href="shapes.svg#a"/>')), 'references a shape outside the diagram', 'a shape from another file');
  equal(reason(svg('<style>@import url(x.css);</style>')), 'imports a stylesheet', 'an import');
  equal(reason(svg('<rect style="fill: url(https://x/p.png)"/>')), 'references a resource outside the diagram', 'a style attribute reaching out');
  equal(reason(svg('<style>.a { background: url("http://x/y") }</style>')), 'references a resource outside the diagram', 'a stylesheet reaching out');
  equal(reason(svg('', ` viewBox="0 0 ${DIMENSION_LIMIT + 1} 10"`)), `declares a view beyond ${DIMENSION_LIMIT}`, 'a view too wide');
  equal(reason(`<svg xmlns="http://www.w3.org/2000/svg" width="99999px" height="10"></svg>`), `declares a width beyond ${DIMENSION_LIMIT}`, 'a width too wide');
  equal(reason('<svg xmlns="http://www.w3.org/2000/svg"><rect onClick="x"/></svg>'), 'holds an event handler', 'a handler in any case');
  equal(reason('<svg xmlns="http://www.w3.org/2000/svg"><SCRIPT/></svg>'), 'holds a script element', 'an element in any case');
  equal(reason(svg('<foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><img src="https://x/a.png"/></div></foreignObject>')), 'references a resource outside the diagram', 'a source in embedded HTML');
  equal(reason(svg('<foreignObject><video xmlns="http://www.w3.org/1999/xhtml" src="https://x/v.mp4"></video></foreignObject>')), 'references a resource outside the diagram', 'a video source');
  equal(reason(svg('<foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><img src="data:image/png;base64,AAAA"/></div></foreignObject>')), 'accepted', 'an embedded image source passes');
  equal(reason(svg('<rect style="fill: url(\\68 ttps://x/p.png)"/>')), 'references a resource outside the diagram', 'an escaped url in a style');
  equal(reason(svg('<style>.a { background: \\75rl(\\68\\74\\74\\70\\73://x/y) }</style>')), 'references a resource outside the diagram', 'an escaped url in a stylesheet, its name escaped too');
  equal(reason(svg('<a><animate attributeName="href" to="javascript:alert(1)"/><rect/></a>')), 'animates a link or a handler', 'an animation of a link');
  equal(reason(svg('<rect><set attributeName="onload" to="x()"/></rect>')), 'animates a link or a handler', 'a set of a handler');
  equal(reason(svg('<rect><animate attributeName="xlink:href" to="javascript:alert(1)"/></rect>')), 'animates a link or a handler', 'a link in the linking namespace');
  equal(reason(svg('<rect><animate attributeName="opacity" from="0" to="1"/></rect>')), 'accepted', 'an animation of anything else passes');
  const outside = 'references a resource outside the diagram';
  equal(reason(svg('<filter id="f"><feImage href="https://x/a.png"/></filter>')), outside, 'a filter image on the web');
  equal(reason(svg('<pattern id="p" xlink:href="https://x/p.svg#q"/>')), outside, 'a pattern taken from another file');
  equal(reason(svg('<foreignObject><link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="https://x/s.css"/></foreignObject>')), outside, 'a link element in embedded HTML');
  equal(reason(svg('<foreignObject><img xmlns="http://www.w3.org/1999/xhtml" srcset="https://x/a.png 1x"/></foreignObject>')), outside, 'a source set');
  equal(reason(svg('<foreignObject><video xmlns="http://www.w3.org/1999/xhtml" poster="https://x/p.png"></video></foreignObject>')), outside, 'a poster');
  equal(reason(svg('<rect style="fill: image-set(\'https://x/a.png\' 1x)"/>')), outside, 'an image set in a style, with no url');
  equal(reason(svg('<a href="https://example.org"><rect/></a>')), 'accepted', 'a link to a page passes, since a picture follows no link');
  equal(reason(svg('<pattern id="p"/><pattern id="q" href="#p"/><filter id="f"><feImage href="data:image/png;base64,AAAA"/></filter>')), 'accepted', 'references inside the drawing, and an image as data, pass');
  const html = (inner) => svg(`<foreignObject width="1" height="1"><div xmlns="http://www.w3.org/1999/xhtml">${inner}</div></foreignObject>`);
  equal(reason(html('<meta http-equiv="refresh" content="0;url=https://x/"/>')), 'holds a meta element', 'a refresh, which a saved diagram opened on its own would follow');
  equal(reason(html('<form><input name="a"/></form>')), 'holds a form element', 'a form');
  equal(reason(html('<button>x</button>')), 'holds a button element', 'a button');
  equal(reason(html('<div http-equiv="refresh">x</div>')), 'holds an attribute that sends or navigates', 'a refresh attribute on any element');
  equal(reason(html('<a href="#x" ping="https://x/p">x</a>')), 'holds an attribute that sends or navigates', 'a link that pings');
  equal(reason(svg('<rect style="fill: image(https://x/a.png)"/>')), 'references a resource outside the diagram', 'an image function in a style');
  equal(reason(svg('<style>.a { background: cross-fade(url(#a), url(#b)) }</style>')), 'references a resource outside the diagram', 'a cross-fade');
  equal(reason(svg('<rect style="background-image: none"/>')), 'accepted', 'while a property that only names an image passes');
}

summary('test-drawing');
