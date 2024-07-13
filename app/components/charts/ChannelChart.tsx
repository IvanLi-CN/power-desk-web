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
import { format } from "date-fns";
import { last } from "ramda";
import { type FC, useEffect, useMemo } from "react";
import { ClientOnly } from "remix-utils/client-only";
import { getDeviceTopicWithChannel } from "../../constants/mqtt-topic.constants";
import {
  deserializeCurrentInAmperes,
  deserializeOutCurrentInMilliAmperes,
  deserializeOutVoltageInMillivolts,
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const dataBuffer = useMemo(
    () => new Array<{ timestamp: number; values: (number | null)[] }>(),
    [deviceId, channel],
  );

  const data = useMemo(
    () =>
      ({
        labels: [] as string[],
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
          {
            label: "Out Voltage of 0",
            cubicInterpolationMode: "monotone",
            tension: 0.5,
            data: [] as number[],
            borderColor: "#3342FF",
            yAxisID: "voltageValue",
          },
          {
            label: "Out Current of 0",
            cubicInterpolationMode: "monotone",
            tension: 0.5,
            data: [] as number[],
            borderColor: "#ac333C",
            yAxisID: "currentValue",
          },
          {
            label: "Out Power of 0",
            cubicInterpolationMode: "monotone",
            tension: 0.5,
            data: [] as number[],
            borderColor: "#83a222",
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
    const outVoltageTopic = getDeviceTopicWithChannel(
      deviceId,
      "out-voltage",
      channel,
    );
    const outCurrentTopic = getDeviceTopicWithChannel(
      deviceId,
      "out-current",
      channel,
    );
    const outPowerTopic = getDeviceTopicWithChannel(
      deviceId,
      "out-power",
      channel,
    );

    const handleMessage = (_topic: string, message: Buffer) => {
      console.log({ _topic, message: message.toString() });

      let lastOne = last(dataBuffer);
      if (!lastOne || Date.now() - lastOne.timestamp > 1000) {
        if (lastOne?.values.every((v) => v === null)) {
          dataBuffer.pop();
          data.labels.pop();
        }
        lastOne = {
          timestamp: Date.now(),
          values: data.datasets.map(() => null),
        };
        dataBuffer.push(lastOne);
        data.labels.push(format(lastOne.timestamp, "HH:mm:ss"));
      }
      const lastIndex = dataBuffer.length - 1;

      if (voltageTopic === _topic) {
        const millivolts = deserializeVoltageInMillivolts(message);
        lastOne.values[0] = millivolts / 1000;
        data.datasets[0].data[lastIndex] = lastOne.values[0];
      } else if (currentTopic === _topic) {
        const amperes = deserializeCurrentInAmperes(message);
        lastOne.values[1] = amperes;
        data.datasets[1].data[lastIndex] = lastOne.values[1];
      } else if (powerTopic === _topic) {
        const watts = deserializePowerInWatts(message);
        lastOne.values[2] = watts;
        data.datasets[2].data[lastIndex] = lastOne.values[2];
      } else if (outVoltageTopic === _topic) {
        const millivolts = deserializeOutVoltageInMillivolts(message);
        lastOne.values[3] = millivolts / 1000;
        data.datasets[3].data[lastIndex] = lastOne.values[3];
      } else if (outCurrentTopic === _topic) {
        const milliAmps = deserializeOutCurrentInMilliAmperes(message);
        lastOne.values[4] = milliAmps / 1000;
        data.datasets[4].data[lastIndex] = lastOne.values[4];
      } else if (outPowerTopic === _topic) {
        const watts = deserializePowerInWatts(message);
        lastOne.values[5] = watts;
        data.datasets[5].data[lastIndex] = lastOne.values[5];
      } else {
        return;
      }
      ChartJS.getChart(chartId)?.update();
    };

    mqttClient.on("message", handleMessage);

    mqttClient.subscribe(voltageTopic);
    mqttClient.subscribe(powerTopic);
    mqttClient.subscribe(currentTopic);
    mqttClient.subscribe(outVoltageTopic);
    mqttClient.subscribe(outCurrentTopic);
    mqttClient.subscribe(outPowerTopic);

    return () => {
      mqttClient.off("message", handleMessage);
      mqttClient.unsubscribe(voltageTopic);
      mqttClient.unsubscribe(powerTopic);
      mqttClient.unsubscribe(currentTopic);
      mqttClient.unsubscribe(outVoltageTopic);
      mqttClient.unsubscribe(outCurrentTopic);
      mqttClient.unsubscribe(outPowerTopic);
    };
  }, [deviceId, mqttClient, data, chartId, channel, dataBuffer]);

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
