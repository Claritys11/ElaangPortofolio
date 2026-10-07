import { PDFParse } from "pdf-parse";

/** Render page 1 of a PDF to PNG, so PDF certificates can be shown like images (timeline, gallery). */
export async function renderPdfPreview(pdf: Buffer, width = 1600): Promise<Buffer> {
  const parser = new PDFParse({ data: new Uint8Array(pdf) });
  try {
    const shot = await parser.getScreenshot({ first: 1, desiredWidth: width, imageBuffer: true, imageDataUrl: false });
    const page = shot.pages[0];
    if (!page?.data?.length) throw new Error("Could not render the first page of this PDF.");
    return Buffer.from(page.data);
  } finally {
    await parser.destroy();
  }
}
