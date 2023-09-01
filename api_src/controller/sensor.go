package controller

import (
	"EnvMonitoringDashboard/api_src/config"
	"EnvMonitoringDashboard/api_src/controller/args"
	"EnvMonitoringDashboard/api_src/logger"
	"EnvMonitoringDashboard/api_src/service"
	"EnvMonitoringDashboard/api_src/utils"
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type SensorAPI struct {
	config        *config.Config
	logger        *logger.Logger
	sensorService *service.SensorService
}

func NewSensorAPI(c *config.Config, l *logger.Logger, s *service.SensorService) *SensorAPI {
	return &SensorAPI{c, l, s}
}

// Get sensors godoc
//
//	@Summary	get sensors
//	@Tags		sensors
//	@Accept		json
//	@Produce	json
//	@Success	200	"return sensors by station_id"
//	@Router		/sensors [get]
func (api *SensorAPI) GetSensors(g *gin.Context) {
	log := api.logger.Sugar()
	defer log.Sync()
	c := WrapContext(g)
	var stationId *uint
	var offset *int
	var limit *int
	q := c.Request.URL.Query()
	if q.Has("station_id") {
		str := q.Get("station_id")
		num, err := strconv.Atoi(str)
		if err != nil {
			c.BadRequest(errors.New("invalid station_id"))
			return
		}
		*stationId = uint(num)
	}
	if q.Has("offset") {
		str := q.Get("offset")
		offsetV, _ := strconv.Atoi(str)
		offset = &offsetV
	}
	if q.Has("limit") {
		str := q.Get("limit")
		limitV, _ := strconv.Atoi(str)
		limit = &limitV
	}
	sensors, err, count := api.sensorService.Get(stationId, offset, limit)
	if err != nil {
		c.BadRequest(err)
	} else {
		c.Header(utils.XTotalCount, strconv.FormatInt(*count, 10))
		c.OK(sensors)
	}
}

// Upsert sensor godoc
//
//	@Summary	create sensor
//	@Tags		sensors
//	@Accept		json
//	@Produce	json
//	@Success	200	"return sensor"
//	@Router		/sensors [post]
func (api *SensorAPI) UpsertSensor(g *gin.Context) {
	log := api.logger.Sugar()
	defer log.Sync()
	c := WrapContext(g)
	body := args.SensorCreationArgs{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.BadRequest(err)
		return
	}
	position, _ := api.parsePosition(body.Position)
	sensor, err := api.sensorService.Upsert(&service.Sensor{
		Base: service.Base{
			ID: body.ID,
		},
		StationId: body.StationId,
		Position:  position,
		Tag:       body.Tag,
		Name:      body.Name,
		Group:     body.Group,
		Unit:      body.Unit,
	})
	if err != nil {
		c.BadRequest(err)
	} else {
		c.OK(sensor)
	}
}

func (api *SensorAPI) parsePosition(str string) (service.SensorPosition, bool) {
	c, ok := service.SensorPositionMap[strings.ToLower(str)]
	return c, ok
}
