# BreathBuddy 🌬️

A gamified bad breath detector using BME680 VOC sensor with ESP8266/ESP32 microcontrollers and a companion web app. Measure your breath quality, track improvements over time, and unlock achievements!

## 📋 Table of Contents

- [Overview](#overview)
- [Hardware Requirements](#hardware-requirements)
- [Wiring Guide](#wiring-guide)
- [Software Setup](#software-setup)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

BreathBuddy uses the **BME680** environmental sensor to measure:
- **IAQ (Indoor Air Quality)** - Overall breath quality score (0-500)
- **CO₂ Equivalent** - Estimated CO₂ levels in ppm
- **VOC Equivalent** - Volatile organic compounds in ppm
- **Temperature, Humidity, Pressure** - Environmental conditions
- **Gas Resistance** - Raw sensor resistance (kΩ)

The system supports two microcontroller platforms:
| Platform | Protocol | Features |
|----------|----------|----------|
| **ESP32** (Recommended) | WebSocket | BSEC library, persistent calibration, button + buzzer |
| **ESP8266** | HTTP REST | Basic readings, EMA smoothing |

---

## Hardware Requirements

### Components

| Component | Qty | Notes |
|-----------|-----|-------|
| ESP32 DevKit or ESP8266 NodeMCU | 1 | ESP32 recommended for BSEC support |
| BME680 Breakout Board | 1 | I²C interface (Adafruit, Pimoroni, or generic) |
| Tactile Push Button | 1 | ESP32 only - for triggering readings |
| Piezo Buzzer (Active) | 1 | ESP32 only - for audio feedback |
| Jumper Wires | ~8 | Male-to-female recommended |
| Breadboard | 1 | Optional, for prototyping |

### BME680 Sensor Pinout

The BME680 uses I²C communication. Common breakout boards have these pins:

| Pin | Description |
|-----|-------------|
| VCC / VIN | Power (3.3V) |
| GND | Ground |
| SDA | I²C Data |
| SCL | I²C Clock |
| SDO | I²C Address Select (GND = 0x76, VCC = 0x77) |
| CS | SPI Chip Select (leave unconnected for I²C) |

---

## Wiring Guide

### ESP32 Wiring (Recommended)

```
BME680          ESP32
───────         ─────
VCC  ───────→  3.3V
GND  ───────→  GND
SDA  ───────→  GPIO 21 (I²C SDA)
SCL  ───────→  GPIO 22 (I²C SCL)
SDO  ───────→  GND (for address 0x76)

Button          ESP32
──────          ─────
Pin 1 ───────→  GPIO 33
Pin 2 ───────→  GND

Buzzer          ESP32
──────          ─────
+ (Red) ─────→  GPIO 27
- (Black) ───→  GND
```

**Schematic Diagram (ESP32):**
```
                    ┌─────────────────┐
                    │     ESP32       │
                    │                 │
    BME680          │   3.3V ←───────┼──── VCC
    ┌─────┐         │    GND ←───────┼──── GND
    │ VCC ├─────────┤  GPIO21 (SDA)──┼──── SDA
    │ GND ├─────────┤  GPIO22 (SCL)──┼──── SCL
    │ SDA ├─────────┤                │
    │ SCL ├─────────┤  GPIO33 ←──────┼──── Button ──→ GND
    │ SDO ├────→GND │  GPIO27 ───────┼──── Buzzer+ ──→ Buzzer- ──→ GND
    └─────┘         │                │
                    └─────────────────┘
```

### ESP8266 Wiring

```
BME680          ESP8266 NodeMCU
───────         ───────────────
VCC  ───────→  3.3V
GND  ───────→  GND
SDA  ───────→  GPIO 4 (D2)
SCL  ───────→  GPIO 5 (D1)
SDO  ───────→  GND (for address 0x76)
```

**Schematic Diagram (ESP8266):**
```
                    ┌─────────────────┐
                    │  ESP8266        │
                    │  NodeMCU        │
    BME680          │                 │
    ┌─────┐         │   3.3V ←───────┼──── VCC
    │ VCC ├─────────┤    GND ←───────┼──── GND  
    │ GND ├─────────┤  GPIO4 (D2)────┼──── SDA
    │ SDA ├─────────┤  GPIO5 (D1)────┼──── SCL
    │ SCL ├─────────┤                │
    │ SDO ├────→GND │                │
    └─────┘         └─────────────────┘
```

---

## Software Setup

### Prerequisites

1. **Arduino IDE** (v2.x recommended) or **PlatformIO**
2. **Required Libraries** (install via Library Manager):
   - `Adafruit BME680 Library`
   - `ArduinoJson` (v6.x)
   - **ESP32 Only:**
     - `BSEC Software Library` by Bosch
     - `WebSockets_Generic`
   - **ESP8266 Only:**
     - `ESP8266WiFi` (bundled with ESP8266 core)
     - `ESP8266WebServer` (bundled with ESP8266 core)

3. **Board Support:**
   - ESP32: Add `https://dl.espressif.com/dl/package_esp32_index.json` to Board Manager URLs
   - ESP8266: Add `http://arduino.esp8266.com/stable/package_esp8266com_index.json`

### Configuration

1. **Create `secrets.h`** in the appropriate folder (`ESP32/` or `ESP8266/`):

```cpp
#pragma once
#define WIFI_SSID "YourNetworkName"
#define WIFI_PASS "YourPassword"
```

2. **Verify I²C Address** - If sensor isn't detected, try changing address:
   - `0x76` - SDO pin connected to GND (default)
   - `0x77` - SDO pin connected to VCC

### Uploading Firmware

**For ESP32:**
```bash
# Select Board: ESP32 Dev Module
# Upload Speed: 115200
# Flash Frequency: 80MHz
```
Upload `ESP32/esp32-final-program.ino`

**For ESP8266:**
```bash
# Select Board: NodeMCU 1.0 (ESP-12E Module)
# Upload Speed: 115200
```
Upload `ESP8266/bad-breadth.ino`

### Web App Setup (Optional)

The companion Next.js app provides a modern dashboard interface:

```bash
cd breathalyzer-app
pnpm install     # or npm install
pnpm dev         # Start dev server at http://localhost:3000
```

**Important:** Update the WebSocket URL in `components/websocket-provider.tsx`:
```typescript
const ws = new WebSocket('ws://YOUR_ESP32_IP:8080/')
```

To find your ESP32's IP address, check the Serial Monitor after boot.

---

## Usage

### ESP32 (WebSocket Mode)

1. **Power on** the device and wait for Wi-Fi connection (check Serial Monitor)
2. **Note the IP address** displayed in Serial Monitor
3. **Start a test:**
   - Press the **physical button** on GPIO 33, OR
   - Send `"start"` command via WebSocket, OR
   - Click "Start Test" in the web app
4. **Follow the countdown** (3-2-1 beeps from buzzer)
5. **Blow on the sensor** for 10 seconds
6. **View results** via WebSocket or Serial Monitor

**WebSocket Response Format:**
```json
{
  "iaq": 75.5,
  "co2_eq": 650.2,
  "voc_eq": 1.25,
  "temp": 24.5,
  "hum": 45.2,
  "pres": 1013.25,
  "gas_kOhm": 125.5
}
```

### ESP8266 (HTTP Mode)

1. **Power on** and connect to Wi-Fi
2. **Navigate** to `http://YOUR_ESP8266_IP/` in a browser
3. **Click "Get Reading"** button to sample
4. **View JSON data** at `http://YOUR_ESP8266_IP/data`

**HTTP Response Format:**
```json
{
  "temperature": 24.5,
  "humidity": 45.2,
  "pressure": 1013.25,
  "voc": 125.5,
  "vocSmooth": 118.3
}
```

### IAQ Score Interpretation

| IAQ Range | Rating | Meaning |
|-----------|--------|---------|
| 0-50 | 🎉 Excellent | Fresh breath! |
| 51-100 | 👍 Good | Normal, healthy |
| 101-150 | ⚠️ Moderate | Slight odor detected |
| 151-200 | 😷 Poor | Noticeable bad breath |
| 200+ | ⛔ Very Poor | Strong halitosis |

---

## API Reference

### ESP32 WebSocket API (Port 8080)

| Command | Response | Description |
|---------|----------|-------------|
| Connect to `ws://IP:8080/` | `"Connected to ESP32 BSEC server"` | Initial connection |
| Send `"start"` | JSON payload after 13s | Triggers 3-2-1 countdown + 10s sampling |

### ESP8266 HTTP API (Port 80)

| Endpoint | Method | Response |
|----------|--------|----------|
| `/` | GET | HTML interface |
| `/data` | GET | JSON sensor reading |

---

## Troubleshooting

### Sensor Not Detected

1. **Check wiring** - Ensure SDA/SCL connections are correct
2. **Verify I²C address** - Try both `0x76` and `0x77`
3. **Run I²C scanner** to find connected devices:
```cpp
#include <Wire.h>
void setup() {
  Serial.begin(9600);
  Wire.begin();
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("Found device at 0x%02X\n", addr);
    }
  }
}
void loop() {}
```

### Wi-Fi Connection Failed

- Check SSID/password in `secrets.h`
- Ensure 2.4GHz network (ESP8266/ESP32 don't support 5GHz)
- Move closer to router during initial setup

### BSEC Calibration (ESP32)

The BSEC library requires a **burn-in period** for accurate IAQ readings:
- First ~5 minutes: IAQ accuracy = 0 (unreliable)
- 30+ minutes: IAQ accuracy = 1-2 (improving)
- 24+ hours: IAQ accuracy = 3 (fully calibrated)

Calibration state is persisted to NVS flash and restored on reboot.

### High/Erratic Readings

- Allow sensor to warm up for 2-3 minutes
- Avoid touching the sensor directly
- Test in a well-ventilated area first to establish baseline
- Keep sensor away from strong odors during calibration

---

## Project Structure

```
.
├── ESP32/
│   ├── esp32-final-program.ino   # Main ESP32 firmware (BSEC + WebSocket)
│   ├── esp32-webserver-debug.ino # Debug version
│   └── secrets.h                 # Wi-Fi credentials (create this)
│
├── ESP8266/
│   ├── bad-breadth.ino           # Main ESP8266 firmware
│   ├── BME680Sensor.cpp/h        # Sensor driver
│   ├── wifi_manager.cpp/h        # Wi-Fi connection handler
│   ├── http_client.cpp/h         # HTTP server
│   └── secrets.h                 # Wi-Fi credentials (create this)
│
├── breathalyzer-app/             # Next.js companion web app
│   ├── components/
│   │   ├── websocket-provider.tsx  # WebSocket connection
│   │   ├── dashboard-page.tsx      # Main UI
│   │   └── test-flow.tsx           # Test flow animations
│   └── ...
│
└── landing.html                  # Static landing page
```

---

## License

MIT License - feel free to use and modify for your own projects!

---

## Acknowledgments

- [Bosch BSEC Library](https://www.bosch-sensortec.com/software-tools/software/bme680-software-bsec/) for advanced gas sensing algorithms
- [Adafruit BME680 Library](https://github.com/adafruit/Adafruit_BME680) for sensor drivers
