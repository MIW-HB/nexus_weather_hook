// Test implementation
const Hook = require('nexus-hook').TestHook;

console.log("=== Testing WeatherHook ===");


$intent = "wetter_aktuell";
//$intent = "wetter_vorhersage";

setTimeout(() => {
    var myHook = new Hook("de-DE");

    myHook.chat("Wie ist das Wetter in Bremen", $intent, [], (resp) => {
        console.log(resp.answer);
    });
}, 100);
