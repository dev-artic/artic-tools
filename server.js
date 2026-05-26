const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// API to save DATA and trigger git automation
app.post('/api/save', (req, res) => {
  const data = req.body;
  if (!data) {
    return res.status(400).json({ success: false, error: 'No data provided' });
  }

  const filePath = path.join(__dirname, 'data.json');

  // 1. Write updated data to data.json
  fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Failed to write data.json:', err);
      return res.status(500).json({ success: false, error: 'Failed to write data on server' });
    }

    console.log('Successfully saved data.json locally.');

    // 2. Git Automation
    // First, check if inside a git repository
    exec('git status', { cwd: __dirname }, (statusErr) => {
      if (statusErr) {
        console.warn('Not a git repository or git not installed. Skipping git push.');
        return res.json({
          success: true,
          gitPushed: false,
          message: '로컬 저장은 완료되었으나, Git 저장소가 아니거나 Git이 설치되어 있지 않아 Push는 건너뛰었습니다.'
        });
      }

      // If it is a git repo, add, commit and push
      const gitCmd = 'git add data.json && git commit -m "auto: update paytable data" && git push';
      exec(gitCmd, { cwd: __dirname }, (execErr, stdout, stderr) => {
        if (execErr) {
          console.error('Git push failed:', stderr || execErr.message);
          return res.json({
            success: true,
            gitPushed: false,
            message: '로컬 저장은 완료되었으나, 원격 Git Push에 실패했습니다. (인증 만료 또는 Remote 설정 확인 필요)'
          });
        }

        console.log('Git push succeeded:', stdout);
        return res.json({
          success: true,
          gitPushed: true,
          message: '로컬 저장 및 Git 원격 Push가 성공적으로 완료되었습니다!'
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  artic. PTR Paytable Server running at:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`==================================================`);
});
