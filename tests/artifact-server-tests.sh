#!/bin/bash

: ${TARGET:=test-ticketshop.epfl.ch}

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
         https://"$TARGET"/cgi-bin/artifactServer
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
    soap_getArtifactID "dominique.quatravaux@epfl.ch"  2>&1 | (set -x; grep -q "HTTP/1.1 200")
}

test_500_response_on_bogus_user () {
    # Weird - It sounds like being in an “if” (from the caller) disables set -e altogether?
    soap_getArtifactID "dominiq.quatravaux@epfl.ch"  2>&1 | (set -x; grep -q "User not found")
    soap_getArtifactID "dominiq.quatravaux@epfl.ch"  2>&1 | (set -x; grep -q "HTTP/1.1 500")
}

run_test 1 test_200_response_on_existing_user
run_test 2 test_500_response_on_bogus_user
echo "1..2"
