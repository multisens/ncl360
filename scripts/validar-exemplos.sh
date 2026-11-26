#!/bin/sh
# Validates the example scenes (exemplos/*.ncl360) against profiles/NCL360.xsd,
# offline.
#
# The NCL360 schemas import NCL 4.0 modules by the absolute URL
# http://www.ncl.org.br/NCL4.0/modules/..., which does not serve them. Point
# NCL40_DIR to a local folder holding NCL4.0/modules/ (the supplementary files
# of ABNT NBR 25608) and this script maps the URL to it with an XML catalog.
#
# Usage: NCL40_DIR=/path/to/folder-with-NCL4.0 scripts/validar-exemplos.sh [file...]
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)

if [ -z "${NCL40_DIR:-}" ] || [ ! -d "$NCL40_DIR/NCL4.0/modules" ]; then
    echo "NCL40_DIR must point to a folder that contains NCL4.0/modules/" >&2
    exit 2
fi

CATALOG=$(mktemp)
trap 'rm -f "$CATALOG"' EXIT
NCL40=$(cd "$NCL40_DIR" && pwd)/NCL4.0/
cat > "$CATALOG" <<XML
<?xml version="1.0"?>
<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog">
  <rewriteURI uriStartString="http://www.ncl.org.br/NCL4.0/" rewritePrefix="file://$NCL40"/>
  <rewriteSystem systemIdStartString="http://www.ncl.org.br/NCL4.0/" rewritePrefix="file://$NCL40"/>
</catalog>
XML

if [ "$#" -eq 0 ]; then
    set -- "$ROOT"/exemplos/*.ncl360
fi

XML_CATALOG_FILES=$CATALOG xmllint --nonet --noout --schema "$ROOT/profiles/NCL360.xsd" "$@"
