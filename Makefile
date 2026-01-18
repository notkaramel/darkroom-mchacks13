.PHONY: build run

build:
	docker build -t darkroom-application:latest ./application
	docker build -t darkroom-nginx:latest ./nginx


build-docker-hub:
	docker build -t notkaramel/darkroom-application:latest ./application --no-cache
	docker build -t notkaramel/darkroom-nginx:latest ./nginx --no-cache

push-docker-hub:
	docker push notkaramel/darkroom-application:latest
	docker push notkaramel/darkroom-nginx:latest


run:
	docker compose up -d

stop:
	docker compose down
