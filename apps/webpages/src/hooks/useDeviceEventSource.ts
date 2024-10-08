import { useCallback, useEffect } from "react";
import {
  deserializeChargeChannelSeriesItem,
  deserializeProtectorSeriesItem,
} from "../helpers/mqtt-seraiallization.ts";
import type { ChargeChannelSeriesItem } from "../models/charge-channel-series-item.ts";
import type { ProtectorSeriesItem } from "../models/protector-series-item.ts";

const eventSourceMap = new Map<
  string,
  {
    refCount: number;
    eventSource: EventSource;
  }
>();

export const useDeviceSeriesEventSource = (
  deviceId: string,
  cb: (value: ChargeChannelSeriesItem) => void,
) => {
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const value = deserializeChargeChannelSeriesItem(event.data);

      cb(value);
    },
    [cb],
  );

  useDeviceEventSource(deviceId, "series", handleMessage);
};

export const useDeviceProtectorEventSource = (
  deviceId: string,
  cb: (value: ProtectorSeriesItem) => void,
) => {
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const value = deserializeProtectorSeriesItem(event.data);

      cb(value);
    },
    [cb],
  );

  useDeviceEventSource(deviceId, "protector", handleMessage);
};

export const useDeviceEventSource = (
  deviceId: string,
  type: "series" | "protector",
  cb: (event: MessageEvent) => void,
) => {
  useEffect(() => {
    let es = eventSourceMap.get(deviceId);
    if (!es) {
      es = {
        refCount: 0,
        eventSource: new EventSource(`/api/devices/${deviceId}`),
      };

      eventSourceMap.set(deviceId, es);

      es.eventSource.onerror = (ev) => {
        console.error("EventSource error:", ev);
      };
    }

    es.refCount += 1;
    const { eventSource } = es;

    eventSource.addEventListener(type, cb);

    return () => {
      eventSource.removeEventListener(type, cb);

      es.refCount -= 1;

      if (es.refCount === 0) {
        eventSource.close();
        eventSourceMap.delete(deviceId);
      }
    };
  }, [deviceId, cb, type]);
};
