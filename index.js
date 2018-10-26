/**
 *  @author Michael Weniger
 *  @copyright Michael Weniger
 *  @version 0.2.0
 *  @summary gets weather-data from OpenWeatherMap regarding actual local weather and forecasts. Context-sensitive country lores are possible.
 * 
 * Use Strict mode ECMA Script 5+
 */
"use_strict";

const Hook = require('./lib/hook.js');
const TestHook = require('./lib/hookTest.js');
const Cache = require('./lib/cache.js');

const API_URL = "https://api.openweathermap.org";
const API_KEY = "<API_KEY>";
const API_WEATHER_PATH = "/data/2.5/weather";
const API_FORECAST_PATH = "/data/2.5/forecast";
const API_LOCAL_CITY_ID = "2944388";
const API_LOCAL_CITY_NAME = "Bremen";
const API_UNITS = "metric";
const API_LANGUAGE = "de";
const API_CACHE_LIFETIME = 600;

// Generate the Public API of the Ophion System
module.exports = {
    Hook,
    TestHook
};
module.exports = class WeatherHook extends Hook {
    /**
     *  @param {Object} intent Object with .name and .confidence
     *  @param {String} text Original phrasing of the user
     *  @param {Callback} complete Completion callback to continue dialog
     */

    process(text, intent, session, complete) {
        this.cache = new Cache();
        this.final_callback = complete;

        // store current month
        this.month = new Date().getMonth() + 1;
        this.daytime = new Date().getHours();

        //Parse Intents
        switch(intent.toLocaleLowerCase()){
            case "wetter_aktuell":    this.getActWeather((resp) => { this.finish(resp); }); break;
            case "wetter_vorhersage": this.getForecast((resp) => { this.finish(resp); });   break;
            default: response = this.getLore();
        }
    }

    /**
     * 
     * @param {String} text 
     * passes the final result back to nexus-AI
     */
    finish(text) {
        this.final_callback( {answer: text, platform:{} } );
    }

    /**
     * @param {Function}
     * @callback {String}
     * get current local weather and return nl-response
     */
    getActWeather(callback) {
        var text = "";
        var weather = "";

        this.callAPI((data) => {
            callback(this.evaluate_weather(data.act));
        });
    }
    
    /**
     * callAPI
     * @param {Function} callback
     * @return {json} 
     * 
     * gets actual data and forecast
     * from cache or Web-API
     * 
     */
    callAPI(callback) {
        var act_data = this.cache.get('act_weater');
        var fc_data = this.cache.get('forecast');

        if(!act_data || this.cache.isAlive()) {
            var url_act = API_URL+API_WEATHER_PATH+"?id="+API_LOCAL_CITY_ID+"&APPID="+API_KEY+"&units="+API_UNITS+"&lang="+API_LANGUAGE;
            var url_forecast = API_URL+API_FORECAST_PATH+"?id="+API_LOCAL_CITY_ID+"&APPID="+API_KEY+"&units="+API_UNITS+"&lang="+API_LANGUAGE;
            this.request("GET", url_act, {}, (data) => {
                act_data = data;
                this.cache.set('act_weather', data);
                this.request("GET", url_forecast, {}, (data) => {
                    fc_data = data;
                    this.cache.set('forecast', data);
                    this.cache.setAlive((new Date().getTime()/1000)+API_CACHE_LIFETIME);    
                    callback({"act": act_data, "forecast": fc_data});
                })
            });
        } else {
            callback({"act": act_data, "forecast": fc_data});
        }
    }

     /**
     * @param {Function}
     * @callback {String}
     * get 5 day forecast and return nl-response
     */
    getForecast(callback) {
        var text = "";

        this.callAPI((data) => {
            callback(this.evaluate_forecast(data.forecast));
        });
    }

    /**
     * @param {Function} 
     * @callback {String}
     * pics random common Lore (if applicable date-sensitive)
     */
    getLore (callback) {
        callback(this.Lore(this.getRandBool()));
    }

    evaluate_weather(data) {
        var temperature = data.main.temp;
        var humidity = data.main.humidity;
        var wind = this.evaluate_wind(data.wind);
        var city = API_LOCAL_CITY_NAME;

        var text = this.captions.get('answer_temp');
        text = text.replace("$city", city);
        text = text.replace("$temperature", Math.round(temperature));
        text = text.replace("$windintensity", wind.strength[2]);
        text = text.replace("$winddirection", wind.direction[0]);      

        for(var id in data.weather) { text += " " + data.weather[id].description + "."; }

        text += " "+this.evaluate_temperature(temperature);

        return text;
    }

    evaluate_forecast(data) {
        var indices = {"oneday": 5, "twoday": 13, "fiveday": 39};
        var text = {};
        var act_temp = 0;

        for(var index in indices) {
            var atmos = "";
            var tmp_diff = "";
            var weather = data.list[indices[index]];
            var temp = Math.round(weather.main.temp);            
            if(index == "oneday") act_temp = temp;
            if(index == "fiveday") {
                if(temp > (act_temp + 6)) tmp_diff = "viel wärmer";
                else if(temp > (act_temp + 2)) tmp_diff = "etwas wärmer";
                else if(temp < (act_temp - 2)) tmp_diff = "etwas kälter";
                else if(temp < (act_temp - 6)) tmp_diff = "viel kälter";
                else tmp_diff = "unverändert";
            }
            text[index] = this.captions.get('forecast')[index];
            var wind = this.evaluate_wind(weather.wind.speed, weather.wind.deg);
            for(var i in weather.weather) { atmos += " "+weather.weather[i].description; }
            text[index] = text[index].replace('$temperature', temp);
            text[index] = text[index].replace('$atmos', atmos);
            text[index] = text[index].replace('$tempdiff', tmp_diff);
        }
        var tmp = Object.values(text).join(" ");
        return tmp;
    }

    evaluate_temperature(temp) {
        var caps = null;
        var result = "";
        var standard = this.captions.get("Normals").temperature[this.month];

        if (temp < (standard.min / 1.5)) caps = this.captions.get('answer_freezy');
        else if (temp < standard.min) caps = this.captions.get("answer_cold");
        else if (temp > (standard.max * 1.5)) caps = this.captions.get("answer_hot");
        else if (temp > standard.max) caps = this.captions.get("answer_warm");
        else caps = this.captions.get("answer_neutral");

        result = this.get_text(caps);

        return result;

    }

    evaluate_wind(wind) {
        var strength = "";
        var direction = "";
        
        var bft_names = this.captions.get("wind");

        for(var entry in bft_names) {
            if(wind.speed >= bft_names[entry][0]) strength = bft_names[entry];
        }

        direction = this.translate_direction(wind.deg);

        return {
            "strength": strength,
            "direction": direction
        }
    }

    translate_direction(deg) {
        var dir = "";
        // in 45 deg steps
        if(deg >= 0 && deg <=22.5) dir = this.captions.get("directions").N;
        else if(deg > 22.5 && deg <= 57.5) dir = this.captions.get("directions").NE;
        else if(deg > 57.5 && deg <= 102.5) dir = this.captions.get("directions").E;
        else if(deg > 102.5 && deg <= 147.5) dir = this.captions.get("directions").SE;
        else if(deg > 147.5 && deg <= 192.5) dir = this.captions.get("directions").S;
        else if(deg > 192.5 && deg <= 237.5) dir = this.captions.get("directions").SW;
        else if(deg > 237.5 && deg <= 282.5) dir = this.captions.get("directions").W;
        else if(deg > 282.5 && deg <= 327.5) dir = this.captions.get("directions").NW;
        else if(deg > 327.5) dir = this.captions.get("directions").N; 
        return dir;
    }

    evaluate_humidity(humidity) {
        var standard = this.captions.get("humidity");

    }

    evaluate_rain(data) {

    }

    get_text(dictItem) {
        var result = null;
        if(dictItem.length > 1) {
            result = dictItem[Math.random() * (dictItem.length -1)];
        } else {
            result = dictItem[0];
        }
        return result;
    }
}