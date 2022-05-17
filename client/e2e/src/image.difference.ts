import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/** Returns the percentage-difference (a number between 1 and 100) between two png files */
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
export const getImageDifference = (file1: string, file2: string, ignored: { x: number; y: number; width: number; height: number }[] = []) => {
    const img1 = PNG.sync.read(readFileSync(file1));
    const img2 = PNG.sync.read(readFileSync(file2));
    /** Which areas/rectangles of file2 are to be ignored : The rectangle is copied from file1 to file2 (or if file1 doesn't yet exist, pre-fill it with a colored box, a blur, etc) */
    for (const ignore of ignored) PNG.bitblt(img1, img2, ignore.x, ignore.y, ignore.width, ignore.height, ignore.x, ignore.y);
    if (ignored.length) writeFileSync(file2, PNG.sync.write(img2));
    const { width, height } = img1;
    const diff = pixelmatch(img1.data, img2.data, undefined, width, height);
    const percent = 100 * (diff / (width * height));
    return percent;
};
