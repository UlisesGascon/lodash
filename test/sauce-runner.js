const { Builder, By, until } = require('selenium-webdriver');

const SAUCE_USERNAME = process.env.SAUCE_USERNAME;
const SAUCE_ACCESS_KEY = process.env.SAUCE_ACCESS_KEY;
const COMMIT_SHA = process.env.COMMIT_SHA || 'latest';
const SAUCE_REGION = process.env.SAUCE_REGION;

const platforms = [
  ['Windows 10', 'chrome', '100'],
];


// const platforms = [
//   ['Windows 10', 'chrome', '53'],
//   ['Windows 10', 'firefox', '49'],
//   ['Windows 10', 'internet explorer', '11'],
//   ['Windows 8', 'internet explorer', '10'],
//   ['Windows 7', 'internet explorer', '9'],
//   ['Windows 7', 'internet explorer', '8'],
//   ['macOS 10.12', 'safari', '10'],
//   ['OS X 10.11', 'safari', '9'],
//   ['Linux', 'android', '5.1'],
// ];

const testUrls = [
  'http://localhost:9001/test/index.html',
  'http://localhost:9001/test/fp.html',
  'http://localhost:9001/test/backbone.html',
  'http://localhost:9001/test/underscore.html'
];

async function runTest(platform, url) {
  const [platformName, browserName, browserVersion] = platform;

  const capabilities = {
    browserName,
    platformName,
    // Disable W3C for legacy Chrome/Firefox
    ...(browserName === 'chrome' || browserName === 'firefox'
      ? { 'goog:chromeOptions': { w3c: false } }
      : {}),
    browserVersion,
    'sauce:options': {
      name: `Legacy test (${COMMIT_SHA}): ${browserName} ${browserVersion} - ${url}`,
      username: SAUCE_USERNAME,
      accessKey: SAUCE_ACCESS_KEY,
      build: `legacy-tests-${COMMIT_SHA}-${Date.now()}`,
      seleniumVersion: '3.141.59', // IMPORTANT: Force Selenium 3
    }
  };

  const driver = await new Builder()
    .withCapabilities(capabilities)
    .usingServer(`https://${SAUCE_USERNAME}:${SAUCE_ACCESS_KEY}@ondemand.${SAUCE_REGION}.saucelabs.com/wd/hub`)
    //.usingServer(`https://ondemand.${SAUCE_REGION}.saucelabs.com/wd/hub`)
    .build();

  try {
    await driver.get(url);
    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(),'0 failed')]")),
      60000
    );
    console.log(`✅ Passed: ${url} on ${browserName} ${browserVersion}`);
    await driver.executeScript('sauce:job-result=passed');
  } catch (err) {
    console.error(`❌ Failed: ${url} on ${browserName} ${browserVersion}`);
    console.error('Error name:', err.name);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('Full error:', err);
    try {
      await driver.executeScript('sauce:job-result=failed');
    } catch (scriptErr) {
      console.warn('Could not set job result on Sauce:', scriptErr.message);
    }
  } finally {
    await driver.quit();
  }
}

(async () => {
  for (const platform of platforms) {
    for (const url of testUrls) {
      await runTest(platform, url);
    }
  }
})();
