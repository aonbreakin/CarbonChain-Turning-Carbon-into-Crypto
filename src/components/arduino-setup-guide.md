# CarbonChain Arduino IoT Device - Complete Setup Guide

## 🔧 Hardware Requirements

### Core Components

| Component | Model | Purpose | Price (USD) |
|-----------|-------|---------|-------------|
| **Microcontroller** | ESP32 DevKit V1 | WiFi connectivity & processing | $8-12 |
| **CO2 Sensor** | MH-Z19B or SCD30 | Carbon capture measurement | $20-60 |
| **Current Sensor** | INA219 or ACS712 | Energy production monitoring | $5-15 |
| **Voltage Sensor** | Voltage Divider Module | Power measurement | $3-5 |
| **Secure Element** | ATECC608A | Hardware key storage & 2FA | $1-3 |
| **OLED Display** | SSD1306 128x64 | Status display | $5-8 |
| **Push Button** | Tactile switch | 2FA confirmation | $0.50 |
| **LEDs** | RGB or separate LEDs | Status indicators | $1-2 |
| **Power Supply** | 5V 2A adapter | Device power | $5-8 |
| **Breadboard/PCB** | Prototyping board | Assembly | $5-10 |
| **Jumper Wires** | Male-Female wires | Connections | $3-5 |

**Total Cost:** ~$60-130 USD

### Optional Components
- **Real-time Clock (RTC)** - DS3231 for accurate timestamps
- **SD Card Module** - Local telemetry backup
- **Buzzer** - Audio alerts
- **Temperature/Humidity Sensor** - DHT22 for environmental data

---

## 📐 Wiring Diagram

```
ESP32 DevKit V1
┌─────────────────────────┐
│                         │
│  3V3 ──────────┐       │
│  GND ──────┐   │       │
│            │   │       │
│  GPIO16 ───┼───┼───→ CO2 Sensor RX
│  GPIO17 ───┼───┼───→ CO2 Sensor TX
│            │   │       │
│  GPIO21 ───┼───┼───→ SDA (OLED, INA219, ATECC608A)
│  GPIO22 ───┼───┼───→ SCL (OLED, INA219, ATECC608A)
│            │   │       │
│  GPIO34 ───┼───┴───→ Voltage Sensor (A0)
│  GPIO35 ───┼───────→ Current Sensor (A1)
│            │         │
│  GPIO12 ───┼───→ 2FA Button (Pull-up)
│            │         │
│  GPIO2  ───┼───→ Status LED (Green)
│  GPIO4  ───┼───→ TX LED (Blue)
│  GPIO5  ───┼───→ Error LED (Red)
│            │         │
│  GND ──────┴─────────┴─→ Common Ground
│                         │
└─────────────────────────┘

I2C Bus (3.3V):
- 0x3C: OLED Display (SSD1306)
- 0x40: Current Sensor (INA219)
- 0x60: Secure Element (ATECC608A)
```

### Detailed Pin Connections

#### CO2 Sensor (MH-Z19B)
```
MH-Z19B          ESP32
───────          ─────
VCC (5V)    →    VIN
GND         →    GND
TX          →    GPIO16 (RX2)
RX          →    GPIO17 (TX2)
```

#### Current/Power Sensor (INA219)
```
INA219           ESP32
──────           ─────
VCC         →    3.3V
GND         →    GND
SDA         →    GPIO21
SCL         →    GPIO22
VIN+        →    Battery/Source +
VIN-        →    Load +
```

#### Secure Element (ATECC608A)
```
ATECC608A        ESP32
─────────        ─────
VCC         →    3.3V
GND         →    GND
SDA         →    GPIO21
SCL         →    GPIO22
```

#### OLED Display (SSD1306)
```
SSD1306          ESP32
───────          ─────
VCC         →    3.3V
GND         →    GND
SDA         →    GPIO21
SCL         →    GPIO22
```

#### 2FA Button & LEDs
```
Component        ESP32
─────────        ─────
Button Pin 1 →   GPIO12
Button Pin 2 →   GND

Green LED +  →   GPIO2 → 220Ω Resistor → GND
Blue LED +   →   GPIO4 → 220Ω Resistor → GND
Red LED +    →   GPIO5 → 220Ω Resistor → GND
```

---

## 💻 Software Setup

### 1. Install Arduino IDE

