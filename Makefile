all:
	make wire docs fmt build

deps:
	go install github.com/google/wire/cmd/wire@latest
	go install github.com/swaggo/swag/cmd/swag@latest
	go install github.com/cosmtrek/air@latest

build:
	go build -o api.exe

aliyunfun:
	make wire docs fmt
	CGO_ENABLED=0 GOARCH=amd64 GOOS=linux go build -tags lambda -a -ldflags '-extldflags "-static"' -o main
	zip main.zip main

watch:
	air --build.cmd "make" --build.bin "./api.exe"

fmt:
	go fmt ./...
	swag fmt

wire:
	wire

docs:
	swag init

clean:
	rm -rf api.exe

.PHONY: all deps build watch fmt wire docs clean
