/**
 * Exercises the drawing check: the strict parser, the acceptance of a
 * real draw.io export, and every refusal, each on a drawing crafted to
 * hold exactly the fault. Run from this directory.
 */

import './shim.js';
import { parseXml, checkDrawing, embeddedModel, dataUrl, sizeText, DRAWING_LIMIT, DIMENSION_LIMIT } from '../app/modules/drawing.js';
import { ok, equal, deepEqual, summary } from './harness.js';

const fixture = readFile('fixtures/example.drawio.svg');

/** A small drawing around whatever the case needs. */
const svg = (inner, root = '') => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10"${root}>${inner}</svg>`;
const reason = (text) => {
  const verdict = checkDrawing(text);
  return verdict.ok ? 'accepted' : verdict.reason;
};

// --- The parser --------------------------------------------------------------

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

// --- A real export is accepted, and carries its model ------------------------

{
  deepEqual(checkDrawing(fixture), { ok: true }, "draw.io's own export passes, DOCTYPE, foreignObject, PNG fallbacks and all");
  ok(embeddedModel(fixture).startsWith('<mxfile '), 'and carries the editor\'s model in its content attribute, decoded');
  ok(embeddedModel(fixture).includes('<mxCell id="_J7OuV8DenQBRahtQ6Ji-1"'), 'the model whole');
  equal(embeddedModel(svg('<g/>')), null, 'a drawing from elsewhere carries none');
  ok(dataUrl(fixture).startsWith('data:image/svg+xml;charset=utf-8,%3C%3Fxml'), 'shown from a data URL, the text escaped');
  equal(sizeText(fixture), `${Math.round(fixture.length / 1024)} KB`, 'its size in whole kilobytes');
  equal(sizeText('x'), '1 KB', 'never less than one');
}

// --- What is accepted ----------------------------------------------------------

{
  equal(reason(svg('<rect width="5" height="5" fill="url(#g)"/><a xlink:href="https://example.org"><text>link</text></a>')), 'accepted', 'a local paint reference and a web link on a shape are fine');
  equal(reason(svg('<image xlink:href="data:image/png;base64,AAAA" width="1" height="1"/><use href="#shape"/>')), 'accepted', 'an embedded image and a local use are fine');
  equal(reason(svg('<style>.a { fill: url(#p); } @font-face { src: url(data:font/woff2;base64,AAAA); }</style>')), 'accepted', 'a stylesheet referencing only local paint and embedded fonts is fine');
  equal(reason(svg('<foreignObject><div xmlns="http://www.w3.org/1999/xhtml" style="color: #000">text</div></foreignObject>')), 'accepted', 'HTML text in a foreignObject is fine');
  equal(reason(`<?xml version="1.0"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">${svg('<g/>')}`), 'accepted', 'a declaration and a DOCTYPE without a subset are fine');
}

// --- What is refused, and why ------------------------------------------------

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
}

summary('test-drawing');
