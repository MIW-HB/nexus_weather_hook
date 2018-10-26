# Blackout Nexus hooks a Weather extent

![Blackout logo](https://blackout.ai/img/logo/logo.png)

|Author|Email|Latest version|State|
|---|---|---|---|
|Michael Weniger|info@mweniger.de|0.0.1|`BETA`

## Hook integration
See: https://github.com/Blackout-Technologies/nexus-hook

## Bauernregeln:
https://www.wetter.de/bauernregeln

https://www.spruecheportal.de/bauernweisheiten.php

### Prepare training function
```JavaScript
const Hook = require('nexus-hook').TestHook;

console.log("=== Testing WeatherHook ===");

$intent = "aktuelles_wetter";
//$intent = "wetter_morgen";
//$intent = "wetter_wochenende";
//$intent = "wetter_vorhersage";


setTimeout(() => {
    var myHook = new Hook("./", "de");
    myHook.chat($intent, "Wie wirds denn?", (resp) => {
        console.log(resp.answer);
    });
}, 10);
```

Enjoy!