```bash
# Download from: https://www.arduino.cc/en/software
# Or using package manager (Linux):
sudo apt-get install arduino

# Install ESP32 board support
# In Arduino IDE:
# File → Preferences → Additional Board URLs:
https://dl.espressif.com/dl/package_esp32_index.json
```

### 2. Install Required Libraries

Open Arduino IDE → Tools → Manage Libraries, install:

```
Required Libraries:
├── WiFi (built-in for ESP32)
├── HTTPClient (built-in for ESP32)
├── ArduinoJson (v6.21.0+)
├── Adafruit_SSD1306 (v2.5.0+)
├── Adafruit_GFX (v1.11.0+)
├── Wire (built-in)
├── EEPROM (built-in)
├── ArduinoECCX08 (v1.3.7+)
└── mbedtls (included in ESP32 core)

Optional:
├── MHZ19 (for MH-Z19B CO2 sensor)
├── Adafruit_INA219 (for current sensor)
└── RTClib (for RTC module)
```

### 3. Configure Device Settings

Edit the Arduino code (`CarbonChain_Device.ino`):

```cpp
// WiFi Configuration
const char* WIFI_SSID = "Your_WiFi_Name";
const char* WIFI_PASSWORD = "Your_WiFi_Password";

// Server Configuration
const char* ORACLE_SERVER = "http://YOUR_ORACLE_IP:3001";
const char* API_SERVER = "http://YOUR_API_IP:3000";

// Device Configuration
#define DEVICE_ID "DEVICE-YOUR-ID"
#define MANUFACTURER "YourManufacturer"
#define LOCATION "Your_City, Country"
```

### 4. Upload Code to ESP32

```bash
# Select board: Tools → Board → ESP32 Dev Module
# Select port: Tools → Port → /dev/ttyUSB0 (or COM3 on Windows)
# Upload speed: 921600
# Flash size: 4MB
# Click Upload button
```

---

## 🔐 Security Setup

### 1. Initialize Secure Element (ATECC608A)

First-time setup requires locking the configuration:

```cpp
// Run this ONCE to configure secure element
#include "ArduinoECCX08.h"

void setup() {
  Serial.begin(115200);
  
  if (!ECCX08.begin()) {
    Serial.println("Failed to initialize ATECC608A");
    return;
  }
  
  Serial.println("Serial Number: " + ECCX08.serialNumber());
  
  // Lock configuration (IRREVERSIBLE!)
  // ECCX08.lock();
  
  Serial.println("Secure element ready");
}
```

### 2. Generate Wallet Keypair

Connect via Serial Monitor (115200 baud):

```
> wallet
=== Wallet Configuration ===
1. Generate new keypair
2. Import existing seed
Enter choice: 1

✅ Keypair generated successfully
✅ New wallet created!
Address: 5A1B2C3D4E5F...
```

### 3. Register Device on Chain

Method A: Via Serial Command
```
> register
Registering device on chain...
✅ Device registered successfully
```

Method B: Via Polkadot.js Apps
```
1. Go to: https://polkadot.js.org/apps
2. Developer → Extrinsics
3. Select: deviceRegistry.registerDevice(...)
4. Fill in device details
5. Sign and Submit
```

### 4. Enable 2FA

```
> 2fa enable
✅ 2FA enabled - button press required before submission

# To disable:
> 2fa disable
⚠️ 2FA disabled
```

---

## 🚀 Operation Guide

### Starting the Device

1. **Power On** - Device boots and shows splash screen
2. **WiFi Connection** - Automatically connects to configured network
3. **Wallet Check** - Loads wallet from EEPROM
4. **Sensor Initialization** - Starts reading CO2 and energy sensors
5. **Ready State** - Green LED indicates ready to operate

### Normal Operation Flow

```
┌─────────────────────────────────────────┐
│ 1. Device reads sensors every 5 seconds │
│    - CO2 captured (kg)                  │
│    - Energy produced (kWh)              │
│    - Current power (W)                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 2. Accumulate readings for 60 seconds   │
│    - Display updates in real-time       │
│    - Values shown on OLED screen        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 3. Check 2FA requirement                │
│    - If enabled: wait for button press  │
│    - Blue LED blinks: press button      │
│    - Sign challenge with secure element │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 4. Submit telemetry to Oracle           │
│    - Create signed telemetry packet     │
│    - Send to Oracle node via HTTP       │
│    - Blue LED on during transmission    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 5. Oracle verifies and submits to chain │
│    - Oracle validates device signature  │
│    - Aggregates with other oracles      │
│    - Submits to Substrate parachain     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 6. Receive CET token rewards             │
│    - Chain mints CET based on energy    │
│    - Balance updated on device          │
│    - Green LED blinks: success          │
└─────────────────────────────────────────┘
```

