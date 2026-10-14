# Hostile drawings

The six probes of the release review of 27 September 2026, finding 1, each a drawing that loads from an outside address when opened on its own. The drawing check refuses every one, and the test V-TST-189 reads this folder.

| File | What it tries |
|---|---|
| `style-mismatched-quotes.svg` | A url in a style whose opening quote is not its closing one |
| `fill-attribute.svg` | A url in the fill attribute |
| `mask-attribute.svg` | A url in the mask attribute |
| `cursor-style.svg` | A url in a cursor style |
| `html-background.svg` | The HTML background attribute in a label |
| `style-import.svg` | A stylesheet import |
