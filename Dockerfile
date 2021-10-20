# https://hub.docker.com/_/httpd
#FROM os-docker-registry.epfl.ch/dinfo-cicd/cadi-libs-idevfsd:latest
FROM os-docker-registry.epfl.ch/ticketshop-test/ticketshop:preprod
LABEL maintainer "idev-fsd@groupes.epfl.ch"

RUN touch /usr/local/apache2/conf/25-ticketshop.epfl.ch.conf

# Enable apache modules. `headers` and `env` modules are enabled by default.
RUN sed -i \
    -e 's/^#\(LoadModule .*mod_rewrite.so\)/\1/' \
    -e 's/^\s#\(LoadModule .*mod_cgid\?.so\)/\1/' \
    -e 's/^#\(LoadModule .*mod_remoteip.so\)/\1/' \
    -e 's/^Listen 80$/Listen 8080/' \
    /usr/local/apache2/conf/httpd.conf

RUN echo "PassEnv FAKE_TEQUILA" >> /usr/local/apache2/conf/httpd.conf
RUN echo "PassEnv TEQUILA_HOST" >> /usr/local/apache2/conf/httpd.conf
RUN echo "PassEnv SITE_URL" >> /usr/local/apache2/conf/httpd.conf

# RUN echo "Include /var/www/vhosts/ticketshop.epfl.ch/conf/*.conf" >> /usr/local/apache2/conf/httpd.conf

RUN mkdir -p /var/www/Tequila/Sessions
RUN chmod 777 -R /var/www/Tequila/Sessions


EXPOSE 8080

## Temporary fixe
# RUN mkdir -p /var/www/vhosts/ticketshop.epfl.ch/private/etc/
# RUN touch /var/www/vhosts/ticketshop.epfl.ch/private/etc/access_params
# RUN echo '# some secrets' > /var/www/vhosts/ticketshop.epfl.ch/private/etc/access_params
# RUN ls /var/www/vhosts/ticketshop.epfl.ch/private/etc/
# RUN echo "\$sap_user = 'ticketshop';" >> /var/www/vhosts/ticketshop.epfl.ch/private/etc/access_params
# RUN echo "\$sap_pwd  = 'PleaseChangeMe';" >> /var/www/vhosts/ticketshop.epfl.ch/private/etc/access_params
# RUN cat /var/www/vhosts/ticketshop.epfl.ch/private/etc/access_params

# Enable the default cgi-bin test
# RUN sed -i '1i#!/bin/sh' /usr/local/apache2/cgi-bin/test-cgi ; \
#     chmod 755 /usr/local/apache2/cgi-bin/test-cgi
# 
# /usr/local/lib/site_perl
# 
# ADD https://c4science.ch/diffusion/2517/accred-libs.git /usr/local/lib/site_perl/Accred
# RUN git clone https://c4science.ch/diffusion/2517/accred-libs.git /usr/local/lib/site_perl
# COPY ./cadi-libs/Cadi/. /opt/dinfo/lib/perl/Cadi/
# COPY ./accred-libs/Accred/. /opt/dinfo/lib/perl/Accred/
# COPY ./tequila-perl-client/Tequila/Client.pm /opt/dinfo/lib/perl/Tequila/Client.pm
# COPY ./perllib/*.pm /opt/dinfo/lib/perl/
# COPY ./cgi-bin/messages.txt /opt/dinfo/lib/perl/messages.txt
