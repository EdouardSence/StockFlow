import QRCode from 'qrcode';

export async function generateQrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, { width: 256, margin: 1 });
}
