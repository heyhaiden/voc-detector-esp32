// http_client.cpp
#include "http_client.h"
#include "secrets.h"  
#include <ArduinoJson.h>

WebServerModule::WebServerModule(uint16_t port)
 : _server(port) {}

void WebServerModule::begin() {
  // serve static HTML+JS
  _server.on("/", std::bind(&WebServerModule::handleRoot, this));
  // JSON data endpoint
  _server.on("/data", HTTP_GET, std::bind(&WebServerModule::handleData, this));
  _server.begin();
  Serial.println("HTTP server started on port 80");
}

void WebServerModule::attachSensor(Sensor* sensorPtr) {
  _sensor = sensorPtr;
}

void WebServerModule::handleClient() {
  _server.handleClient();
}

void WebServerModule::handleRoot() {
  const char* page = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Breathalyzer MVP</title>
</head>
<body>
  <h1>Halitosis Reader</h1>
  <button onclick="fetchData()">Get Reading</button>
  <pre id="output">Press the button to start.</pre>
  <script>
    async function fetchData() {
      document.getElementById('output').textContent = 'Sampling…';
      const resp = await fetch('/data');
      const json = await resp.json();
      document.getElementById('output').innerHTML =
        `Temp: ${json.temperature.toFixed(1)}&deg;C<br>` +
        `Humidity: ${json.humidity.toFixed(1)}%RH<br>` +
        `Pressure: ${json.pressure.toFixed(1)} hPa<br>` +
        `VOC: ${json.voc.toFixed(1)} k&Omega;<br>` +
        `VOC (smoothed): ${json.vocSmooth.toFixed(1)} k&Omega;`;
    }
  </script>
</body>
</html>
  )rawliteral";

  // Ensure HTTP header specifies UTF-8
  _server.sendHeader("Content-Type", "text/html; charset=utf-8");
  _server.send(200, "text/html; charset=utf-8", page);
}


void WebServerModule::handleData() {
  if (!_sensor) {
    _server.send(500, "application/json", "{\"error\":\"No sensor attached\"}");
    return;
  }
  auto r = _sensor->takeReading();
  StaticJsonDocument<200> doc;
  doc["temperature"] = r.temperature;
  doc["humidity"]    = r.humidity;
  doc["pressure"]    = r.pressure;
  doc["voc"]         = r.voc;
  doc["vocSmooth"]   = r.vocSmooth;

  String out;
  serializeJson(doc, out);
  _server.send(200, "application/json", out);
}
