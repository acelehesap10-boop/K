#!/usr/bin/env node

/**
 * Copilot Agent CLI - Direct Test
 * API Gateway ve GitHub entegrasyonunu test et
 */

const CopilotAgent = require('./copilot-agent.js');
const chalk = require('chalk');

async function runTests() {
  const agent = new CopilotAgent();

  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║  Copilot Cloud Agent - Test Suite     ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════╝\n'));

  const tests = [
    {
      name: 'API Gateway Health Check',
      fn: () => agent.healthCheck(),
      critical: true
    },
    {
      name: 'API Status Check',
      fn: () => agent.checkAPIStatus(),
      critical: true
    },
    {
      name: 'Deployment Preparation',
      fn: () => agent.prepareDeployment(),
      critical: false
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(chalk.yellow(`\n⏳ Testing: ${test.name}...`));
      await test.fn();
      passed++;
      console.log(chalk.green(`✓ ${test.name} passed\n`));
    } catch (error) {
      failed++;
      console.log(chalk.red(`✗ ${test.name} failed: ${error.message}\n`));
      if (test.critical) {
        console.log(chalk.red('❌ Critical test failed. Stopping.'));
        process.exit(1);
      }
    }
  }

  console.log(chalk.cyan('\n╔════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  Test Results                          ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════╝'));
  console.log(chalk.green(`✓ Passed: ${passed}`));
  console.log(chalk.red(`✗ Failed: ${failed}`));
  console.log(chalk.cyan(`Total: ${passed + failed}\n`));

  if (failed === 0) {
    console.log(chalk.green.bold('All tests passed! ✨'));
    process.exit(0);
  } else {
    console.log(chalk.yellow.bold(`${failed} test(s) failed. Some features may not work.`));
    process.exit(failed > 0 ? 1 : 0);
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error(chalk.red('Fatal error:'), err);
    process.exit(1);
  });
}

module.exports = { runTests };
