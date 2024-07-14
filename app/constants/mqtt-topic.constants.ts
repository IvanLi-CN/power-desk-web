export const prefix = "power-desk";

const topicMapping = [
  ["temperature", "temperature"],
  ["voltage", "millivolts"],
  ["current", "amps"],
  ["power", "watts"],
  ["out-voltage", "out-millivolts"],
  ["out-current", "out-milliamps"],
  ["out-power", "out-watts"],
  ["protocol-indication", "protocol-indication"],
  ["system-status", "system-status"],
  ["abnormal-case", "abnormal-case"],
  ["limit-power", "limit-watts"],
  ["buck-output-limit-current", "buck-output-limit-milliamps"],
  ["buck-output-voltage", "buck-output-millivolts"],
] as const;

export type Topic = (typeof topicMapping)[number][0];

export const getDeviceTopic = (deviceId: string, topic: Topic) => {
  const value = topicMapping.find((t) => t[0] === topic);
  if (!value) {
    throw new Error(`Invalid topic: ${topic}`);
  }
  return `${prefix}/${deviceId}/${value[1]}`;
};

export const getDeviceTopicWithChannel = (
  deviceId: string,
  topic: Topic,
  channel: number,
) => {
  const value = topicMapping.find((t) => t[0] === topic);
  if (!value) {
    throw new Error(`Invalid topic: ${topic}`);
  }
  return `${prefix}/${deviceId}/ch${channel}/${value[1]}`;
};

export const parseChannelFromTopic = (topic: string) =>
  Number.parseInt(topic.split("/").slice(-2)[0].replace("ch", ""), 10);
