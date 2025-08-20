Step 0: Prerequisites

Node.js + Express backend deployed on Render: https://your-render-app.onrender.com

Your backend can handle POST requests (we’ll add the webhook route).

GitHub repo for your first assignment: reverse-string-starter

GITHUB_WEBHOOK_SECRET environment variable set on Render.

Step 1: Generate a Webhook Secret

Open terminal:

openssl rand -hex 32

Example output:

9f8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d

Add this to Render → Environment Variables:

Key: GITHUB_WEBHOOK_SECRET
Value: 9f8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d

Step 2: Add Webhook Route to Your Express App

Edit your Express backend (e.g., app.js or server.js) and add:

const crypto = require('crypto');
const express = require('express');
const logger = console; // or your logger

require('dotenv').config();

const app = express();

// Verify GitHub signature middleware
function verifyGitHubSignature(req, res, buf, encoding) {
const signature = req.get('x-hub-signature-256');
if (!signature) throw new Error('No signature found');

const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
hmac.update(buf, encoding);
const digest = `sha256=${hmac.digest('hex')}`;

if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
throw new Error('Invalid signature');
}
}

// Parse JSON with raw buffer for signature verification
app.use(express.json({ limit: '10kb', verify: verifyGitHubSignature }));

// Health check
app.get('/', (req, res) => res.status(200).json({ status: 'Render backend running' }));

// GitHub Webhook endpoint
app.post('/webhook/github', (req, res) => {
const event = req.get('x-github-event'); // e.g., workflow_run
const payload = req.body;

if (event === 'workflow_run' && payload.workflow_run) {
const repo = payload.repository?.name;
const actor = payload.sender?.login;
const status = payload.workflow_run.conclusion; // "success" | "failure"
const url = payload.workflow_run.html_url;

    logger.info(`✅ GitHub Webhook: Repo=${repo}, Actor=${actor}, Status=${status}, URL=${url}`);

}

res.status(200).json({ ok: true });
});

// Error and 404 handlers...

Make sure your app is deployed on Render after this change.

Endpoint URL:

https://your-render-app.onrender.com/webhook/github

Step 3: Add GitHub Actions Workflow

Inside your reverse-string-starter repo, create:

.github/workflows/test.yml

Content:

name: Run Tests

on:
push:
branches: [ main ]
pull_request:

jobs:
test:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v3 - name: Setup Node.js
uses: actions/setup-node@v3
with:
node-version: 18 - run: npm install - run: npm test

Push to GitHub:

git add .github/workflows/test.yml
git commit -m "Add test workflow"
git push origin main

This ensures GitHub will run tests whenever someone pushes to main.

Step 4: Add GitHub Webhook

Go to your GitHub repo → reverse-string-starter → Settings → Webhooks → Add webhook

Payload URL:

https://your-render-app.onrender.com/webhook/github

Content type: application/json

Secret: same as Render GITHUB_WEBHOOK_SECRET

Select “Workflow runs” event only

Click Add webhook ✅

Step 5: Test the Flow

Make a trivial change in your assignment, e.g., index.js:

function reverseString(str) {
return str.split("").reverse().join("");
}
module.exports = reverseString;

Commit and push:

git add .
git commit -m "Test reverse string implementation"
git push origin main

GitHub Actions will run your workflow (test.yml) automatically.

Once the workflow finishes, GitHub sends a webhook to your Render backend.

Check Render logs → you should see:

✅ GitHub Webhook: Repo=reverse-string-starter, Actor=your-username, Status=success, URL=https://github.com/...

✅ Summary of the End-to-End Flow

Student codes in Gitpod → pushes to GitHub.

GitHub Actions runs tests (.github/workflows/test.yml).

Workflow completes → triggers webhook → hits your Render endpoint.

Backend logs the assignment result (success/failure).
