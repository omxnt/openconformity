# Promoting the beta

The steps that take the beta generation from the sandbox to the root, in the order to run them, one commit each. The working tree already carries the edits the move needs. The tests and two module headers read the attributes document from `docs`, the metamodel and schema tests read those files by the root paths, and the draft banner is gone from the attributes document. Until step 2 runs, the suite in the sandbox cannot find the document and fails on that alone. The whole suite was run in a copy laid out as the root will be, and every file passed.

## 1. Freeze the demo as it was published

The root `app` is the demo that is live. The frozen copy in the sandbox predates three fixes to it, the two metamodel images and the favicon. Copy them over so the record is what was published.

    cp app/assets/images/metamodel-dark.png app/assets/images/metamodel-light.png sandbox/app/demo/assets/images/
    cp app/assets/marks/favicon.svg sandbox/app/demo/assets/marks/
    git add sandbox/app/demo
    git commit -m "Freeze the demo as it was published"

## 2. Promote the beta

The software, its tests and the attributes document move together, since the tests read the document by the path `../docs/attributes.md` and the software by `../app`.

    git rm -r -q app && rm -rf app
    git mv sandbox/app/beta/app app
    git mv sandbox/app/beta/tests tests
    git mv -f sandbox/app/beta/notes/attributes.md docs/attributes.md
    (cd tests && ./run.sh)
    git add -A app tests docs/attributes.md
    git commit -m "Promote the beta to the root"

Every test file must report all checks passed before the commit.

## 3. Dissolve the beta folder

The decisions log has absorbed the plan, the iterations and the two drawing notes. The views proposal and its mockup are live work and move to a notes folder in the sandbox.

    git rm -q sandbox/app/beta/notes/plan.md sandbox/app/beta/notes/iterations.md sandbox/app/beta/notes/drawing-proposal.md sandbox/app/beta/notes/drawing-requirements.md
    mkdir -p sandbox/notes
    git mv sandbox/app/beta/notes/views-proposal.md sandbox/app/beta/notes/views-mockup sandbox/notes/
    rm -rf sandbox/app/beta
    git add -A sandbox
    git commit -m "Dissolve the beta generation into the root and the sandbox notes"

## 4. Update the settings for the assistant

`.claude/settings.json` denies writes under `/app`. After the move the software lives there, so the allow list and the deny list change as follows. The other denials stay.

    "allow": [
      "Edit(app/**)",
      "Write(app/**)",
      "Edit(tests/**)",
      "Write(tests/**)",
      "Edit(sandbox/**)",
      "Write(sandbox/**)"
    ]

Remove `"Edit(/app/**)"` and `"Write(/app/**)"` from the deny list.

## 5. Record the promotion in the documents

The documents are yours to edit. What follows is the text to paste.

### CLAUDE.md, Structure

    app/            the published software
    tests/          headless tests for the software
    site/           the published project site
    docs/           the project documentation
    schema/         the data model schema files
    sources/        the sources in editable formats
    sandbox/        the non-published work-in-progress
      app/          generations of the software
        poc/        frozen original proof of concept
        demo/       frozen demonstration prototype
      notes/        working notes and proposals
      gate/         the beta gate, a Cloudflare Worker and its settings
      site/         iterations of the project site

### CLAUDE.md, Verification

Run the test suite with `./run.sh` from `tests`; every file must report all checks passed. Then run a local server with `python3 -m http.server 8000` from `app`, open the page, and check the browser console shows no errors or warnings.

### README.md, Structure

    openconformity/
    ├── app/            the published software
    ├── tests/          headless tests for the software
    ├── site/           the published project site
    ├── docs/           the project documentation
    ├── schema/         the data model schema files
    ├── sources/        the sources in editable formats
    └── sandbox/        the non-published work-in-progress
        ├── app/        generations of the software
        │   ├── poc/    frozen original proof of concept
        │   └── demo/   frozen demonstration prototype
        ├── notes/      working notes and proposals
        ├── gate/       the beta gate, a Cloudflare Worker and its settings
        └── site/       iterations of the project site

### docs/decisions.md, two entries after D-079

    ### D-080 The beta at the root

    `2026-09-25` `repository`

    The beta generation is promoted to the root. The software is `app`, its tests are `tests` beside it, and the attributes draft is the published attributes document. The sandbox keeps the generations the project has passed, the working notes and proposals, the beta gate, and the site iterations.

        app/            the published software
        tests/          headless tests for the software
        site/           the published project site
        docs/           the project documentation
        schema/         the data model schema files
        sources/        the sources in editable formats
        sandbox/        the non-published work-in-progress
          app/          generations of the software
            poc/        frozen original proof of concept
            demo/       frozen demonstration prototype
          notes/        working notes and proposals
          gate/         the beta gate, a Cloudflare Worker and its settings
          site/         iterations of the project site

    > *The sandbox did what D-078 built it for, and development now happens where the software is published, on the develop branch, with main as its release snapshot (D-018). The tests sit beside the software rather than inside it, since everything under app is served and the tests are not for serving, and not in the sandbox, since they belong to the software on the same branch. The frozen demo was brought level with the published copy before the root was replaced, so the record is what was live. Supersedes D-078.*

    ---

    ### D-081 The beta behind one shared login

    `2026-09-25` `architecture` `repository`

    During the beta the software at app.openconformity.org is reachable only with one login shared with the invited testers. The gate is a Cloudflare Worker doing HTTP Basic Authentication on the route in front of the Pages deployment, configured on the host with the login as its variables, and the address the host gives every Pages project is covered by a Cloudflare Access policy. The software knows nothing of the gate. The Worker's source and its settings are kept in the sandbox as a record.

    > *The beta is for invited testers, and a login that travels with the invitation is what steers it to them. Basic Authentication over HTTPS is enough for that and no more, and the browser keeps the credentials for the session so the software's own requests pass unprompted. A gate written into the deployment, as a Pages Function, would put server-side code where C-TEC-007 forbids it, so the gate stands in front of the deployment instead, where removing one route ends it. Access with a one-time code per tester was weighed and would have given revocation per tester, but not one shared login. The exception in D-071 is not touched, since the gate receives what the browser sends to the host anyway and hands nothing on.*

### site/index.html, three places

Line 60, the menu, "Demo" becomes "Private beta". Line 99 and line 320, "Open the demo" becomes "Open the beta". Line 96, "The tool is currently in development." becomes "The tool is in private beta." Those are proposals, the wording is yours.

## 6. The gate

Set up before merging develop into main, so the beta is never live ungated. The steps are in `sandbox/gate/README.md`.
