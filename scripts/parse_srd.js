const fs = require('fs');
const path = require('path');

const SRD_PATH = path.join(__dirname, '../srd');
const OUTPUT_PATH = path.join(__dirname, '../client/src/data/srd_data.json');

const data = {
  domains: {},
  ancestries: [],
  communities: [],
  classes: [],
  subclasses: [],
  items: []
};

function parseMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  return { content, lines };
}

function processAbilities() {
  const abilitiesPath = path.join(SRD_PATH, 'abilities');
  if (!fs.existsSync(abilitiesPath)) return;

  const files = fs.readdirSync(abilitiesPath);
  
  files.forEach(file => {
    if (!file.endsWith('.md')) return;
    
    const { content, lines } = parseMarkdownFile(path.join(abilitiesPath, file));
    
    // Simple parsing strategy based on the format we saw
    const title = lines[0].replace(/^#\s*/, '').trim();
    
    // Extract metadata block
    // Example: > **Level 2 Blade Ability**
    //          > **Recall Cost:** 1
    let level = 0;
    let domain = '';
    let type = '';
    let recallCost = 0;
    
    let description = [];
    let isCollectingDescription = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('>')) {
        const meta = line.replace(/^>\s*/, '');
        if (meta.includes('Level')) {
          const match = meta.match(/Level\s+(\d+)\s+(\w+)\s+(.+)/);
          if (match) {
            level = parseInt(match[1]);
            domain = match[2];
            type = match[3].replace(/\*\*/g, '').trim();
          }
        } else if (meta.includes('Recall Cost')) {
          const match = meta.match(/Recall Cost:?\**\s*(\d+)/);
          if (match) {
            recallCost = parseInt(match[1]);
          }
        }
      } else if (line === '' && !isCollectingDescription) {
        isCollectingDescription = true;
      } else {
        description.push(line);
      }
    }

    if (!data.domains[domain]) {
      data.domains[domain] = [];
    }

    data.domains[domain].push({
      title,
      level,
      domain,
      type,
      recall_cost: recallCost,
      description: description.join('\n').trim(),
      id: title.toLowerCase().replace(/['\s]/g, '-')
    });
  });
}

function processAncestries() {
    const pathDir = path.join(SRD_PATH, 'ancestries');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const title = lines[0].replace(/^#\s*/, '').trim();
        // Rudimentary body extraction
        const description = lines.slice(1).join('\n').trim();
        data.ancestries.push({ name: title, description });
    });
}

function processCommunities() {
    const pathDir = path.join(SRD_PATH, 'communities');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const title = lines[0].replace(/^#\s*/, '').trim();
        const description = lines.slice(1).join('\n').trim();
        data.communities.push({ name: title, description });
    });
}

function processClasses() {
    const pathDir = path.join(SRD_PATH, 'classes');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const title = lines[0].replace(/^#\s*/, '').trim();
        // Extract domain info if available (e.g., > **• DOMAINS:** [Sage](../domains/Sage.md) & [Arcana](../domains/Arcana.md))
        let domains = [];
        const domainLine = lines.find(l => l.includes('DOMAINS:'));
        if (domainLine) {
            // simplistic extraction
            const matches = domainLine.match(/.*\[(.*?)\].*/g);
            if (matches) {
                domains = matches.map(m => m.replace(/[\\\[\]]/g, ''));
            }
        }

        const description = lines.slice(1).join('\n').trim();
        data.classes.push({ name: title, description, domains });
    });
}

function processSubclasses() {
    const pathDir = path.join(SRD_PATH, 'subclasses');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const title = lines[0].replace(/^#\s*/, '').trim();
        const description = lines.slice(1).join('\n').trim();
        
        // Try to infer parent class if mentioned, but for now just store raw
        data.subclasses.push({ name: title, description });
    });
}

function processWeapons() {
    const pathDir = path.join(SRD_PATH, 'weapons');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const title = lines[0].replace(/^#\s*/, '').trim();
        
        let item = { 
            id: title.toLowerCase().replace(/['\s]/g, '-'),
            title, 
            type: 'weapon',
            category: 'Weapon' 
        };

        lines.forEach(line => {
            if (line.includes('**Trait:**')) {
                const matches = line.match(/\*\*Trait:\*\*\s*(.*?);\s*\*\*Range:\*\*\s*(.*?);\s*\*\*Damage:\*\*\s*(.*?);\s*\*\*Burden:\*\*\s*(.*)/);
                if (matches) {
                    item.trait = matches[1].trim();
                    item.range = matches[2].trim();
                    item.damage = matches[3].trim();
                    item.burden = matches[4].trim();
                }
            }
            if (line.includes('**Feature:**')) {
                item.feature = line.replace('**Feature:**', '').trim().replace('—', '');
            }
            if (line.startsWith('*') && line.endsWith('*') && line.includes('Weapon - Tier')) {
                const meta = line.replace(/\*/g, '').trim();
                const parts = meta.split('-');
                if (parts.length >= 2) {
                    item.weaponType = parts[0].trim(); // Primary / Secondary
                    item.tier = parseInt(parts[1].replace('Tier', '').trim());
                }
            }
        });
        
        data.items.push(item);
    });
}

function processArmor() {
    const pathDir = path.join(SRD_PATH, 'armor');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const title = lines[0].replace(/^#\s*/, '').trim();
        
        let item = { 
            id: title.toLowerCase().replace(/['\s]/g, '-'),
            title, 
            type: 'armor',
            category: 'Armor'
        };

        lines.forEach(line => {
            if (line.includes('**Base Thresholds:**')) {
                const matches = line.match(/\*\*Base Thresholds:\*\*\s*(.*?);\s*\*\*Base Score:\*\*\s*(\d+)/);
                if (matches) {
                    item.baseThresholds = matches[1].trim();
                    item.baseScore = parseInt(matches[2]);
                }
            }
            if (line.includes('**Feature:**')) {
                item.feature = line.replace('**Feature:**', '').trim().replace('—', '');
            }
            if (line.startsWith('*') && line.endsWith('*') && line.includes('Armor - Tier')) {
                const meta = line.replace(/\*/g, '').trim();
                const parts = meta.split('-');
                if (parts.length >= 2) {
                    item.tier = parseInt(parts[1].replace('Tier', '').trim());
                }
            }
        });
        
        data.items.push(item);
    });
}

function processConsumables() {
    const pathDir = path.join(SRD_PATH, 'consumables');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const title = lines[0].replace(/^#\s*/, '').trim();
        
        // Description is usually lines 2 onwards until the metadata footer
        const descriptionLines = lines.slice(1).filter(l => !l.startsWith('*Consumable*') && l.trim() !== '');
        
        let item = { 
            id: title.toLowerCase().replace(/['\s]/g, '-'),
            title, 
            type: 'consumable',
            category: 'Consumable',
            description: descriptionLines.join('\n').trim()
        };
        
        data.items.push(item);
    });
}

// Run
try {
    processAbilities();
    processAncestries();
    processCommunities();
    processClasses();
    processSubclasses();
    processWeapons();
    processArmor();
    processConsumables();
    
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
    console.log(`SRD data compiled to ${OUTPUT_PATH}`);
} catch (err) {
    console.error('Error processing SRD:', err);
}