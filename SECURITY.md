# Security

openconformity runs entirely in the browser. It keeps the user's data on the
user's device, sends nothing to a server of its own, and reaches an external
service only when the user consents. A report that shows otherwise, or shows
a way to run code from a project file, a drawing or a library, or a file the
software saves that runs a formula, loads from an outside address or
navigates when it is opened, is a security report.

## Reporting

Report through [GitHub's private vulnerability reporting](https://github.com/omxnt/openconformity/security/advisories/new)
for this repository, or by email to [info@openconformity.org](mailto:info@openconformity.org).
Do not open a public issue for a vulnerability until it is fixed. Say what
you found, how to reproduce it, and attach the file that triggers it where
one does. The aim is to acknowledge a report within seven days. The report
stays private until a fix is released, and the fix credits you unless you
ask otherwise.

## Scope

The software at [app.openconformity.org](https://app.openconformity.org) and
this repository. The draw.io editor the software embeds is JGraph's, and a
report about it belongs to [them](https://github.com/jgraph/drawio/security).

## Known risks

The [security model](docs/security.md) lists the threats the project has
considered, the controls that answer them, and every risk it accepts with
the argument for it. A report that shows such an argument does not hold is
welcome.

## Testing

Everything runs in the browser, so test on your own copy, served from the
[app folder](app/) or opened at [app.openconformity.org](https://app.openconformity.org)
with your own files. No server holds anyone's data. Research done in good
faith under this policy is welcome, and the project will not pursue it.

## Supported versions

The current release on main. Earlier releases are not patched.

## No bounty

The project is free and non-commercial, and pays no bounty.
