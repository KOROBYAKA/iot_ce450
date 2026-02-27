/*
BLE testing
From: https://ladvien.com/arduino-nano-33-bluetooth-low-energy-setup/
*/


#include <ArduinoBLE.h>
#include <Arduino_HTS221.h>

// Device name
const char* nameOfPeripheral = "Temperature sensor";
const char* uuidOfService = "00002A6E-0000-1000-8000-00805f9b34fb";
const char* uuidOfRxChar = "00002A3D-0000-1000-8000-00805f9b34fb";
const char* uuidOfTxChar = "00002A58-0000-1000-8000-00805f9b34fb";

// BLE Service
BLEService temperatureService(uuidOfService);

// Setup the incoming data characteristic (RX).
const int RX_BUFFER_SIZE = 256;
bool RX_BUFFER_FIXED_LENGTH = false;

// RX & TX Characteristics
BLECharacteristic rxChar(uuidOfRxChar,BLEWriteWithoutResponse | BLEWrite,32);
BLECharacteristic txChar(uuidOfTxChar, BLERead | BLENotify, sizeof(float), false);

// Global var
int sent_once = 0;



void setup() {
  // Start serial.
  Serial.begin(9600);

  // Ensure serial port is ready.
  while (!Serial);

  // Prepare LED pins.
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(LEDR, OUTPUT);
  pinMode(LEDG, OUTPUT);


  // Start BLE.
  startBLE();

  // Start temperature
  if (!HTS.begin()) {
    Serial.println("HTS221 failed!");
    while (1);
  }


  // Create BLE service and characteristics.
  BLE.setLocalName(nameOfPeripheral);
  BLE.setAdvertisedService(temperatureService);
  temperatureService.addCharacteristic(rxChar);
  temperatureService.addCharacteristic(txChar);
  BLE.addService(temperatureService);

  // Bluetooth LE connection handlers.
  BLE.setEventHandler(BLEConnected, onBLEConnected);
  BLE.setEventHandler(BLEDisconnected, onBLEDisconnected);

  // Event driven reads.
  //rxChar.setEventHandler(BLEWritten, onRxCharValueUpdate);

  // Let's tell devices about us.
  BLE.advertise();


  // Print out full UUID and MAC address.
  Serial.println("Peripheral advertising info: ");
  Serial.print("Name: ");
  Serial.println(nameOfPeripheral);
  Serial.print("MAC: ");
  Serial.println(BLE.address());
  Serial.print("Service UUID: ");
  Serial.println(temperatureService.uuid());
  Serial.print("rxCharacteristic UUID: ");
  Serial.println(uuidOfRxChar);
  Serial.print("txCharacteristics UUID: ");
  Serial.println(uuidOfTxChar);

  Serial.println("Bluetooth device active, waiting for connections...");
}



// Helper function:
void startBLE() {
  if (!BLE.begin())
  {
    Serial.println("starting BLE failed!");
    while (1);
  }
}


// Connection functions and LED indicators for the state of connections
void onBLEConnected(BLEDevice central) {
  Serial.print("Connected event, central: ");
  Serial.println(central.address());
  connectedLight();
}

void onBLEDisconnected(BLEDevice central) {
  Serial.print("Disconnected event, central: ");
  Serial.println(central.address());
  disconnectedLight();
}

/*
 * LEDS
 */
void connectedLight() {
  digitalWrite(LEDR, LOW);
  digitalWrite(LEDG, HIGH);
}


void disconnectedLight() {
  digitalWrite(LEDR, HIGH);
  digitalWrite(LEDG, LOW);
}




void loop(){

  BLEDevice central = BLE.central();

  if (central){
    // Only send data if we are connected to a central device.
    while (central.connected()) {
      
      connectedLight();
      BLE.poll();

      float temp = HTS.readTemperature();
      uint8_t temperature = temp;

      if (txChar.subscribed()) {
        // Central has enabled notifications
        //txChar.writeValue((byte*)&temperature, sizeof(temperature));
        txChar.writeValue(temperature, true);
        Serial.println("Sent temperature (subscribed)!");
        sent_once = 0;
      }

      else {
        if(sent_once == 0){
          // No central has subscribed yet
          Serial.println("Waiting for central to subscribe...");
          //sent_once = 1;
        }
      }

      delay(2000);
    }
    disconnectedLight();
  }

  else {
    disconnectedLight();
  }
}









