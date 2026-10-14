#!/bin/sh
# Runs every test file with the JavaScriptCore shell where it exists, else with
# Node, from this directory, then writes docs/verification.md. Exits non-zero
# if any test fails, or if neither shell is found.

cd "$(dirname "$0")" || exit 1
JSC="${JSC:-/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc}"

# The shell: jsc runs a module with -m, Node with the preamble node.mjs that
# defines readFile, print and arguments as jsc has them, and reads a .js
# file as a module by its syntax, which Node before 22 does not by default.
if [ -x "$JSC" ]; then
  run() { "$JSC" -m "$@"; }
elif command -v node >/dev/null 2>&1; then
  run() { node --experimental-detect-module --no-warnings --import ./node.mjs "$@"; }
else
  echo "Neither jsc nor node was found. Set JSC to the JavaScriptCore shell or install Node." >&2
  exit 1
fi

# The files under app/ are handed to every test, for the pins that need the list.
APP_FILES=$(cd ../app && find . -type f ! -name .DS_Store | sed 's#^\./##' | sort)

status=0
for test in test-*.js; do
  # shellcheck disable=SC2086
  if ! run "$test" -- $APP_FILES; then
    status=1
  fi
done

# The verification document is written from the test headers and manual.md.
# shellcheck disable=SC2086
run generate-verification.js -- test-*.js > ../docs/verification.md || status=1
exit $status
