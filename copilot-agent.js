#!/usr/bin/env node

/**
 * Copilot Cloud Agent - GitHub Integration
 * Otomatik kod üretme, API yönetimi ve deployment
 */

const { Octokit } = require('@octokit/rest');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

class CopilotAgent {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.repo = process.env.GITHUB_REPO || 'K';
    this.owner = process.env.GITHUB_OWNER || 'acelehesap10-boop';
    this.octokit = null;
    this.apiGateway = process.env.API_GATEWAY_URL || 'http://localhost:8080';
    
    if (!this.token) {
      console.warn(chalk.yellow('⚠ GITHUB_TOKEN bulunamadı. Bazı özellikler sınırlı olacaktır.'));
    } else {
      this.octokit = new Octokit({ auth: this.token });
    }
  }

  /**
   * API Gateway'e istek gönder
   */
  async callGateway(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${this.apiGateway}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token || 'demo-token'}`
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(`API Gateway Error: ${error.message}`);
    }
  }

  /**
   * Health Check
   */
  async healthCheck() {
    try {
      const health = await this.callGateway('/health');
      console.log(chalk.green('✓ API Gateway Healthy'));
      console.log(chalk.blue('Services:'), health.services);
      return true;
    } catch (error) {
      console.log(chalk.red('✗ API Gateway Down'));
      return false;
    }
  }

  /**
   * Repositories listele
   */
  async listRepositories() {
    if (!this.octokit) {
      console.log(chalk.red('✗ GitHub token gerekli'));
      return;
    }

    try {
      console.log(chalk.blue('📦 Repositories yükleniyor...'));
      
      const repos = await this.octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 10
      });

      repos.data.forEach((repo) => {
        console.log(chalk.cyan(`  • ${repo.name}`));
        console.log(chalk.gray(`    ${repo.description || 'No description'}`));
        console.log(chalk.gray(`    Stars: ${repo.stargazers_count} | Forks: ${repo.forks_count}\n`));
      });
    } catch (error) {
      console.log(chalk.red(`✗ Error: ${error.message}`));
    }
  }

  /**
   * Pull Requests listele
   */
  async listPullRequests() {
    if (!this.octokit) {
      console.log(chalk.red('✗ GitHub token gerekli'));
      return;
    }

    try {
      console.log(chalk.blue('📋 Pull Requests yükleniyor...'));
      
      const prs = await this.octokit.pulls.list({
        owner: this.owner,
        repo: this.repo,
        state: 'open'
      });

      if (prs.data.length === 0) {
        console.log(chalk.yellow('Açık PR bulunamadı'));
        return;
      }

      prs.data.forEach((pr) => {
        console.log(chalk.cyan(`  #${pr.number}: ${pr.title}`));
        console.log(chalk.gray(`    Author: ${pr.user.login} | Updated: ${pr.updated_at}\n`));
      });
    } catch (error) {
      console.log(chalk.red(`✗ Error: ${error.message}`));
    }
  }

  /**
   * Issues listele
   */
  async listIssues() {
    if (!this.octokit) {
      console.log(chalk.red('✗ GitHub token gerekli'));
      return;
    }

    try {
      console.log(chalk.blue('🔴 Issues yükleniyor...'));
      
      const issues = await this.octokit.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: 'open'
      });

      if (issues.data.length === 0) {
        console.log(chalk.yellow('Açık issue bulunamadı'));
        return;
      }

      issues.data.forEach((issue) => {
        console.log(chalk.cyan(`  #${issue.number}: ${issue.title}`));
        console.log(chalk.gray(`    Author: ${issue.user.login} | Labels: ${issue.labels.map(l => l.name).join(', ') || 'none'}\n`));
      });
    } catch (error) {
      console.log(chalk.red(`✗ Error: ${error.message}`));
    }
  }

  /**
   * Branch oluştur
   */
  async createBranch(branchName, baseBranch = 'main') {
    if (!this.octokit) {
      console.log(chalk.red('✗ GitHub token gerekli'));
      return;
    }

    try {
      console.log(chalk.blue(`🌿 Branch oluşturuluyor: ${branchName}...`));
      
      // Get base branch ref
      const baseRef = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${baseBranch}`
      });

      // Create new branch
      const newBranch = await this.octokit.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha: baseRef.data.object.sha
      });

      console.log(chalk.green(`✓ Branch oluşturuldu: ${branchName}`));
      return newBranch.data;
    } catch (error) {
      console.log(chalk.red(`✗ Error: ${error.message}`));
    }
  }

  /**
   * File oluştur/düzenle
   */
  async createOrUpdateFile(filePath, content, message, branch = 'main') {
    if (!this.octokit) {
      console.log(chalk.red('✗ GitHub token gerekli'));
      return;
    }

    try {
      console.log(chalk.blue(`📝 File güncelleştiriliyor: ${filePath}...`));
      
      const encodedContent = Buffer.from(content).toString('base64');

      // Try to get existing file
      let sha;
      try {
        const existingFile = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          ref: branch
        });
        sha = existingFile.data.sha;
      } catch (e) {
        // File doesn't exist, that's ok
      }

      const result = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message,
        content: encodedContent,
        branch,
        ...(sha && { sha })
      });

      console.log(chalk.green(`✓ File güncelleştirildi`));
      return result.data;
    } catch (error) {
      console.log(chalk.red(`✗ Error: ${error.message}`));
    }
  }

  /**
   * Pull Request oluştur
   */
  async createPullRequest(title, body, headBranch, baseBranch = 'main') {
    if (!this.octokit) {
      console.log(chalk.red('✗ GitHub token gerekli'));
      return;
    }

    try {
      console.log(chalk.blue(`📤 Pull Request oluşturuluyor...`));
      
      const pr = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title,
        body,
        head: headBranch,
        base: baseBranch
      });

      console.log(chalk.green(`✓ PR oluşturuldu: #${pr.data.number}`));
      console.log(chalk.cyan(`  URL: ${pr.data.html_url}`));
      return pr.data;
    } catch (error) {
      console.log(chalk.red(`✗ Error: ${error.message}`));
    }
  }

  /**
   * API Status kontrol et
   */
  async checkAPIStatus() {
    try {
      console.log(chalk.blue('🔍 API Status kontrol ediliyor...'));
      const data = await this.callGateway('/api-docs');
      
      console.log(chalk.green('✓ API Endpoints:'));
      Object.entries(data.endpoints || {}).forEach(([path, description]) => {
        console.log(chalk.cyan(`  ${path}: ${description}`));
      });
      return true;
    } catch (error) {
      console.log(chalk.red(`✗ API Down: ${error.message}`));
      return false;
    }
  }

  /**
   * Deployment hazırlık
   */
  async prepareDeployment() {
    console.log(chalk.blue('🚀 Deployment hazırlığı başlatılıyor...'));
    
    const steps = [
      { name: 'Health Check', action: () => this.healthCheck() },
      { name: 'API Status', action: () => this.checkAPIStatus() },
      { name: 'Repositories', action: () => this.listRepositories() }
    ];

    for (const step of steps) {
      console.log(chalk.yellow(`\n${step.name}...`));
      await step.action();
    }

    console.log(chalk.green('\n✓ Deployment hazır!'));
  }

  /**
   * Interaktif Menu
   */
  async showMenu() {
    console.clear();
    console.log(chalk.cyan.bold('╔═══════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║  GitHub Copilot Cloud Agent v1.0     ║'));
    console.log(chalk.cyan.bold('╚═══════════════════════════════════════╝\n'));

    const choices = [
      { name: '✓ Health Check', value: 'health' },
      { name: '📋 List Repositories', value: 'repos' },
      { name: '📤 List Pull Requests', value: 'prs' },
      { name: '🔴 List Issues', value: 'issues' },
      { name: '🌿 Create Branch', value: 'branch' },
      { name: '📝 Create/Update File', value: 'file' },
      { name: '📤 Create Pull Request', value: 'pr' },
      { name: '🚀 Prepare Deployment', value: 'deploy' },
      { name: '❌ Exit', value: 'exit' }
    ];

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select action:',
        choices
      }
    ]);

    switch (answer.action) {
      case 'health':
        await this.healthCheck();
        break;
      case 'repos':
        await this.listRepositories();
        break;
      case 'prs':
        await this.listPullRequests();
        break;
      case 'issues':
        await this.listIssues();
        break;
      case 'branch':
        const branchName = await inquirer.prompt([
          { type: 'input', name: 'name', message: 'Branch name:' }
        ]);
        await this.createBranch(branchName.name);
        break;
      case 'file':
        const fileInfo = await inquirer.prompt([
          { type: 'input', name: 'path', message: 'File path:' },
          { type: 'input', name: 'content', message: 'Content:' },
          { type: 'input', name: 'message', message: 'Commit message:' }
        ]);
        await this.createOrUpdateFile(fileInfo.path, fileInfo.content, fileInfo.message);
        break;
      case 'pr':
        const prInfo = await inquirer.prompt([
          { type: 'input', name: 'title', message: 'PR Title:' },
          { type: 'input', name: 'body', message: 'PR Body:' },
          { type: 'input', name: 'head', message: 'Head branch:', default: 'develop' }
        ]);
        await this.createPullRequest(prInfo.title, prInfo.body, prInfo.head);
        break;
      case 'deploy':
        await this.prepareDeployment();
        break;
      case 'exit':
        console.log(chalk.green('\n✓ Goodbye!'));
        process.exit(0);
    }

    setTimeout(() => this.showMenu(), 2000);
  }
}

// Main
async function main() {
  const agent = new CopilotAgent();
  await agent.showMenu();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CopilotAgent;
