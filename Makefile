.PHONY: build
build:
	docker build . -t epflsi/ticketshop

.PHONY: tag
tag:
	docker tag epflsi/ticketshop epflsi/ticketshop:latest

.PHONY: push
push:
	docker push epflsi/ticketshop

.PHONY: run
run:
	docker run -it epflsi/ticketshop bash

.PHONY: exec
exec:
	docker exec -it $$(docker ps -a --filter "name=ticketshop_web" --format "{{.Names}}") bash

.PHONY: up
up: dbs.local.conf
	docker-compose up --build --force-recreate --remove-orphans

.PHONY: stop
stop:
	docker stop $$(docker ps -aq --filter "name=ticketshop")

.PHONY: rm
rm:
	docker rm $$(docker ps -aq --filter "name=ticketshop")

.PHONY: rmi
rmi:
	docker rmi $$(docker images | grep ticketshop | tr -s ' ' | cut -d' ' -f3)

.PHONY: tun
tun:
	ssh -T -N -L 0.0.0.0:3306:test-cadidb.epfl.ch:3306 dinfo@test-dinfo1.epfl.ch

# OpenShift
.PHONY: oc-build
oc-build:
	set -e -x; \
	./../ops/cffsible -vvv -t ticketshop.is; \
	BUILDCMD=$$(oc start-build ticketshop-idevfsd); \
	BUILDID=$$(echo "$$BUILDCMD" | grep -Eo '([0-9]*)'); \
	oc logs -f bc/ticketshop-idevfsd --version=$$BUILDID

.PHONY: oc-deploy
oc-deploy:
	set -e -x; \
	oc delete dc ticketshop; \
	./../ops/cffsible  -vvv -t ticketshop.dc

.PHONY: oc-getall
oc-getall:
	oc get all,secrets,configmap,pvc -o name --namespace=ticketshop-test

.PHONY: oc-delall
oc-delall:
	oc delete all,secrets,configmap,pvc --namespace=ticketshop-test

dbs.local.conf:
	cp /keybase/team/epfl_ticketshop/dbs.conf $@

.PHONY: realclean
realclean:
	rm dbs.local.conf
