module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'step-definitions/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: [
      'summary',
      'progress-bar',
      ['html', 'test-results/cucumber-report.html'],
      ['json', 'test-results/cucumber-report.json']
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    timeout: 90000
  }
};
