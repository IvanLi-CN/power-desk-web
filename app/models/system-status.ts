export enum PortStatus {
  Off = 0,
  On = 1,
}

export enum BuckStatus {
  Off = 0,
  On = 1,
}

export class SystemStatusResponse {
  constructor(
    public portStatus: PortStatus,
    public buckStatus: BuckStatus,
  ) {}

  static fromBuffer(buffer: Buffer) {
    const value = new DataView(buffer.buffer).getUint8(buffer.byteOffset);
    return new SystemStatusResponse(
      value & 0x02 ? PortStatus.On : PortStatus.Off,
      value & (0x01 as BuckStatus),
    );
  }
}
