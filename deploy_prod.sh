#!/usr/bin/env bash

service='ticketshop'
vhost="/var/www/vhosts/${service}.epfl.ch"
user='dinfo'
hosts='itsaccred0005.xaas.epfl.ch itsaccred0006.xaas.epfl.ch'

for h in ${hosts}; do
    ssh="ssh ${user}@${h}"
    scp -r cgi-bin/*          ${user}@${h}:${vhost}/cgi-bin
    scp    conf/*.conf        ${user}@${h}:${vhost}/conf
    scp -r htdocs/*           ${user}@${h}:${vhost}/htdocs/
    scp -r private            ${user}@${h}:${vhost}/

    scp    scripts/*          ${user}@${h}:${service}/
done
