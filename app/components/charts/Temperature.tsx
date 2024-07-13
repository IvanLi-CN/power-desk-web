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
import { type FC, useEffect, useMemo } from "react";
import { ClientOnly } from "remix-utils/client-only";
import { getDeviceTopic } from "../../constants/mqtt-topic.constants";
import { deserializeTemperature } from "../../helpers/mqtt-seraiallization";
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

export type TemperatureChartProps = {
  deviceId: string;
};

const TemperatureChart: FC<TemperatureChartProps> = ({ deviceId }) => {
  const chartId = useMemo(() => `${deviceId}-temperature-chart`, [deviceId]);

  const mqttClient = useMqttClient();

  const data = useMemo(
    () =>
      ({
        labels: [] as string[],
        datasets: [
          {
            label: "Temperature",
            cubicInterpolationMode: "monotone",
            tension: 0.5,
            data: [] as number[],
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
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
          y: {
            suggestedMin: 30,
            suggestedMax: 40,
          },
        },
      }) satisfies ChartOptions,
    [],
  );

  useEffect(() => {
    if (!deviceId) {
      return;
    }

    const topic = getDeviceTopic(deviceId, "temperature");

    const handleMessage = (_topic: string, message: Buffer) => {
      console.log({ _topic, message: message.toString() });

      if (topic === _topic) {
        const temperature = deserializeTemperature(message);
        data.labels.push(format(Date.now(), "HH:mm:ss"));
        data.datasets[0].data.push(temperature);

        ChartJS.getChart(chartId)?.update();
      }
    };

    mqttClient.on("message", handleMessage);

    mqttClient.subscribe(topic);

    return () => {
      mqttClient.off("message", handleMessage);
      mqttClient.unsubscribe(topic);
    };
  }, [deviceId, mqttClient, data, chartId]);

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

export default TemperatureChart;
