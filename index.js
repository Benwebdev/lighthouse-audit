import fs from 'fs'; 
import lighthouse from 'lighthouse'; 
import chromeLauncher from 'chrome-launcher'; 
import objectToCSV from 'objects-to-csv'; 

const camelString = (string) => string.replace(/-./g, (x) => x.toUpperCase()[1]);

const websiteAudit = async (website, i) => {
    const browser = await chromeLauncher.launch({ chromeFlags: ['--headless']}); 
    const options = {
        logLevel: 'info',
        output: 'html',
        onlyCategories: ['performance'],
        port: browser.port,
    }

    const auditRunner = await lighthouse(website, options);

    console.log('Report is done for', auditRunner.lhr.finalUrl);
    console.log('Performance score was', auditRunner.lhr.categories.performance.score * 100);

    const requiredAuditsNames = [
        'first-contentful-paint',
        'speed-index',
        'largest-contentful-paint',
        'interactive',
        'total-blocking-time',
        'cumulative-layout-shift',
    ];

    const requiredAudits = {};
    for (let i = 0; i < requiredAuditsNames.length; i++) {
      const auditName = requiredAuditsNames[i];
      requiredAudits[camelString(auditName)] =+ auditRunner.lhr.audits[auditName].numericValue.toFixed(
        3,
      );
    }
    requiredAudits.performanceScore = auditRunner.lhr.categories.performance.score * 100;
  
    await browser.kill();
    return requiredAudits;
}

const gatherAuditData = async (website, count) => {
    const values = [];
  
    for (let i = 0; i < count; i++) {
      const performance = await websiteAudit(`${website}`, i);
      values.push(performance);
    }
  
    const csv = new objectToCSV(values);
    await csv.toDisk(`./${website}/data.csv`);
};

gatherAuditData('www.benline.co.uk', 100);
