FROM ghcr.io/epfl-si/common-web:1.6.0

USER 0

RUN set -e -x; apt-get update ; \
    apt-get install -y --no-install-recommends libxml-libxml-perl uuid-dev; \
    rm -rf /var/lib/apt/lists/*

# TODO: hoist this in parent image (https://github.com/epfl-si/common-web/pull/1)
RUN cpanm Apache::DBI

COPY . /var/www/vhosts/ticketshop.epfl.ch/

WORKDIR /var/www/vhosts/ticketshop.epfl.ch

RUN mv perllib/ticketshop_lib.pm /opt/dinfo/lib/perl/

RUN cpanm --installdeps --notest . || ( cat /root/.cpanm/work/*/build.log; exit 1 )

# Ensure that the logs and Tequila state directories exist and are writable by apache
RUN set -e -x; for subdir in logs Tequila/Sessions; do mkdir -p $subdir; chmod 777 -R $subdir; done

RUN a2enmod cgi

RUN echo "guests.aeskey\tnone" > /opt/dinfo/etc/secrets.conf

# Temp version marked
RUN touch $(date "+%Y%m%d-%H%M%S")_deployed

USER 1001
ENTRYPOINT ["/usr/sbin/apache2", "-e", "debug", "-D", "FOREGROUND"]
