#!/bin/sh
# Runs every test file with the JavaScriptCore shell, from this directory.
# Exits non-zero if any test fails.

cd "$(dirname "$0")" || exit 1
JSC="${JSC:-/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc}"

# The files under app/ are handed to every test, for the pins that need the list.
APP_FILES=$(cd ../app && find . -type f ! -name .DS_Store | sed 's#^\./##' | sort)

status=0
for test in test-*.js; do
  # shellcheck disable=SC2086
  if ! "$JSC" -m "$test" -- $APP_FILES; then
    status=1
  fi
done
exit $status