### LED Indicators

| LED Color | Pattern | Meaning |
|-----------|---------|---------|
| Green | Solid | Device ready |
| Green | 2 blinks | Telemetry submitted successfully |
| Green | 5 blinks | 2FA confirmed |
| Blue | Solid | Transmitting data |
| Blue | 3 blinks | Waiting for 2FA button press |
| Red | Solid | Error state |
| Red | 3 blinks | 2FA verification failed |
| Red | Fast blink | Network error |

### OLED Display Screens

```
Screen 1: Status Overview
┌────────────────────┐
│ CarbonChain Device │
│ ------------------ │
│ WiFi: OK           │
│ Wallet: OK         │
│ CO2: 12.45 kg      │
│ Energy: 6.23 kWh   │
│ Power: 850.5 W     │
│ CET: 847.32        │
└────────────────────┘

Screen 2: 2FA Required
┌────────────────────┐
│ 2FA Required       │
│                    │
│ Press button to    │
│ confirm telemetry  │
│ submission         │
│                    │
│   [  PRESS  ]      │
└────────────────────┘
```

---

## 🛠️ Serial Commands

Connect Serial Monitor at 115200 baud:

### Available Commands

```bash
# Get help
> help

# Check device status
> status

# Configure wallet
> wallet

# Register device on chain
> register

# Fetch CET balance
> balance

# Submit telemetry manually
> submit

# Enable 2FA security
> 2fa enable

# Disable 2FA security
> 2fa disable

# Reset device configuration
> reset
```

### Example Session

```
> status

=== Device Status ===
Device ID: DEVICE-001
WiFi: Connected
Wallet: Configured
Address: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
Sensors: Active
CO2 Captured: 12.45 kg
Energy Produced: 6.234 kWh
Current Power: 850.5 W
CET Balance: 847.3200
2FA Required: Yes
Nonce: 42
====================

> submit
📤 Submitting telemetry...
✅ Telemetry submitted successfully
💰 Earned 6.2340 CET tokens
```

---

## 🔄 2FA Flow Diagram

```
Device Ready
     │
     ▼
Time to Submit Telemetry
     │
     ▼
Is 2FA Enabled? ──No──→ Submit Immediately
     │                        │
    Yes                       ▼
     │                   Sign with
     ▼                   Secure Element
Display "Press Button"        │
Blue LED Blinks              ▼
     │                   Send to Oracle
     ▼                        │
User Presses Button          ▼
     │                   Receive Response
     ▼                        │
Request Challenge            ▼
from Server              Update Balance
     │                        │
     ▼                        ▼
Sign Challenge           Reset Counters
with Secure Element          │
     │                        ▼
     ▼                   Green LED Blinks
Send Signature               │
to Server                    ▼
     │                     Done ✅
     ▼
Server Verifies
     │
     ├──Invalid──→ Red LED Blinks → Retry
     │
    Valid
     │
     ▼
Mark 2FA Confirmed
     │
     ▼
Proceed with
Telemetry Submission
```

---

## 🧪 Testing & Calibration

### 1. Sensor Calibration

#### CO2 Sensor (MH-Z19B)
```cpp
// Calibrate in fresh air (400 ppm)
> calibrate_co2
Place sensor in fresh air for 20 minutes
Calibrating... Done!
```

#### Current Sensor (INA219)
```cpp
// Adjust calibration values in code
#define CURRENT_MULTIPLIER 1.0  // Adjust based on actual measurements
#define VOLTAGE_DIVIDER_RATIO 10.0
```

### 2. Test Telemetry Submission

```bash
# Generate test data
> test_telemetry
Generating test readings...
CO2: 5.00 kg
Energy: 2.50 kWh
Submitting...
✅ Test successful!
```

### 3. Verify Blockchain Integration

