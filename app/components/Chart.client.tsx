import "chart.js/auto";
import { type ChartProps, ReactChart } from "chartjs-react";
import type { FC } from "react";

export const Chart: FC<ChartProps> = (props) => {
  return <ReactChart {...props} />;
};
