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
	dbClient, err := store.NewDBClient(configConfig)
	if err != nil {
		return nil, err
	}
	accountService := service.NewAccountService(configConfig, dbClient, loggerLogger)
	accountAPI := api.NewAccountAPI(configConfig, loggerLogger, accountService)
	stationService := service.NewStationService(configConfig, dbClient, loggerLogger)
	stationAPI := api.NewStationAPI(configConfig, loggerLogger, stationService)
	dataAPI := api.NewDataAPI()
	engine, err := app.NewEngine(configConfig, loggerLogger, accountAPI, stationAPI, dataAPI)
	if err != nil {
		return nil, err
	}
	appApp := app.NewApp(engine, configConfig, loggerLogger)
	return appApp, nil
}

// wire.go:

var appSet = wire.NewSet(app.NewEngine, config.NewConfig, logger.NewLogger, store.NewDBClient, service.NewAccountService, service.NewStationService, api.NewAccountAPI, api.NewDataAPI, api.NewStationAPI)
