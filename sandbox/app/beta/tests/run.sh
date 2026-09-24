#!/bin/sh
# Runs every test file with the JavaScriptCore shell, from this directory.
# Exits non-zero if any test fails.

cd "$(dirname "$0")" || exit 1
JSC="${JSC:-/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc}"

status=0
for test in test-*.js; do
  if ! "$JSC" -m "$test"; then
    status=1
  fi
done
exit $status
