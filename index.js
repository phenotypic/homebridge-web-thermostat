var Service, Characteristic;
var request = require('request');

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-web-thermostat', 'Thermostat', Thermostat);
};

function Thermostat(log, config) {
  this.log = log;

  this.name = config.name;
  this.apiroute = config.apiroute;
  this.pollInterval = config.pollInterval || 60;

  this.manufacturer = config.manufacturer || 'Tom Rodrigues';
  this.serial = config.serial || this.apiroute;
  this.model = config.model || 'homebridge-web-thermostat';

  this.username = config.username || null;
  this.password = config.password || null;
  this.timeout = config.timeout || 3000;
  this.http_method = config.http_method || 'GET';

  this.temperatureThresholds = config.temperatureThresholds || false;
  this.coolingThresholdTemperature = config.coolingThresholdTemperature || 30;
  this.heatingThresholdTemperature = config.heatingThresholdTemperature || 20;

  this.currentRelativeHumidity = config.currentRelativeHumidity || false;
  this.temperatureDisplayUnits = config.temperatureDisplayUnits || 0;
  this.maxTemp = config.maxTemp || 30;
  this.minTemp = config.minTemp || 15;

  if (this.username != null && this.password != null) {
    this.auth = {
      user: this.username,
      pass: this.password
    };
  }

  this.log(this.name, this.apiroute);

  this.service = new Service.Thermostat(this.name);
}

Thermostat.prototype = {

  identify: function(callback) {
    this.log('Identify requested!');
    callback();
  },

  _httpRequest: function(url, body, method, callback) {
    request({
        url: url,
        body: body,
        method: this.http_method,
        timeout: this.timeout,
        rejectUnauthorized: false,
        auth: this.auth
      },
      function(error, response, body) {
        callback(error, response, body);
      });
  },

  _getStatus: function(callback) {
    var url = this.apiroute + '/status';
    this.log('[+] Getting status:', url);

    this._httpRequest(url, '', this.http_method, function(error, response, responseBody) {
      if (error) {
        this.log('[!] Error getting status: %s', error.message);
        callback(error);
      } else {
        this.log('[*] Thermostat response:', responseBody);
        var json = JSON.parse(responseBody);
        this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(json.targetTemperature);
        this.log('[*] Updated TargetTemperature:', json.targetTemperature);
        this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(json.currentTemperature);
        this.log('[*] Updated CurrentTemperature:', json.currentTemperature);
        this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(json.targetHeatingCoolingState);
        this.log('[*] Updated TargetHeatingCoolingState:', json.targetHeatingCoolingState);
        this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(json.currentHeatingCoolingState);
        this.log('[*] Updated CurrentHeatingCoolingState:', json.currentHeatingCoolingState);
        if (this.temperatureThresholds) {
          this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(json.coolingThresholdTemperature);
          this.log('[*] Updated CoolingThresholdTemperature:', json.coolingThresholdTemperature);
          this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(json.heatingThresholdTemperature);
          this.log('[*] Updated HeatingThresholdTemperature:', json.heatingThresholdTemperature);
        }
        if (this.currentRelativeHumidity) {
          this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(json.currentRelativeHumidity);
          this.log('[*] Updated CurrentRelativeHumidity:', json.currentRelativeHumidity);
        }
        callback();
      }
    }.bind(this));
  },

  setTargetHeatingCoolingState: function(value, callback) {
    url = this.apiroute + '/targetHeatingCoolingState/' + value;
    this.log('[+] Setting targetHeatingCoolingState:', url);

    this._httpRequest(url, '', this.http_method, function(error, response, responseBody) {
      if (error) {
        this.log('[!] Error setting targetHeatingCoolingState: %s', error.message);
        callback(error);
      } else {
        this.log('[*] Sucessfully set targetHeatingCoolingState to:', value);
        this.service.setCharacteristic(Characteristic.CurrentHeatingCoolingState, value);
        callback();
      }
    }.bind(this));
  },

  setTargetTemperature: function(value, callback) {
    var url = this.apiroute + '/targetTemperature/' + value;
    this.log('[+] Setting targetTemperature:', url);

    this._httpRequest(url, '', this.http_method, function(error, response, responseBody) {
      if (error) {
        this.log('[!] Error setting targetTemperature', error.message);
        callback(error);
      } else {
        this.log('[*] Sucessfully set targetTemperature to:', value);
        callback();
      }
    }.bind(this));
  },

  setCoolingThresholdTemperature: function(value, callback) {
    var url = this.apiroute + '/coolingThresholdTemperature/' + value;
    this.log('[+] Setting coolingThresholdTemperature:', url);

    this._httpRequest(url, '', this.http_method, function(error, response, responseBody) {
      if (error) {
        this.log('[!] Error setting coolingThresholdTemperature', error.message);
        callback(error);
      } else {
        this.log('[*] Sucessfully set coolingThresholdTemperature to:', value);
        callback();
      }
    }.bind(this));
  },

  setHeatingThresholdTemperature: function(value, callback) {
    var url = this.apiroute + '/heatingThresholdTemperature/' + value;
    this.log('[+] Setting heatingThresholdTemperature:', url);

    this._httpRequest(url, '', this.http_method, function(error, response, responseBody) {
      if (error) {
        this.log('[!] Error setting heatingThresholdTemperature', error.message);
        callback(error);
      } else {
        this.log('[*] Sucessfully set heatingThresholdTemperature to:', value);
        callback();
      }
    }.bind(this));
  },

  getServices: function() {

    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial);

    this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(this.temperatureDisplayUnits);

    this.service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('set', this.setTargetHeatingCoolingState.bind(this));

    this.service
      .getCharacteristic(Characteristic.TargetTemperature)
      .on('set', this.setTargetTemperature.bind(this));

    this.service.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100,
        maxValue: 100,
        minStep: 1
      });

    this.service.getCharacteristic(Characteristic.TargetTemperature)
      .setProps({
        minValue: this.minTemp,
        maxValue: this.maxTemp,
        minStep: 1
      });

    if (this.temperatureThresholds) {
      this.service
        .getCharacteristic(Characteristic.CoolingThresholdTemperature)
        .on('set', this.setCoolingThresholdTemperature.bind(this));
      this.service
        .getCharacteristic(Characteristic.HeatingThresholdTemperature)
        .on('set', this.setHeatingThresholdTemperature.bind(this));
    }

    this._getStatus(function() {}.bind(this));

    setInterval(function() {
      this._getStatus(function() {}.bind(this));
    }.bind(this), this.pollInterval * 1000);

    return [this.informationService, this.service];
  }
};
