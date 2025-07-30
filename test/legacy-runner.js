const { Builder, By, until } = require('selenium-webdriver');

async function runTest(capabilities) {
  const server = `https://${process.env.BROWSERSTACK_USERNAME}:${process.env.BROWSERSTACK_ACCESS_KEY}` +
                 '@hub-cloud.browserstack.com/wd/hub';

  const driver = await new Builder()
    .usingServer(server)
    .withCapabilities(capabilities)
    .build();

  try {
    const pages = ['index.html', 'fp.html', 'backbone.html', 'underscore.html'];
    for (const page of pages) {
      console.log(`Running test: ${page}`);
      await driver.get(`http://localhost:9001/test/${page}`);
      const result = await driver.wait(
        until.elementLocated(By.xpath("//*[contains(text(), '0 failed')]")),
        60000
      );
      const visible = await result.isDisplayed();
      if (!visible) throw new Error(`${page}: test failed`);
      console.log(`${page}: ✅ passed`);
    }
  } finally {
    await driver.quit();
  }
}

const commonCaps = {
  'browserstack.local': true,
  'browserstack.localIdentifier': 'github-action',
  build: 'legacy-browser-build',
  project: 'lodash',
  local: true,
};

const configs = [
  {
    browserName: 'IE',
    browserVersion: '11.0',
    os: 'Windows',
    osVersion: '10',
    name: 'Legacy - IE11',
    local: true,
  },
  {
    browserName: 'Safari',
    browserVersion: '11.1',
    os: 'OS X',
    osVersion: 'High Sierra',
    name: 'Legacy - Safari 11.1',
    local: true,
  }
];

(async () => {
  let hasErrors = false;
  for (const caps of configs) {
    const mergedCaps = { ...commonCaps, ...caps };
    try {
      await runTest(mergedCaps);
    } catch (error) {
      hasErrors = true;
      console.error(`❌ Failed: ${caps.name} - ${error.message}`);
    }
  }
    if (hasErrors) {
        console.error('Some tests failed.');
        process.exit(1);
    } else {
        console.log('All tests passed successfully!');
    }
})();