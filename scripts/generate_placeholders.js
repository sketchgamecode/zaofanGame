const fs = require('fs');
const path = require('path');
const https = require('https');

const ASSETS_DIR = path.join(__dirname, '../public/assets');

// 定义要生成的目录结构
const DIRS = [
  'ui',
  'backgrounds',
  'npcs',
  'items',
  'sfx'
];

// 定义要生成的资源清单 (基于我们的 Spec)
const ASSETS_TO_GENERATE = [
  // 背景图 (1024x1024)
  { path: 'backgrounds/bg_weapon_shop.png', text: 'Weapon Shop BG', size: '1024x1024' },
  { path: 'backgrounds/bg_magic_shop.png', text: 'Magic Shop BG', size: '1024x1024' },
  
  // NPC立绘 (512x512)
  { path: 'npcs/npc_blacksmith.png', text: 'Blacksmith', size: '512x512' },
  { path: 'npcs/npc_wizard.png', text: 'Wizard', size: '512x512' },
  
  // 史诗级固定装备 (128x128) - 取自 Demo 数据
  { path: 'items/item_wpn_epic_001.png', text: 'wpn_epic_001', size: '128x128' },
  { path: 'items/item_wpn_epic_002.png', text: 'wpn_epic_002', size: '128x128' },
  { path: 'items/item_body_epic_001.png', text: 'body_epic_001', size: '128x128' },
  { path: 'items/item_head_epic_001.png', text: 'head_epic_001', size: '128x128' },
  { path: 'items/item_ring_legendary_001.png', text: 'ring_leg_001', size: '128x128' },
  { path: 'items/item_offhand_epic_001.png', text: 'offhand_epic_01', size: '128x128' },
  { path: 'items/item_neck_epic_001.png', text: 'neck_epic_001', size: '128x128' },
  { path: 'items/item_wpn_legendary_001.png', text: 'wpn_leg_001', size: '128x128' },
  { path: 'items/item_belt_epic_001.png', text: 'belt_epic_001', size: '128x128' },
  
  // UI 元素 (64x64)
  { path: 'ui/icon_copper.png', text: 'Copper', size: '64x64' },
  { path: 'ui/icon_token.png', text: 'Token', size: '64x64' },
  { path: 'ui/btn_refresh.png', text: 'Refresh', size: '128x64' },
];

// 批量生成普通装备占位图 (每个槽位生成 5 个变种)
const SLOTS = ['weapon', 'body', 'head', 'feet', 'hands', 'ring', 'neck', 'belt', 'offHand', 'trinket'];
for (const slot of SLOTS) {
  for (let i = 1; i <= 5; i++) {
    const idx = i.toString().padStart(2, '0');
    ASSETS_TO_GENERATE.push({
      path: `items/item_${slot}_${idx}.png`,
      text: `${slot}_${idx}`,
      size: '128x128'
    });
  }
}

// 辅助函数：创建目录
function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// 辅助函数：下载图片
function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// 主干执行
async function main() {
  console.log('Starting placeholder generation...');
  
  // 1. 初始化所有目录
  ensureDirExists(ASSETS_DIR);
  DIRS.forEach(dir => ensureDirExists(path.join(ASSETS_DIR, dir)));
  
  let successCount = 0;
  
  // 2. 遍历并下载
  for (let i = 0; i < ASSETS_TO_GENERATE.length; i++) {
    const asset = ASSETS_TO_GENERATE[i];
    const fullPath = path.join(ASSETS_DIR, asset.path);
    
    // 如果已经存在就跳过
    if (fs.existsSync(fullPath)) {
      console.log(`[Skipped] ${asset.path} already exists.`);
      continue;
    }
    
    // 构造带文字的占位图 URL (使用 placehold.co)
    // 采用深灰色背景，白色粗体字
    const encodedText = encodeURIComponent(asset.text);
    const url = `https://placehold.co/${asset.size}/333333/FFFFFF.png?text=${encodedText}`;
    
    try {
      console.log(`[${i+1}/${ASSETS_TO_GENERATE.length}] Downloading: ${asset.path}...`);
      await downloadImage(url, fullPath);
      successCount++;
    } catch (err) {
      console.error(`Failed to download ${asset.path}:`, err.message);
    }
    
    // 简单限流，防止被 API ban 掉
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\n✅ Done! Generated ${successCount} placeholder images in /public/assets/`);
}

main();
