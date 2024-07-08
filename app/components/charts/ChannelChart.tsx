import {
  CategoryScale,
  type ChartData,
  Chart as ChartJS,
  type ChartOptions,
  Colors,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { type FC, useEffect, useMemo } from "react";
import { ClientOnly } from "remix-utils/client-only";
import {
  getDeviceTopicWithChannel,
  parseChannelFromTopic,
} from "../../constants/mqtt-topic.constants";
import {
  deserializeCurrentInAmperes,
  deserializePowerInWatts,
  deserializeVoltageInMillivolts,
} from "../../helpers/mqtt-seraiallization";
import { useMqttClient } from "../../stores/mqtt";
import { Chart } from "../Chart.client";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  Colors,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
);

export type ChannelChartProps = {
  deviceId: string;
  channel: number;
};

const ChannelChart: FC<ChannelChartProps> = ({ deviceId, channel }) => {
  const chartId = useMemo(
    () => `${deviceId}-ch${channel}-chart`,
    [deviceId, channel],
  );

  const mqttClient = useMqttClient();

  const data = useMemo(
    () =>
      ({
        labels: [] as number[],
        datasets: [
          {
            label: "Voltage of 0",
            cubicInterpolationMode: "monotone",
            tension: 0.5,
            data: [] as number[],
            borderColor: "#1E90FF",
            backgroundColor: "#1E90FF77",
            yAxisID: "voltageValue",
          },
          {
            label: "Current of 0",
            cubicInterpolationMode: "monotone",
            tension: 0.5,
            data: [] as number[],
            borderColor: "#DC143C",
            backgroundColor: "#DC143C77",
            yAxisID: "currentValue",
          },
          {
            label: "Power of 0",
            cubicInterpolationMode: "monotone",
            tension: 0.5,
            data: [] as number[],
            borderColor: "#228B22",
            backgroundColor: "#228B2277",
            yAxisID: "powerValue",
          },
        ],
      }) satisfies ChartData,
    [],
  );

  const options = useMemo(
    () =>
      ({
        responsive: true,
        maintainAspectRatio: false,
        animations: {
          tension: {
            duration: 1000,
            easing: "linear",
            from: 0.5,
            to: 0.4,
            loop: true,
          },
        },
        scales: {
          voltageValue: {
            suggestedMin: 0,
            suggestedMax: 20,
          },
          currentValue: {
            suggestedMin: 0,
            suggestedMax: 5,
          },
          powerValue: {
            suggestedMin: 0,
            suggestedMax: 65,
            position: "right",
          },
        },
      }) satisfies ChartOptions,
    [],
  );

  useEffect(() => {
    if (!deviceId) {
      return;
    }

    const voltageTopic = getDeviceTopicWithChannel(
      deviceId,
      "voltage",
      channel,
    );
    const powerTopic = getDeviceTopicWithChannel(deviceId, "power", channel);
    const currentTopic = getDeviceTopicWithChannel(
      deviceId,
      "current",
      channel,
    );

    const handleMessage = (_topic: string, message: Buffer) => {
      console.log({ _topic, message: message.toString() });

      if (voltageTopic === _topic) {
        const millivolts = deserializeVoltageInMillivolts(message);
        data.labels.push(Date.now());
        data.datasets[0].data.push(millivolts / 1000);

        ChartJS.getChart(chartId)?.update();

        return;
      }

      if (currentTopic === _topic) {
        const amperes = deserializeCurrentInAmperes(message);
        data.labels.push(Date.now());
        data.datasets[1].data.push(amperes);

        ChartJS.getChart(chartId)?.update();

        return;
      }

      if (powerTopic === _topic) {
        const watts = deserializePowerInWatts(message);
        data.labels.push(Date.now());
        data.datasets[2].data.push(watts);

        ChartJS.getChart(chartId)?.update();

        return;
      }
    };

    mqttClient.on("message", handleMessage);

    mqttClient.subscribe(voltageTopic);
    mqttClient.subscribe(powerTopic);
    mqttClient.subscribe(currentTopic);

    return () => {
      mqttClient.off("message", handleMessage);
      mqttClient.unsubscribe(voltageTopic);
      mqttClient.unsubscribe(powerTopic);
      mqttClient.unsubscribe(currentTopic);
    };
  }, [deviceId, mqttClient, data, chartId, channel]);

  return (
    <ClientOnly>
      {() => (
        <Chart
          id={chartId}
          type="line"
          data={data}
          options={options}
          height={400}
          width={600}
        />
      )}
    </ClientOnly>
  );
};

export default ChannelChart;
