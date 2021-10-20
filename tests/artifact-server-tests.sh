#!/bin/bash

: ${TARGET:=https://test-ticketshop.epfl.ch}
: ${USER_EMAIL:=dominique.quatravaux@epfl.ch}
: ${USER_SCIPER:=169419}

fatal () {
  echo >&2 "$@"
  echo "1..1"
  exit 1
}

prereqs () {
  which xmllint >/dev/null || {
    case "$(uname -s)" in
      Linux)  fatal "Please install the xmllint package" ;;
      Darwin) fatal 'Please install the xmllint package: `brew install libxml2`' ;;
    esac
  }
}

tmpdir () {
    local tmpdir
    local var=$1; shift
    tmpdir="$(mktemp -d "$@")"
    trap "set -x; rm -rf '$tmpdir'" EXIT INT HUP
    eval "$var=$tmpdir"
}

tmpfile () {
    local var=$1; shift
    if [ -z "$_tmpfile_tmpdir" ] ; then
        tmpdir _tmpfile_tmpdir /tmp/artifact-tmp-XXXXXX
    fi

    __tmpfile_tmpfile="$(mktemp "$_tmpfile_tmpdir"/tmpfile-XXXXXX)"
    eval "$var=$__tmpfile_tmpfile"
}

tmpfile_cat () {
    local var=$1; shift
    tmpfile __tmpfile_cat
    cat > "$__tmpfile_cat"
    eval "$var=$__tmpfile_cat"
}

soap_getArtifactID () {
    local email=$1; shift

    tmpfile_cat __soap_getArtifactID_xml_req <<XML
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Header/><SOAP-ENV:Body><ns3:getArtifactID xmlns:ns3="http://xmlns.sbb.ch/zvs/splp/artifact"><email>$email</email><vertragsnummer>EPFL776</vertragsnummer></ns3:getArtifactID></SOAP-ENV:Body></SOAP-ENV:Envelope>
XML

    curl -v -X POST -H "Content-Type: text/xml" \
         --data-binary @$__soap_getArtifactID_xml_req \
         "$TARGET"/cgi-bin/artifactServer
}

soap_getArtifact () {
  local sciper=$1; shift

  tmpfile_cat __soap_getArtifact_xml_req <<XML
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Header/><SOAP-ENV:Body><ns3:getArtifact xmlns:ns3="http://xmlns.sbb.ch/zvs/splp/artifact"><artifactID><id>$sciper</id></artifactID></ns3:getArtifact></SOAP-ENV:Body></SOAP-ENV:Envelope>
XML

  curl -v -X POST -H "Content-Type: text/xml" \
     --data-binary @$__soap_getArtifact_xml_req \
     "$TARGET"/cgi-bin/artifactServer
}

run_test () {
    (set -e; set -o pipefail; $2)
    local teststatus=$?
    if [ $teststatus = 0 ]; then
        echo "ok $1 # $2"
    else
        echo "not ok $1 # $2"
    fi
}

test_200_response_on_existing_user () {
    soap_getArtifactID "$USER_EMAIL"  2>&1 | (set -x; grep -q "HTTP/1.1 200")
}

test_conformant_xml_on_getArtifactID_on_existing_user () {
    soap_getArtifactID "$USER_EMAIL" 2>/dev/null | iconv -f utf8 -t utf8 | xmllint --noout -
}

test_500_response_on_bogus_user () {
    # Weird - It sounds like being in an “if” (from the caller) disables set -e altogether?
    soap_getArtifactID "fake.email@epfl.ch"  2>&1 | (set -x; grep -q "User not found")
    soap_getArtifactID "fake.email@epfl.ch"  2>&1 | (set -x; grep -q "HTTP/1.1 500")
}

test_conformant_xml_on_getArtifact_on_existing_user () {
  soap_getArtifact $USER_SCIPER 2>/dev/null | iconv -f utf8 -t utf8 | xmllint --noout -
}

prereqs
echo Testing on $TARGET with $USER_EMAIL and $USER_SCIPER
run_test 1 test_200_response_on_existing_user
run_test 2 test_conformant_xml_on_getArtifactID_on_existing_user
run_test 3 test_500_response_on_bogus_user
run_test 4 test_conformant_xml_on_getArtifact_on_existing_user
echo "1..4"
