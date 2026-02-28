#!/usr/bin/env python3
import asyncio
from bleak import BleakScanner, BleakClient, BleakGATTCharacteristic
import paho.mqtt.client as mqtt
import random
import json

data_queue = asyncio.Queue()

async def main():

    attr_to_read = "00002a6e-0000-1000-8000-00805f9b34fb"
    desirable_device = "EnvSensor"
    clients = []
    clients_devs = []

    async def send_data():
        while True:
            print("Sending data")
            try:
                client,data = await data_queue.get()
                data_parsed = json.loads(data.decode())
                data_parsed["id"] = client
                data_json = json.dumps(data_parsed)
                mqtt_client.publish(topic, data_json)
                print("-----------------------------------------")
                print(data_json)
            except Exception as e:
                print(e)
            finally:
                print("SEND_FINAL")


    def make_callback(client):
        async def func(sender: BleakGATTCharacteristic, data: bytearray):
            print("DATA: ", data)
            print("CLIENT.ADDRESS: ", client.address)
            await data_queue.put((client.address, data))

        return func


    #MQTT connection establishment

    mqtt_broker = "127.0.0.1"
    mqtt_port = 1883
    topic = "SendDataToBackend"
    client_id = f'python-mqtt-{random.randint(0, 2**256)}'

    mqtt_client = mqtt.Client()
    mqtt_client.connect(mqtt_broker, mqtt_port, 1)
    mqtt_client.loop_start()

    asyncio.create_task(send_data())


    #main loop
    while True:
        devices = await BleakScanner.discover()
        for device in devices:
            if device.name == desirable_device and device not in clients_devs :
                 try:
                    client = BleakClient(device)
                    clients_devs.append(device)
                    await client.connect()
                    print(f"Client with MAC::{device.address} connected")
                    put_to_queue = make_callback(client)
                    await client.start_notify(attr_to_read, put_to_queue)
                    clients.append(client)
                 finally:
                    await asyncio.sleep(67)
        await asyncio.sleep(67)
    mqtt_client.loop_stop()

asyncio.run(main())

