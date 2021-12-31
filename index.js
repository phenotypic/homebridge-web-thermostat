var Service, Characteristic
const packageJson = require('./package.json')
const request = require('request')
const ip = require('ip')
const http = require('http')

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-web-thermostat', 'Thermostat', Thermostat)
}

function Thermostat (log, config) {
  this.log = log

  this.name = config.name
  this.apiroute = config.apiroute
  this.pollInterval = config.pollInterval || 300
  this.validStates = config.validStates || [0, 1, 2, 3]

  this.listener = config.listener || false
  this.port = config.port || 2000
  this.checkupDelay = config.checkupDelay || 2000
  this.requestArray = ['targetHeatingCoolingState', 'targetTemperature', 'coolingThresholdTemperature', 'heatingThresholdTemperature']

  this.manufacturer = config.manufacturer || packageJson.author
  this.serial = config.serial || this.apiroute
  this.model = config.model || packageJson.name
  this.firmware = config.firmware || packageJson.version

  this.username = config.username || null
  this.password = config.password || null
  this.timeout = config.timeout || 3000
  this.http_method = config.http_method || 'GET'

  this.temperatureThresholds = config.temperatureThresholds || false
  this.heatOnly = config.heatOnly || false

  this.currentRelativeHumidity = config.currentRelativeHumidity || false
  this.temperatureDisplayUnits = config.temperatureDisplayUnits || 0
  this.maxTemp = config.maxTemp || 30
  this.minTemp = config.minTemp || 15
  this.minStep = config.minStep || 0.5

  if (this.username != null && this.password != null) {
    this.auth = {
      user: this.username,
      pass: this.password
    }
  }

  if (this.listener) {
    this.server = http.createServer(function (request, response) {
      var baseURL = 'http://' + request.headers.host + '/'
      var url = new URL(request.url, baseURL)
      if (this.requestArray.includes(url.pathname.substr(1))) {
        this.log.debug('Handling request')
        response.end('Handling request')
        this._httpHandler(url.pathname.substr(1), url.searchParams.get('value'))
      } else {
        this.log.warn('Invalid request: %s', request.url)
        response.end('Invalid request')
      }
    }.bind(this))

    this.server.listen(this.port, function () {
      this.log('Listen server: http://%s:%s', ip.address(), this.port)
    }.bind(this))
  }

  this.service = new Service.Thermostat(this.name)
}

Thermostat.prototype = {

  identify: function (callback) {
    this.log('Identify requested!')
    callback()
  },

  _httpRequest: function (url, body, method, callback) {
    request({
      url: url,
      body: body,
      method: this.http_method,
      timeout: this.timeout,
      rejectUnauthorized: false,
      auth: this.auth
    },
    function (error, response, body) {
      callback(error, response, body)
    })
  },

  _getStatus: function (callback) {
    var url = this.apiroute + '/status'
    this.log.debug('Getting status: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error getting status: %s', error.message)
        this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(new Error('Polling failed'))
        callback(error)
      } else {
        this.log.debug('Device response: %s', responseBody)
        var json = JSON.parse(responseBody)
        this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(json.targetTemperature)
        this.log.debug('Updated TargetTemperature to: %s', json.targetTemperature)
        this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(json.currentTemperature)
        this.log.debug('Updated CurrentTemperature to: %s', json.currentTemperature)
        this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(json.targetHeatingCoolingState)
        this.log.debug('Updated TargetHeatingCoolingState to: %s', json.targetHeatingCoolingState)
        this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(json.currentHeatingCoolingState)
        this.log.debug('Updated CurrentHeatingCoolingState to: %s', json.currentHeatingCoolingState)
        if (this.temperatureThresholds) {
          this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(json.coolingThresholdTemperature)
          this.log.debug('Updated CoolingThresholdTemperature to: %s', json.coolingThresholdTemperature)
          this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(json.heatingThresholdTemperature)
          this.log.debug('Updated HeatingThresholdTemperature to: %s', json.heatingThresholdTemperature)
        }
        if (this.currentRelativeHumidity) {
          this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(json.currentRelativeHumidity)
          this.log.debug('Updated CurrentRelativeHumidity to: %s', json.currentRelativeHumidity)
        }
        callback()
      }
    }.bind(this))
  },

  _httpHandler: function (characteristic, value) {
    switch (characteristic) {
      case 'targetHeatingCoolingState':
        this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'targetTemperature':
        this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'coolingThresholdTemperature':
        this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'heatingThresholdTemperature':
        this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      default:
        this.log.warn('Unknown characteristic "%s" with value "%s"', characteristic, value)
    }
  },

  setTargetHeatingCoolingState: function (value, callback) {
    var url = this.apiroute + '/targetHeatingCoolingState?value=' + value
    this.log.debug('Setting targetHeatingCoolingState: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting targetHeatingCoolingState: %s', error.message)
        callback(error)
      } else {
        this.log('Set targetHeatingCoolingState to: %s', value)
        setTimeout(function() {
          this._getStatus(function () {})
        }.bind(this), this.checkupDelay)
        callback()
      }
    }.bind(this))
  },

  setTargetTemperature: function (value, callback) {
    value = value.toFixed(1)
    var url = this.apiroute + '/targetTemperature?value=' + value
    this.log.debug('Setting targetTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting targetTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('Set targetTemperature to: %s', value)
        callback()
      }
    }.bind(this))
  },

  setCoolingThresholdTemperature: function (value, callback) {
    value = value.toFixed(1)
    var url = this.apiroute + '/coolingThresholdTemperature?value=' + value
    this.log.debug('Setting coolingThresholdTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting coolingThresholdTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('Set coolingThresholdTemperature to: %s', value)
        callback()
      }
    }.bind(this))
  },

  setHeatingThresholdTemperature: function (value, callback) {
    value = value.toFixed(1)
    var url = this.apiroute + '/heatingThresholdTemperature?value=' + value
    this.log.debug('Setting heatingThresholdTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting heatingThresholdTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('Set heatingThresholdTemperature to: %s', value)
        callback()
      }
    }.bind(this))
  },

  getServices: function () {
    this.informationService = new Service.AccessoryInformation()
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)

    this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(this.temperatureDisplayUnits)

    this.service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('set', this.setTargetHeatingCoolingState.bind(this))

    this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .setProps({
        validValues: this.validStates
      })

    this.service
      .getCharacteristic(Characteristic.TargetTemperature)
      .on('set', this.setTargetTemperature.bind(this))
      .setProps({
        minValue: this.minTemp,
        maxValue: this.maxTemp,
        minStep: this.minStep
      })

    this.service
      .getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -600,
        maxValue: 600
      });

    if (this.temperatureThresholds) {
      this.service
        .getCharacteristic(Characteristic.CoolingThresholdTemperature)
        .on('set', this.setCoolingThresholdTemperature.bind(this))
        .setProps({
          minValue: this.minTemp,
          maxValue: this.maxTemp,
          minStep: this.minStep
        })

      this.service
        .getCharacteristic(Characteristic.HeatingThresholdTemperature)
        .on('set', this.setHeatingThresholdTemperature.bind(this))
        .setProps({
          minValue: this.minTemp,
          maxValue: this.maxTemp,
          minStep: this.minStep
        })
    }

    this._getStatus(function () {})

    setInterval(function () {
      this._getStatus(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [this.informationService, this.service]
  }
}
