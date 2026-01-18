.PHONY: build run

build:
	docker build -t darkroom-application:latest ./application
	docker build -t darkroom-nginx:latest ./nginx

run:
	docker compose up -d

stop:
	docker compose down