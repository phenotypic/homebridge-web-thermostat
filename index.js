var Service, Characteristic
const request = require('request')
const packageJson = require('./package.json')

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-web-thermostat', 'Thermostat', Thermostat)
}

function Thermostat (log, config) {
  this.log = log

  this.name = config.name
  this.apiroute = config.apiroute
  this.pollInterval = config.pollInterval || 60

  this.manufacturer = config.manufacturer || packageJson.author.name
  this.serial = config.serial || this.apiroute
  this.model = config.model || packageJson.name
  this.firmware = config.firmware || packageJson.version

  this.username = config.username || null
  this.password = config.password || null
  this.timeout = config.timeout || 3000
  this.http_method = config.http_method || 'GET'

  this.temperatureThresholds = config.temperatureThresholds || false
  this.coolingThresholdTemperature = config.coolingThresholdTemperature || 30
  this.heatingThresholdTemperature = config.heatingThresholdTemperature || 20

  this.currentRelativeHumidity = config.currentRelativeHumidity || false
  this.temperatureDisplayUnits = config.temperatureDisplayUnits || 0
  this.maxTemp = config.maxTemp || 30
  this.minTemp = config.minTemp || 15

  if (this.username != null && this.password != null) {
    this.auth = {
      user: this.username,
      pass: this.password
    }
  }

  this.log('%s initialized', this.name)

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
    this.log('[+] Getting status: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('[!] Error getting status: %s', error.message)
        this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(new Error('Polling failed'))
        callback(error)
      } else {
        this.log('[*] Thermostat response: %s', responseBody)
        var json = JSON.parse(responseBody)
        this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(json.targetTemperature)
        this.log('[*] Updated TargetTemperature: %s', json.targetTemperature)
        this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(json.currentTemperature)
        this.log('[*] Updated CurrentTemperature: %s', json.currentTemperature)
        this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(json.targetHeatingCoolingState)
        this.log('[*] Updated TargetHeatingCoolingState: %s', json.targetHeatingCoolingState)
        this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(json.currentHeatingCoolingState)
        this.log('[*] Updated CurrentHeatingCoolingState: %s', json.currentHeatingCoolingState)
        if (this.temperatureThresholds) {
          this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(json.coolingThresholdTemperature)
          this.log('[*] Updated CoolingThresholdTemperature: %s', json.coolingThresholdTemperature)
          this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(json.heatingThresholdTemperature)
          this.log('[*] Updated HeatingThresholdTemperature: %s', json.heatingThresholdTemperature)
        }
        if (this.currentRelativeHumidity) {
          this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(json.currentRelativeHumidity)
          this.log('[*] Updated CurrentRelativeHumidity: %s', json.currentRelativeHumidity)
        }
        callback()
      }
    }.bind(this))
  },

  setTargetHeatingCoolingState: function (value, callback) {
    var url = this.apiroute + '/targetHeatingCoolingState/' + value
    this.log('[+] Setting targetHeatingCoolingState: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('[!] Error setting targetHeatingCoolingState: %s', error.message)
        callback(error)
      } else {
        this.log('[*] Successfully set targetHeatingCoolingState to: %s', value)
        this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(value)
        callback()
      }
    }.bind(this))
  },

  setTargetTemperature: function (value, callback) {
    var url = this.apiroute + '/targetTemperature/' + value
    this.log('[+] Setting targetTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('[!] Error setting targetTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('[*] Successfully set targetTemperature to: %s', value)
        callback()
      }
    }.bind(this))
  },

  setCoolingThresholdTemperature: function (value, callback) {
    var url = this.apiroute + '/coolingThresholdTemperature/' + value
    this.log('[+] Setting coolingThresholdTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('[!] Error setting coolingThresholdTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('[*] Successfully set coolingThresholdTemperature to: %s', value)
        callback()
      }
    }.bind(this))
  },

  setHeatingThresholdTemperature: function (value, callback) {
    var url = this.apiroute + '/heatingThresholdTemperature/' + value
    this.log('[+] Setting heatingThresholdTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('[!] Error setting heatingThresholdTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('[*] Successfully set heatingThresholdTemperature to: %s', value)
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

    this.service
      .getCharacteristic(Characteristic.TargetTemperature)
      .on('set', this.setTargetTemperature.bind(this))

    this.service.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100,
        maxValue: 100,
        minStep: 0.1
      })

    this.service.getCharacteristic(Characteristic.TargetTemperature)
      .setProps({
        minValue: this.minTemp,
        maxValue: this.maxTemp,
        minStep: 1
      })

    if (this.temperatureThresholds) {
      this.service
        .getCharacteristic(Characteristic.CoolingThresholdTemperature)
        .on('set', this.setCoolingThresholdTemperature.bind(this))
      this.service
        .getCharacteristic(Characteristic.HeatingThresholdTemperature)
        .on('set', this.setHeatingThresholdTemperature.bind(this))
    }

    this._getStatus(function () {})

    setInterval(function () {
      this._getStatus(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [this.informationService, this.service]
  }
}
