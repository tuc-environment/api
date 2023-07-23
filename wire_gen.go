// Code generated by Wire. DO NOT EDIT.

//go:generate go run github.com/google/wire/cmd/wire
//go:build !wireinject
// +build !wireinject

package main

import (
	"api/api"
	"api/app"
	"api/config"
	"api/logger"
	"api/service"
	"api/store"
	"github.com/google/wire"
)

// Injectors from wire.go:

func InitializeApp() (*app.App, error) {
	configConfig := config.NewConfig()
	loggerLogger, err := logger.NewLogger()
	if err != nil {
		return nil, err
	}
	db, err := store.NewDB(configConfig)
	if err != nil {
		return nil, err
	}
	accountService := service.NewAccountService(db)
	helloAPI := api.NewHelloAPI(configConfig, accountService)
	engine, err := app.NewEngine(configConfig, loggerLogger, helloAPI)
	if err != nil {
		return nil, err
	}
	appApp := app.NewApp(engine, configConfig, loggerLogger)
	return appApp, nil
}

// wire.go:

var appSet = wire.NewSet(app.NewEngine, config.NewConfig, logger.NewLogger, store.NewDB, service.NewAccountService, api.NewHelloAPI)
