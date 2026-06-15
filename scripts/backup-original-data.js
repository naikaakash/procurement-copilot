const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'procurement_data_sample');
const destDir = path.join(__dirname, '..', 'procurement_data_sample_original');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  const files = fs.readdirSync(from);
  for (const file of files) {
    const fromPath = path.join(from, file);
    const toPath = path.join(to, file);
    const stat = fs.lstatSync(fromPath);
    if (stat.isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  }
}

try {
  if (fs.existsSync(destDir)) {
    console.log('Backup folder already exists. Skipping backup to protect existing backup data.');
  } else {
    copyFolderSync(srcDir, destDir);
    console.log('Successfully backed up procurement_data_sample to procurement_data_sample_original!');
  }
} catch (e) {
  console.error('Failed to back up data:', e);
  process.exit(1);
}
