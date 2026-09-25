# The beta gate

`worker.js` is a Cloudflare Worker that puts HTTP Basic Authentication in front of app.openconformity.org, with one login shared with the invited testers. It runs on a route in the zone, ahead of the Pages deployment, and passes an authorised request through untouched. The software is static files and knows nothing of it. Set it up before develop is merged into main, so the beta is never live without it.

## 1. Set up

1. In the Cloudflare dashboard open Workers & Pages, create a Worker named `beta-gate`, replace its code with `worker.js`, and deploy.
2. Under the Worker's Settings, add two variables. `BETA_USER` as plain text, for example `beta`. `BETA_PASSWORD` as a secret. The gate refuses everything while either is missing.
3. Under the Worker's Settings, open Domains & Routes, add a Route in the zone openconformity.org with the pattern `app.openconformity.org/*`. The record for app is already proxied, as every Pages custom domain is, and a route runs before Pages does. The one order Cloudflare refuses is the reverse, adding a Pages custom domain where a route already exists, which does not apply here.
4. Turn preview deployments off in the Pages project, under Settings, Builds and deployments, branch control, so a push to develop never builds a copy of the beta at a preview address. The project's own address, openconformity-app.pages.dev, stays open. The code is public and the gate steers testers rather than hides anything, so that address is not worth Cloudflare's Access product, which is the only lock it offers and works by email login.

## 2. Verify

    curl -sI https://app.openconformity.org | head -1
    curl -sI -u beta:PASSWORD https://app.openconformity.org | head -1

The first answers 401 and the second 200. In a browser the prompt appears once per session, and declining it shows the closed page from `worker.js`. After signing in, open the console and check the software loads with no errors, including the draw.io editor, which lives on another origin and never sees the login.

## 3. Run

- To change the password, change the secret. Every open session is prompted at its next request.
- To end the beta, delete the route. The Worker may stay for the next one.
- Under the zone's SSL/TLS settings, keep Always Use HTTPS on, so the login never travels in clear.

## 4. What it is not

- Not one login per tester. Everyone shares the password, and nobody can be revoked alone. Cloudflare Access with a one-time code by email would give that, at the cost of the shared login.
- Not a strong lock. Anyone holding the password can pass it on. That is the bar the beta sets.
- Not a change to the software. After the first prompt the browser sends the login with every same-origin request, so scripts, styles and fonts load as before. Clear browser data in the software does not clear the browser's copy of the login, closing the browser does.