```bash
# Check on Polkadot.js Apps
1. Navigate to: Developer → Chain State
2. Select: oracle → telemetryReports
3. Enter your device ID
4. Verify submissions appear on-chain
```

---

## 🐛 Troubleshooting

### WiFi Connection Issues

```
Problem: WiFi not connecting
Solutions:
1. Check SSID and password in code
2. Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
3. Check router firewall settings
4. Try moving closer to router

Debug:
> status
WiFi: Disconnected
→ Reboot device or check credentials
```

### Secure Element Not Found

```
Problem: ATECC608A not detected
Solutions:
1. Check I2C connections (SDA/SCL)
2. Verify 3.3V power supply
3. Scan I2C bus for device address (0x60)
4. Try different I2C pins

Debug code:
Wire.begin();
Wire.beginTransmission(0x60);
if (Wire.endTransmission() == 0) {
  Serial.println("ATECC608A found!");
}
```

### Telemetry Submission Fails

```
Problem: HTTP 401 or 404 errors
Solutions:
1. Verify Oracle server is running
2. Check device is registered on chain
3. Ensure wallet is configured
4. Verify device signature is correct

Debug:
> status
Wallet: Not configured
→ Run: wallet command

> register
→ Register device on chain first
```

### 2FA Challenge Fails

```
Problem: 2FA verification fails
Solutions:
1. Check secure element is working
2. Verify button press is detected
3. Ensure server 2FA endpoint is active
4. Check network latency

Debug:
> 2fa disable
→ Temporarily disable to test basic flow
```

---

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| Power Consumption | 200-500mA @ 5V |
| WiFi Range | Up to 50m indoors |
| Sensor Read Rate | Every 5 seconds |
| Telemetry Rate | Every 60 seconds |
| 2FA Response Time | < 2 seconds |
| Signature Time | < 100ms (hardware) |
| Memory Usage | ~180KB Flash, ~40KB RAM |
| Uptime | 30+ days continuous |

---

## 🔒 Security Best Practices

1. **Never share private keys** - Keep seeds secure and offline
2. **Enable 2FA** - Always require button confirmation for production
3. **Update firmware** - Keep Arduino code and libraries updated
4. **Monitor logs** - Check serial output for anomalies
5. **Physical security** - Secure device in locked enclosure
6. **Network security** - Use VPN or private network when possible
7. **Backup configuration** - Save wallet seeds securely offline

---

## 📱 Web Configuration Interface (Optional)

Create web interface for easier configuration:

```cpp
#include <WebServer.h>

WebServer server(80);

void setupWebServer() {
  server.on("/", handleRoot);
  server.on("/config", handleConfig);
  server.begin();
}

void handleRoot() {
  String html = "<h1>CarbonChain Device Config</h1>";
  html += "<form action='/config' method='POST'>";
  html += "SSID: <input name='ssid'><br>";
  html += "Password: <input name='pass' type='password'><br>";
  html += "<input type='submit'>";
  html += "</form>";
  server.send(200, "text/html", html);
}
```

Access at: `http://192.168.4.1` when device in AP mode

---

## 📦 Bill of Materials (BOM)

Purchase links for components:

### Amazon/AliExpress
- ESP32: Search "ESP32 DevKit V1"
- MH-Z19B: Search "MH-Z19B CO2 sensor"
- INA219: Search "INA219 current sensor"
- ATECC608A: Search "ATECC608A breakout"
- SSD1306: Search "0.96 inch OLED I2C"

### DigiKey/Mouser (Industrial grade)
- ESP32-WROOM-32: Part #ESP32-WROOM-32D
- ATECC608A: Part #ATECC608A-MAHDA-T
- SCD30: Part #SCD30 (Sensirion)

---

## 🎓 Next Steps

1. **Deploy multiple devices** - Create network of carbon capture nodes
2. **Add GPS module** - Track device location automatically
3. **Implement LPWAN** - Use LoRa for remote deployment
4. **Add solar power** - Make device energy independent
5. **Create mobile app** - Monitor devices from smartphone
6. **Implement OTA updates** - Update firmware remotely

---

## 📞 Support

- **Documentation**: https://docs.carbonchain.io
- **GitHub Issues**: https://github.com/carbonchain/iot-device
- **Discord**: https://discord.gg/carbonchain
- **Email**: support@carbonchain.io

---

**Device is ready! Start capturing carbon and earning CET tokens! 🌱💰**