const fs = require('fs');
const path = require('path');

const versionInfo = {
  version: process.env.REACT_APP_VERSION || '1.0.0',
  buildTime: new Date().toISOString(),
  timestamp: Date.now()
};

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(
  path.join(publicDir, 'version.json'),
  JSON.stringify(versionInfo, null, 2)
);

console.log('✓ Generated public/version.json:', versionInfo);
