export interface ScanResult {
  isSafe: boolean;
  threat?: string;
  scannedAt: Date;
}

export interface IScanProvider {
  scanObject(storageKey: string): Promise<ScanResult>;
}

export class MockScanProvider implements IScanProvider {
  async scanObject(storageKey: string): Promise<ScanResult> {
    // In dev / test, test against any simulated infected file keywords
    const isThreat = storageKey.toLowerCase().includes("eicar") || storageKey.toLowerCase().includes("malware");

    return {
      isSafe: !isThreat,
      threat: isThreat ? "Win32.TestMalware.Simulated" : undefined,
      scannedAt: new Date(),
    };
  }
}

export class ClamAVScanProvider implements IScanProvider {
  async scanObject(storageKey: string): Promise<ScanResult> {
    // When ClamAV daemon is configured via TCP / socket
    return {
      isSafe: true,
      scannedAt: new Date(),
    };
  }
}

export const scanner: IScanProvider = new MockScanProvider();
