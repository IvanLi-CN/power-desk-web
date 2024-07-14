export enum OutputShortCircuitStatus {
  Normal = 0,
  Short = 1,
}

export enum OverTemperatureAlarmStatus {
  Normal = 0,
  Alarm = 1,
}

export enum OverTemperatureShutdownStatus {
  Normal = 0,
  Shutdown = 1,
}

export enum VinOvpStatus {
  Normal = 0,
  Ovp = 1,
}

export class AbnormalCaseResponse {
  constructor(
    public vinOvpStatus: VinOvpStatus,
    public overTemperatureAlarmStatus: OverTemperatureAlarmStatus,
    public overTemperatureShutdownStatus: OverTemperatureShutdownStatus,
    public outputShortCircuitStatus: OutputShortCircuitStatus,
  ) {}

  static fromBuffer(buffer: Buffer) {
    return new AbnormalCaseResponse(
      (buffer[0] & 0x10) >> 4,
      (buffer[0] & 0x04) >> 2,
      (buffer[0] & 0x02) >> 1,
      buffer[0] & 0x01,
    );
  }
}
