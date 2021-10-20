# Dev Notes

This file explain how one can develop ticketshop locally (e.g. on his own 
laptop).

## TL;DR

`make build up`

→ http://localhost:8080/

## Docker images

First of all, the base image used for this project is built on the `dinfo-cicd`
openshift namespace. Check out https://github.com/epfl-si/ops.build-common to
read more about it. It's tagged `cadi-libs-idevfsd:latest` and can be pulled
with:
```
docker pull os-docker-registry.epfl.ch/dinfo-cicd/cadi-libs-idevfsd:latest
```
This image provide all the "Cadi" libs used here.

You need to have access to the namespace *dinfo-cicd* 
([dinfo-cicd-role-editor](https://groups.epfl.ch/cgi-bin/groups/viewgroup?groupid=S22803)
or [dinfo-cicd-role-viewer](https://groups.epfl.ch/cgi-bin/groups/viewgroup?groupid=S22804))
and be authenticated on the registry:
```
docker login os-docker-registry.epfl.ch -u GASPAR -p "$(oc whoami -t)"
```

Then, you may want to check the [ticketshop.ops](https://github.com/epfl-si/ticketshop.ops)
repository: it build the docker image used as from in the Dockerfile of this 
repository, `os-docker-registry.epfl.ch/ticketshop-test/ticketshop-idevfsd:preprod`.

Finally, the [Dockerfile](./Dockerfile) makes the latest adjustement needed in
order to run the ticketshop code.

## Databases

This project and its dependancies need to access some databases. `cff` is the
name of the ticketshop's DB. This DB is duplicated locally and is part of the
docker-compose deployment.
`dinfo` and `accred` are two additional databases that Cadi libs need to have 
access to. To avoid to duplicate these databases, you will need to set up a SSH
tunnel to `test-dinfo1`, in order that the code in the docker container can 
access it. The tunnel can be set with:
```
ssh -T -N -L 0.0.0.0:3306:test-cadidb.epfl.ch:3306 dinfo@test-dinfo1.epfl.ch
```

To access these database, the docker networking have to be able to access the 
tunnel. With docker v20.10+, the [extra_hosts](https://docs.docker.com/compose/compose-file/compose-file-v3/#extra_hosts)
directive can be used ([see this PR](https://github.com/docker/for-linux/issues/264#issuecomment-784985736)
and [the relevant stackoverflow](https://stackoverflow.com/a/67158212/960623)), 
somehow mimicking the Mac Os X's `host.docker.internal`. So the 
`docker-compose.yml` need to specify the `extra_hosts`:
```
services:
  ticketshop_web:
[...]
    extra_hosts:
      - "host.docker.internal:host-gateway"
[...]
```

Then, the DB's configuration can use `host.docker.internal` to reach the DBs 
through the SSH tunnel. The `dbs.conf` might look like:
```
dinfo	dinfo	host.docker.internal	dinfo	Av3RyV3rYS7r0nGP455w0rD
```

## FakeTequila

To fake the authentication and be able to impersonate users, the 
`TequilaFakeClient.pm` can be used. You can just use a volume mount to replace
the default Client, and set a `FAKE_TEQUILA` environment variable through the
Apache2 configuration.

* docker-compose.yml:
```
services:
  ticketshop_web:
[...]
    environment:
      - TEQUILA_HOST=test-tequila.epfl.ch
      - FAKE_TEQUILA=169419
[...]
    volumes:
      - ./TequilaFakeClient.pm:/opt/dinfo/lib/perl/Tequila/Client.pm
[...]
```

* Dockerfile:
```
RUN echo "PassEnv FAKE_TEQUILA" >> /usr/local/apache2/conf/httpd.conf
```

### Tests

In order to test the [artifactServer](./cgi-bin/artifactServer), one can use
```
TARGET=ticketshop-preprod.epfl.ch ./tests/artifact-server-tests.sh
```
It sends some SOAP requests and checks the HTTP responses.


### Sessions

Tequila will look up for certains directories to store the sessions files. Be 
sure to create a writable directory for this purpose, e.g. `/var/www/Tequila/Sessions`
or `/usr/local/apache2/cgi-bin/config/Sessions`.
