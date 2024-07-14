export enum ProtocolStatus {
  OffLine = 0,
  OnLine = 1,
}

export enum VoltageStatus {
  _5V = 0,
  ProtocolVoltage = 1,
}

export enum PdVersion {
  Unknown = 0,
  PD2_0 = 1,
  PD3_0 = 2,
}

export enum ProtocolIndication {
  Unknown = 0,
  QC2_0 = 1,
  QC3_0 = 2,
  FCP = 3,
  SCP = 4,
  PdFix = 5,
  PdPps = 6,
  PE1_1 = 7,
  PE2_0 = 8,
  VOOC = 9,
  SFCP = 10,
  AFC = 11,
}

export class ProtocolIndicationResponse {
  constructor(
    public protocolStatus: ProtocolStatus,
    public voltageStatus: VoltageStatus,
    public pdVersion: PdVersion,
    public protocol: ProtocolIndication,
  ) {}

  static fromBuffer(buffer: Buffer): ProtocolIndicationResponse {
    const protocolStatus = (buffer[0] & 0x80) >> 7;
    const voltageStatus = (buffer[0] & 0x40) >> 6;
    const pdVersion = (buffer[0] & 0x30) >> 4;
    const protocol = buffer[0] & 0x0f;
    return new ProtocolIndicationResponse(
      protocolStatus as ProtocolStatus,
      voltageStatus as VoltageStatus,
      pdVersion as PdVersion,
      protocol as ProtocolIndication,
    );
  }
}
