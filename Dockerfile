FROM httpd:buster   
LABEL maintainer "idev-fsd@groupes.epfl.ch"

RUN set -e -x; \
    export DEBIAN_FRONTEND=noninteractive ; \
    apt-get update ; \
    apt-get install -y \
        cpanminus \
        default-mysql-client \
        libdbd-mysql-perl \
        libdigest-sha-perl \
        libio-socket-ssl-perl \
        libjson-perl \
        libnet-ldap-perl \
        libnet-ssleay-perl \
        libperlio-utf8-strict-perl \
        make ; \
    apt-get -y clean

# Install Perl dependencies out of CPAN (except those that link to C code,
# that should have been installed out of the distro, above)
COPY cpanfile cpanfile
RUN cpanm --installdeps --notest .
