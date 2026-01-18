.PHONY: build run

build:
	docker build -t darkroom-application ./application

run:
	docker run -p 4173:4173 darkroom-application:latest