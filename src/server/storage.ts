import fs from 'fs';
import path from 'path';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'storage', 'uploads');
export const OUTPUT_DIR = path.resolve(process.cwd(), 'storage', 'processed');

export function initStorage() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

export function cleanupOldFiles(maxAgeMs = 1000 * 60 * 60 * 12) {
  // Cleans up files older than 12 hours automatically
  const now = Date.now();
  [UPLOAD_DIR, OUTPUT_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > maxAgeMs) {
            fs.unlinkSync(filePath);
          }
        } catch {
          // Ignore individual file error
        }
      }
    } catch {
      // Ignore directory read error
    }
  });
}
