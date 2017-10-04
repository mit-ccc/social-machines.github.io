#!/bin/bash

cd js
echo "Building filterable-list.min.js ..."
buble filterable-list.js | uglifyjs --compress --mangle > filterable-list.min.js

echo "Done."

