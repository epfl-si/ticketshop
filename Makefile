.PHONY: build tag push run up stop rm rmi
build:
	docker build . -t epflsi/ticketshop

tag:
	docker tag epflsi/ticketshop epflsi/ticketshop:latest

push:
	docker push epflsi/ticketshop

run:
	docker run -it epflsi/ticketshop bash

exec:
	docker exec -it $$(docker ps -a --filter "name=ticketshop_web" --format "{{.Names}}") bash

up:
	docker-compose up --build --force-recreate --remove-orphans

stop:
	docker stop $$(docker ps -aq --filter "name=ticketshop")

rm:
	docker rm $$(docker ps -aq --filter "name=ticketshop")

rmi:
	docker rmi $$(docker images | grep ticketshop | tr -s ' ' | cut -d' ' -f3)

tun:
	ssh -T -N -L 0.0.0.0:3306:test-cadidb.epfl.ch:3306 dinfo@test-dinfo1.epfl.ch

# OpenShift
oc-build:
	set -e -x; \
	./../ops/cffsible -vvv -t ticketshop.is; \
	BUILDCMD=$$(oc start-build ticketshop-idevfsd); \
	BUILDID=$$(echo "$$BUILDCMD" | grep -Eo '([0-9]*)'); \
	oc logs -f bc/ticketshop-idevfsd --version=$$BUILDID

oc-deploy:
	set -e -x; \
	oc delete dc ticketshop; \
	./../ops/cffsible  -vvv -t ticketshop.dc

oc-getall:
	oc get all,secrets,configmap,pvc -o name --namespace=ticketshop-test

oc-delall:
	oc delete all,secrets,configmap,pvc --namespace=ticketshop-test
