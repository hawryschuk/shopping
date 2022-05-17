import { readdirSync, unlinkSync, createWriteStream, readFileSync, writeFileSync, existsSync, renameSync, rename } from 'fs';
import { browser, by, element, logging } from 'protractor';
import { Util } from '../../../model';
import { Features, FeatureStep } from './features';
import { getImageDifference } from './image.difference';

describe('Restaurant Reviews Application :: GUI :: Angular', () => {

  /** Delete all tmp change files */
  readdirSync('src/assets')
    .filter(file => /\.changed.png$/.test(file))
    .forEach(file => unlinkSync(`src/assets/${file}`));

  beforeAll(async () => await browser.driver.manage().window().setSize(1200, 900))

  beforeEach(async () => { await browser.get(browser.baseUrl); });

  false && afterEach(async () => {
    if (!/8002|4202|4200/.test(browser.baseUrl)) { // we purposely test http errors
      // Assert that there are no errors emitted from the browser
      const logs = await browser.manage().logs().get(logging.Type.BROWSER);
      expect(logs).not.toContain(jasmine.objectContaining({
        level: logging.Level.SEVERE,
      } as logging.Entry));
    }
  });

  /** Run the features and take a screenshot for each step in the feature */
  const oldFiles = readdirSync('src/assets').filter(fn => /.png/.test(fn)).map(fn => `src/assets/${fn}`);
  const queue = [];
  for (const feature of Features) {
    const _it = feature.focus && fit || it;
    _it(feature.title, async () => {
      for (const step of feature.steps) {
        await step.code().catch((error: any) => Object.assign(step, { error }));
        await Util.pause(777);
        queue.push({ feature, step, screenshot: await browser.takeScreenshot() });
      }
    });
  }

  afterAll(async () => {
    for (const { step, feature, screenshot } of queue) {
      const goodFile = `src/assets/${step.Filename}`;
      const changeFile = existsSync(goodFile) && `${goodFile}.changed.png`;
      Util.removeElements(oldFiles, goodFile, changeFile);
      writeFileSync(changeFile || goodFile, screenshot, 'base64');
      if (changeFile) {
        const diff = getImageDifference(goodFile, changeFile, step.ignored);
        const acceptChanges = feature.accept || step.accept || process.env.RESTAURANT_REVIEWS_E2E_ACCEPT_CHANGES;
        if (diff > 0.015) {
          console.log(JSON.stringify({ goodFile, changeFile, diff }));
          if (acceptChanges) {
            unlinkSync(goodFile);
            let tries = 0;
            do {
              if (tries++) { console.log('...waiting to rename: ', changeFile); await Util.pause(2000); }
              try { renameSync(changeFile, goodFile) } catch (e) { }
            } while (existsSync(changeFile));
          } else {
            (step.changed = true);
          }
        } else {
          unlinkSync(changeFile);
        }
      }
    }
    if (Features.find(f => f.focus)) {
      for (const f of Features.filter(f => !f.focus))
        Util.removeElements(oldFiles, ...f.steps.map(s => `src/assets/${s.Filename}`))
    }
    for (const f of oldFiles) {
      console.log({ DELETE_OLD_FILE: f });
      unlinkSync(f);
    }
  });

  afterAll(() => {
    for (const feature of Features) {
      const detectedChanges = feature.steps.filter(s => s.changed).map(s => s.Filename);
      detectedChanges.length && console.error({ DETECTED_CHANGES: detectedChanges });
      // expect(detectedChanges.length).toEqual(0);
    }

    /** Write the features.md */
    writeFileSync(
      'src/assets/FEATURES.md',
      `
# User Documentation
- visual walk-through of all the features, and their steps
<style>
    hr { clear:both; }
    div.steps div { float:left; width: 300px; height: 280px; padding: 10px 15px 0px 0px }
    img { width: 300px }
    p { min-height: 40px }
</style>\n` +
      Features.map((feature, index) =>
        [
          index ? '<hr style="page-break-before: always"></hr>\n' : '',
          `## ${feature.title}`,
          `### ${feature.description}`,
          `<div class="steps">`,
          feature.steps.map((step, stepIndex) => `\t<div><p>${step.subtitle}</p><img title="${feature.title}:${stepIndex + 1}" src="./${step.Filename}"></div>`).join('\n'),
          '</div>',
          '<hr>'
        ].join('\n')
      ).join('\n\n'));


    /** Combine all the markdowns together */
    const combined =
      ['../PROJECT.md', '../client/src/assets/FEATURES.md']
        .map(filename => readFileSync(filename))
        .join('\n');

    const toc = combined
      .split(/[\r\n]+/)
      .reduce((headers, line) => {
        const [, { length }, title] = /^(#+) (.+)/.exec(line) || ['', '', ''];
        if (title && length <= 2) {
          const tabs = new Array(length - 1).fill('\t').join('');
          const link = title.replace(/ /g, '-').replace(/[^A-Z0-9-]/ig, '').toLowerCase();
          headers.push(`${tabs}- [${title}](#${link})`);
        }
        return headers;
      }, <string[]>[])
      .slice(3)
      .join('\n');

    const DOCS = combined.replace(/(# TOC)/, `# Table of Contents\n${toc}\n\n`)

    writeFileSync('../client/src/assets/DOCS.md', DOCS);
    writeFileSync('../README.md', DOCS.replace(/src="\.\//g, 'src="./client/src/assets/'));

  });

});

