# homebridge-web-thermostat

[![npm](https://img.shields.io/npm/v/homebridge-web-thermostat.svg)](https://www.npmjs.com/package/homebridge-web-thermostat) [![npm](https://img.shields.io/npm/dt/homebridge-web-thermostat.svg)](https://www.npmjs.com/package/homebridge-web-thermostat)

## Description

This [homebridge](https://github.com/nfarina/homebridge) plugin exposes a web-based thermostat to Apple's [HomeKit](http://www.apple.com/ios/home/). Using simple HTTP requests, the plugin allows you to set the thermostat mode and control the target temperature.

## Installation

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details)
2. Install this plugin: `npm install -g homebridge-web-thermostat`
3. Update your `config.json` file

## Configuration

```json
"accessories": [
     {
       "accessory": "Thermostat",
       "name": "Thermostat",
       "apiroute": "http://myurl.com"
     }
]
```

### Core
| Key | Description | Default |
| --- | --- | --- |
| `accessory` | Must be `Thermostat` | N/A |
| `name` | Name to appear in the Home app | N/A |
| `apiroute` | Root URL of your device | N/A |

### Optional fields
| Key | Description | Default |
| --- | --- | --- |
| `temperatureDisplayUnits` | Whether you want °C (`0`) or °F (`1`) as your units | `0` |
| `currentRelativeHumidity` | Whether to include `currentRelativeHumidity` as a field in `/status` | `false` |
| `maxTemp` | Upper bound for the temperature selector in the Home app | `30` |
| `minTemp` | Lower bound for the temperature selector in the Home app | `15` |
| `temperatureThresholds` | Whether you want the thermostat accessory to have heating and cooling temperature thresholds | `false` |

### Additional options
| Key | Description | Default |
| --- | --- | --- |
| `listener` | Whether to start a listener to get real-time changes from the device | `false` |
| `pollInterval` | Time (in seconds) between device polls | `300` |
| `timeout` | Time (in milliseconds) until the accessory will be marked as _Not Responding_ if it is unreachable | `3000` |
| `port` | Port for your HTTP listener (if enabled) | `2000` |
| `http_method` | HTTP method used to communicate with the device | `GET` |
| `username` | Username if HTTP authentication is enabled | N/A |
| `password` | Password if HTTP authentication is enabled | N/A |
| `model` | Appears under the _Model_ field for the accessory | plugin |
| `serial` | Appears under the _Serial_ field for the accessory | apiroute |
| `manufacturer` | Appears under the _Manufacturer_ field for the accessory | author |
| `firmware` | Appears under the _Firmware_ field for the accessory | version |

## API Interfacing

Your API should be able to:

1. Return JSON information when it receives `/status`:
```
{
    "targetHeatingCoolingState": INT_VALUE,
    "targetTemperature": INT_VALUE,
    "currentHeatingCoolingState": INT_VALUE,
    "currentTemperature": FLOAT_VALUE
}
```

**Note:** You must also include the following fields in `/status` if enabled in the `config.json`:

- `currentRelativeHumidity`
- `coolingThresholdTemperature` & `heatingThresholdTemperature`

2. Set `targetHeatingCoolingState` when it receives:
```
/targetHeatingCoolingState/INT_VALUE
```

3. Set `targetTemperature` when it receives:
```
/targetTemperature/INT_VALUE
```

4. _(if enabled)_ Set `coolingThresholdTemperature` when it receives:
```
/coolingThresholdTemperature/INT_VALUE
```

5. _(if enabled)_ `heatingThresholdTemperature` when it receives:
```
/heatingThresholdTemperature/INT_VALUE
```

### Optional (if listener is enabled)

1. Update `targetHeatingCoolingState` following a manual override by messaging the listen server:
```
/targetHeatingCoolingState/INT_VALUE
```

2. Update `targetTemperature` following a manual override by messaging the listen server:
```
/targetTemperature/INT_VALUE
```

3. _(if enabled)_ Update `coolingThresholdTemperature` following a manual override by messaging the listen server:
```
/coolingThresholdTemperature/INT_VALUE
```

4. _(if enabled)_ Update `heatingThresholdTemperature` following a manual override by messaging the listen server:
```
/heatingThresholdTemperature/INT_VALUE
```

## HeatingCoolingState Key

| Number | Name |
| --- | --- |
| `0` | Off |
| `1` | Heat |
| `2` | Cool |
| `3` | Auto |
