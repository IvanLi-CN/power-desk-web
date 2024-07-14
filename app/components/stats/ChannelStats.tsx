import type { FC } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDeviceTopicWithChannel } from "../../constants/mqtt-topic.constants";
import {
  deserializeCurrentInAmperes,
  deserializeLimitPowerInWatts,
  deserializeOutVoltageInMillivolts,
  deserializeOutputLimitCurrentInMilliamps,
  deserializePowerInWatts,
  deserializeVoltageInMillivolts,
} from "../../helpers/mqtt-seraiallization";
import { AbnormalCaseResponse } from "../../models/abnormal-case";
import {
  PdVersion,
  ProtocolIndication,
  ProtocolIndicationResponse,
  ProtocolStatus,
} from "../../models/protocol-indication";
import {
  BuckStatus,
  PortStatus,
  SystemStatusResponse,
} from "../../models/system-status";
import { useMqttClient } from "../../stores/mqtt";

interface ChannelStatsProps {
  deviceId: string;
  channel: number;
}

const ChannelStats: FC<ChannelStatsProps> = ({ deviceId, channel }) => {
  const mqttClient = useMqttClient();
  const { t } = useTranslation(["stat", "unit", "common"]);

  const [voltage, setVoltage] = useState<number | null>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [power, setPower] = useState<number | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(
    null,
  );
  const [protocolIndication, setProtocolIndication] =
    useState<ProtocolIndicationResponse | null>(null);
  const [abnormalCase, setAbnormalCase] = useState<AbnormalCaseResponse | null>(
    null,
  );
  const [limitPower, setLimitPower] = useState<number | null>(null);
  const [outputLimitCurrent, setOutputLimitCurrent] = useState<number | null>(
    null,
  );
  const [buckOutputVoltage, setBuckOutputVoltage] = useState<number | null>(
    null,
  );

  useEffect(() => {
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
    const systemStatusTopic = getDeviceTopicWithChannel(
      deviceId,
      "system-status",
      channel,
    );
    const protocolIndicationTopic = getDeviceTopicWithChannel(
      deviceId,
      "protocol-indication",
      channel,
    );
    const abnormalCaseTopic = getDeviceTopicWithChannel(
      deviceId,
      "abnormal-case",
      channel,
    );
    const buckOutputVoltageTopic = getDeviceTopicWithChannel(
      deviceId,
      "buck-output-voltage",
      channel,
    );
    const outputLimitCurrentTopic = getDeviceTopicWithChannel(
      deviceId,
      "buck-output-limit-current",
      channel,
    );
    const limitPowerTopic = getDeviceTopicWithChannel(
      deviceId,
      "limit-power",
      channel,
    );

    const onMessage = (topic: string, payload: Buffer) => {
      if (topic === voltageTopic) {
        const millivolts = deserializeVoltageInMillivolts(payload);
        setVoltage(millivolts / 1000);
      } else if (topic === powerTopic) {
        const watts = deserializePowerInWatts(payload);
        setPower(watts);
      } else if (topic === currentTopic) {
        const milliamps = deserializeCurrentInAmperes(payload);
        setCurrent(milliamps);
      } else if (topic === systemStatusTopic) {
        const systemStatus = SystemStatusResponse.fromBuffer(payload);
        setSystemStatus(systemStatus);
      } else if (topic === protocolIndicationTopic) {
        const protocolIndication =
          ProtocolIndicationResponse.fromBuffer(payload);
        setProtocolIndication(protocolIndication);
      } else if (topic === abnormalCaseTopic) {
        const abnormalCase = AbnormalCaseResponse.fromBuffer(payload);
        setAbnormalCase(abnormalCase);
      } else if (topic === buckOutputVoltageTopic) {
        const buckOutputVoltage = deserializeOutVoltageInMillivolts(payload);
        setBuckOutputVoltage(buckOutputVoltage / 1000);
      } else if (topic === outputLimitCurrentTopic) {
        const outputLimitCurrent =
          deserializeOutputLimitCurrentInMilliamps(payload);
        setOutputLimitCurrent(outputLimitCurrent / 1000);
      } else if (topic === limitPowerTopic) {
        const limitPower = deserializeLimitPowerInWatts(payload);
        setLimitPower(limitPower);
      }
    };

    mqttClient.on("message", onMessage);

    mqttClient.subscribe(voltageTopic);
    mqttClient.subscribe(currentTopic);
    mqttClient.subscribe(powerTopic);
    mqttClient.subscribe(systemStatusTopic);
    mqttClient.subscribe(protocolIndicationTopic);
    mqttClient.subscribe(abnormalCaseTopic);
    mqttClient.subscribe(buckOutputVoltageTopic);
    mqttClient.subscribe(outputLimitCurrentTopic);
    mqttClient.subscribe(limitPowerTopic);

    return () => {
      mqttClient.off("message", onMessage);

      mqttClient.unsubscribe(voltageTopic);
      mqttClient.unsubscribe(currentTopic);
      mqttClient.unsubscribe(powerTopic);
      mqttClient.unsubscribe(systemStatusTopic);
      mqttClient.unsubscribe(protocolIndicationTopic);
      mqttClient.unsubscribe(abnormalCaseTopic);
      mqttClient.unsubscribe(buckOutputVoltageTopic);
      mqttClient.unsubscribe(outputLimitCurrentTopic);
      mqttClient.unsubscribe(limitPowerTopic);
    };
  }, [mqttClient, deviceId, channel]);

  return (
    <div className="stats shadow w-full h-full">
      <div className="stat">
        <div className="stat-title uppercase">{t("common:voltage")}</div>
        <div className="stat-value">{t("unit:volts", { value: voltage })}</div>
        <div className="stat-desc">
          {t("target-output-voltage", {
            value: t("unit:volts", { value: buckOutputVoltage }),
          })}
        </div>
      </div>

      <div className="stat">
        <div className="stat-title uppercase">{t("common:current")}</div>
        <div className="stat-value">{t("unit:amps", { value: current })}</div>
        <div className="stat-desc">
          {t("limit-output-current", {
            value: t("unit:amps", { value: outputLimitCurrent }),
          })}
        </div>
      </div>

      <div className="stat">
        <div className="stat-title uppercase">{t("common:power")}</div>
        <div className="stat-value">{t("unit:watts", { value: power })}</div>
        <div className="stat-desc">
          {t("limit-power", {
            value: t("unit:watts", { value: limitPower }),
          })}
        </div>
      </div>

      <div className="stat">
        <div className="stat-title uppercase">{t("protocol")}</div>
        <div className="stat-value">
          {protocolIndication?.protocolStatus === ProtocolStatus.OnLine ? (
            <span>
              {t(
                `protocol.${ProtocolIndication[protocolIndication?.protocol ?? ProtocolIndication.Unknown]}`,
              )}
              {protocolIndication &&
                [ProtocolIndication.PdFix, ProtocolIndication.PdFix].includes(
                  protocolIndication.protocol,
                ) && (
                  <small className="ml-2 font-extralight">
                    (
                    {t(`pd-version.${PdVersion[protocolIndication.pdVersion]}`)}
                    )
                  </small>
                )}
            </span>
          ) : (
            <span>{t("protocol-status.offline")}</span>
          )}
        </div>
        <div className="stat-desc flex gap-2">
          {systemStatus?.portStatus === PortStatus.On ? (
            <span className="badge badge-success badge-sm">
              {t("port-status.on")}
            </span>
          ) : (
            <span className="badge badge-error badge-sm">
              {t("port-status.off")}
            </span>
          )}
          {systemStatus?.buckStatus === BuckStatus.On ? (
            <span className="badge badge-success badge-sm">
              {t("buck-status.on")}
            </span>
          ) : (
            <span className="badge badge-error badge-sm">
              {t("buck-status.off")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelStats;
