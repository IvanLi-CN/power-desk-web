import { atom, useAtom } from "jotai";
import mqtt from "mqtt";

const mqttBrokerUrlAtom = atom(() => import.meta.env.VITE_MQTT_URL);
const mqttClientAtom = atom((get) => {
  const url = get(mqttBrokerUrlAtom);

  return mqtt.connect(url);
});

export function useMqttClient() {
  const [client] = useAtom(mqttClientAtom);
  return client;
}
