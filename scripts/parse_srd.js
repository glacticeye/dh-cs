const fs = require('fs');
const path = require('path');

const SRD_PATH = path.join(__dirname, '../srd');
const OUTPUT_PATH = path.join(__dirname, '../supabase/seed_library.sql');

const escapeSql = (str) => {
  if (!str) return '';
  return str.replace(/'/g, "''");
};

const createInsert = (id, type, name, domain, tier, data) => {
  const finalName = toTitleCase(cleanMarkdown(name));
  const json = JSON.stringify(data).replace(/'/g, "''");
  
  const domainVal = domain ? `'${escapeSql(domain)}'` : 'NULL';
  const tierVal = tier ? tier : 'NULL';

  return `INSERT INTO public.library (id, type, name, domain, tier, data) VALUES ('${escapeSql(id)}', '${escapeSql(type)}', '${escapeSql(finalName)}', ${domainVal}, ${tierVal}, '${json}'::jsonb) ON CONFLICT (id) DO NOTHING;`;
};

let sqlOutput = [];
let subclassToParentClassMap = new Map();

// Manual link stripper to avoid regex issues
const stripLinks = (text) => {
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] === '[') {
      const closingBracket = text.indexOf(']', i);
      if (closingBracket !== -1 && text[closingBracket + 1] === '(') {
        const closingParen = text.indexOf(')', closingBracket);
        if (closingParen !== -1) {
          // Found a link! Append the text inside []
          result += text.substring(i + 1, closingBracket);
          i = closingParen + 1;
          continue;
        }
      }
    }
    result += text[i];
    i++;
  }
  return result;
};

// Helper to strip ALL common Markdown elements
const cleanMarkdown = (text) => {
  if (!text) return '';
  
  let cleaned = stripLinks(text);
  
  // Simple regexes for other markdown that haven't caused issues
  cleaned = cleaned.replace(/^#+\s*/, ''); // Headers
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');   // Italics
  
  return cleaned.trim();
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  ).replace(/-/g, ' ');
};

const slugify = (text) => cleanMarkdown(text).toLowerCase().replace(/[^a-z0-9]+/g, '-');

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
    
    const rawTitle = lines[0];
    const title = toTitleCase(cleanMarkdown(rawTitle));
    
    let level = 0;
    let domain = '';
    let type = 'ability';
    let recallCost = 0;
    let description = [];
    let isCollectingDescription = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('>')) {
        const meta = line.replace(/^>\s*/, '');
        const levelMatch = meta.match(/Level\s+(\d+)\s+([A-Za-z-]+)\s+(.+)/);
        if (levelMatch) {
            level = parseInt(levelMatch[1]);
            domain = levelMatch[2];
            let rawType = cleanMarkdown(levelMatch[3]).toLowerCase();
            if (rawType.includes('spell')) type = 'spell';
            else if (rawType.includes('grimoire')) type = 'grimoire';
            else type = 'ability';
        }
        const recallCostMatch = meta.match(/Recall Cost:?\s*(\d+)/);
        if (recallCostMatch) {
            recallCost = parseInt(recallCostMatch[1]);
        }
      } else if (line === '' && !isCollectingDescription) {
        isCollectingDescription = true;
      } else {
        description.push(line);
      }
    }

    const id = `ability-${slugify(domain)}-${slugify(title)}`;
    const fullText = description.join('\n').trim();

    const data = {
      level: level,
      recall_cost: recallCost,
      markdown: fullText,
      domain: domain,
      type: type
    };

    sqlOutput.push(createInsert(id, type, title, domain, level, data));
  });
}

function processAncestries() {
    const pathDir = path.join(SRD_PATH, 'ancestries');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const rawTitle = lines[0];
        const title = toTitleCase(cleanMarkdown(rawTitle));
        const description = lines.slice(1).join('\n').trim();
        
        const id = `ancestry-${slugify(title)}`;
        const data = { markdown: description };

        sqlOutput.push(createInsert(id, 'ancestry', title, null, null, data));
    });
}

function processCommunities() {
    const pathDir = path.join(SRD_PATH, 'communities');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const rawTitle = lines[0];
        const title = toTitleCase(cleanMarkdown(rawTitle));
        const description = lines.slice(1).join('\n').trim();
        
        const id = `community-${slugify(title)}`;
        const data = { markdown: description };

        sqlOutput.push(createInsert(id, 'community', title, null, null, data));
    });
}

function processClasses() {
    const pathDir = path.join(SRD_PATH, 'classes');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const rawTitle = lines[0];
        const title = toTitleCase(cleanMarkdown(rawTitle));
        const classId = `class-${slugify(title)}`;
        
        let domains = [];
        const domainLine = lines.find(l => l.includes('DOMAINS:'));
        if (domainLine) {
            const domainText = domainLine.split('DOMAINS:')[1] ? domainLine.split('DOMAINS:')[1].trim() : '';
            // Manual extraction for domains too
            domains = domainText.split('&').map(d => cleanMarkdown(d.trim()));
        }
        
        let startingHp = 0;
        const hpLine = lines.find(l => l.includes('STARTING HIT POINTS:'));
        if (hpLine) {
            const match = hpLine.match(/STARTING HIT POINTS:\s*(\d+)/);
            if (match) startingHp = parseInt(match[1]);
        }

        let startingStress = 0;
        const stressLine = lines.find(l => l.includes('STARTING STRESS:'));
        if (stressLine) {
            const match = stressLine.match(/STARTING STRESS:\s*(\d+)/);
            if (match) startingStress = parseInt(match[1]);
        }

        let startingEvasion = 0;
        const evasionLine = lines.find(l => l.includes('STARTING EVASION:'));
        if (evasionLine) {
            const match = evasionLine.match(/STARTING EVASION:\s*(\d+)/);
            if (match) startingEvasion = parseInt(match[1]);
        }

        let startingArmorScore = 0;
        const classItemsLine = lines.find(l => l.includes('CLASS ITEMS:'));
        if (classItemsLine) {
          const classItemText = classItemsLine.split('CLASS ITEMS:')[1].trim();
          if (classItemText.includes('Light Leather Armor')) {
            startingArmorScore = 0;
          } else if (classItemText.includes('Chainmail Armor')) {
            startingArmorScore = 4;
          }
        }

        // --- Extract Class Feature ---
        let classFeature = { name: '', description: '' };
        const featureHeaderIndex = lines.findIndex(l => l.match(/^##\s*CLASS FEATURE/i));
        
        if (featureHeaderIndex !== -1) {
            let featureText = [];
            let i = featureHeaderIndex + 1;
            // Capture text until the next header (##) or end of file
            while (i < lines.length && !lines[i].startsWith('## ')) {
                if (lines[i].trim() !== '') {
                    featureText.push(lines[i].trim());
                }
                i++;
            }
            
            const rawFeatureText = featureText.join('\n');
            
            // Try to extract bolded name: ***Rally:*** or **Rally:**
            const nameMatch = rawFeatureText.match(/^\*\*\*(.*?):\*\*\*\s*(.*)/s) || rawFeatureText.match(/^\*\*(.*?):\*\*\s*(.*)/s);
            
            if (nameMatch) {
                classFeature.name = nameMatch[1].trim();
                classFeature.description = nameMatch[2].trim();
            } else {
                // Fallback if no standard format found
                classFeature.name = 'Class Feature';
                classFeature.description = rawFeatureText;
            }
        }

        const subclassSectionIndex = lines.findIndex(line => line.includes('SUBCLASSES'));
        if (subclassSectionIndex !== -1) {
            let subclassLine = '';
            for(let i = subclassSectionIndex + 1; i < Math.min(subclassSectionIndex + 5, lines.length); i++) {
                if(lines[i].trim().length > 0) {
                    subclassLine = lines[i];
                    break;
                }
            }

            if (subclassLine) {
                // Use simple link stripper to extract names. 
                // The line is "Choose either the **[Name](Path)** or **[Name](Path)** subclass."
                // stripLinks will convert it to "Choose either the **Name** or **Name** subclass."
                // This doesn't help us get the names separately easily.
                
                // Manual matching for links
                const matches = [];
                let i = 0;
                while (i < subclassLine.length) {
                    if (subclassLine[i] === '[') {
                        const closingBracket = subclassLine.indexOf(']', i);
                        if (closingBracket !== -1 && subclassLine[closingBracket + 1] === '(') {
                            const closingParen = subclassLine.indexOf(')', closingBracket);
                            if (closingParen !== -1) {
                                const name = subclassLine.substring(i + 1, closingBracket);
                                matches.push(name);
                                i = closingParen + 1;
                                continue;
                            }
                        }
                    }
                    i++;
                }
                
                if (matches.length > 0) {
                    matches.forEach(subclassName => {
                        const cleanedName = cleanMarkdown(subclassName);
                        const subclassId = `subclass-${slugify(cleanedName)}`;
                        subclassToParentClassMap.set(subclassId, classId);
                        console.log(`Mapped ${subclassId} to ${classId}`);
                    });
                }
            }
        }

        const description = lines.slice(1).join('\n').trim();
        const data = {
          markdown: description,
          domains: domains,
          starting_hp: startingHp,
          starting_stress: startingStress,
          starting_evasion: startingEvasion,
          starting_armor_score: startingArmorScore,
          class_items_raw: classItemsLine ? classItemsLine.split('CLASS ITEMS:')[1].trim() : '',
          class_feature: classFeature
        };

        sqlOutput.push(createInsert(classId, 'class', title, null, null, data));
    });
}

function processSubclasses() {
    const pathDir = path.join(SRD_PATH, 'subclasses');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const rawTitle = lines[0];
        const title = toTitleCase(cleanMarkdown(rawTitle));
        const description = lines.slice(1).join('\n').trim();
        
        const id = `subclass-${slugify(title)}`;
        
        const parentClassId = subclassToParentClassMap.get(id) || null;
        
        const data = { 
            markdown: description,
            parent_class_id: parentClassId
        };

        sqlOutput.push(createInsert(id, 'subclass', title, null, null, data));
    });
}

function processWeapons() {
    const pathDir = path.join(SRD_PATH, 'weapons');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const rawTitle = lines[0];
        const title = toTitleCase(cleanMarkdown(rawTitle));
        
        let trait = '';
        let range = '';
        let damage = '';
        let burden = '';
        let tier = 1;
        let feature = '';
        let weaponType = '';

        lines.forEach(line => {
            const traitLineMatch = line.match(/\*\*Trait:\*\*\s*([^;]+);\s*\*\*Range:\*\*\s*([^;]+);\s*\*\*Damage:\*\*\s*([^;]+);\s*\*\*Burden:\*\*\s*(.*)/);
            if (traitLineMatch) {
                trait = traitLineMatch[1].trim();
                range = traitLineMatch[2].trim();
                damage = traitLineMatch[3].trim();
                burden = traitLineMatch[4].trim();
            } else if (line.includes('**Feature:**')) {
                feature = cleanMarkdown(line.replace('**Feature:**', '').trim().replace(/^—$/, ''));
            } else if (line.includes('Weapon - Tier')) {
                const match = line.match(/Tier\s+(\d+)/);
                if (match) tier = parseInt(match[1]);
            } else if (line.includes('Primary Weapon - Tier') || line.includes('Secondary Weapon - Tier')) {
                weaponType = line.includes('Primary') ? 'Primary' : 'Secondary';
            }
        });
        
        const id = `weapon-${slugify(title)}`;
        const data = {
            trait,
            range,
            damage,
            burden,
            feature,
            weapon_type: weaponType,
            markdown: content
        };

        sqlOutput.push(createInsert(id, 'weapon', title, null, tier, data));
    });
}

function processArmor() {
    const pathDir = path.join(SRD_PATH, 'armor');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const rawTitle = lines[0];
        const title = toTitleCase(cleanMarkdown(rawTitle));
        
        let baseScore = 0;
        let baseThresholds = '';
        let tier = 1;
        let feature = '';

        lines.forEach(line => {
            const thresholdsLineMatch = line.match(/\*\*Base Thresholds:\*\*\s*(.*?);\s*\*\*Base Score:\*\*\s*(\d+)/);
            if (thresholdsLineMatch) {
                baseThresholds = thresholdsLineMatch[1].trim();
                baseScore = parseInt(thresholdsLineMatch[2]);
            } else if (line.includes('**Feature:**')) {
                feature = cleanMarkdown(line.replace('**Feature:**', '').trim().replace(/^—$/, ''));
            } else if (line.includes('Armor - Tier')) {
                const match = line.match(/Tier\s+(\d+)/);
                if (match) tier = parseInt(match[1]);
            }
        });
        
        const id = `armor-${slugify(title)}`;
        const data = {
            base_score: baseScore,
            base_thresholds: baseThresholds,
            feature,
            markdown: content
        };

        sqlOutput.push(createInsert(id, 'armor', title, null, tier, data));
    });
}

function processConsumables() {
    const pathDir = path.join(SRD_PATH, 'consumables');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const rawTitle = lines[0];
        const title = toTitleCase(cleanMarkdown(rawTitle));
        
        const description = lines.slice(1).join('\n').trim();

        const id = `consumable-${slugify(title)}`;
        const data = { 
            markdown: description
        };
        
        sqlOutput.push(createInsert(id, 'consumable', title, null, null, data));
    });
}

function processAdversaries() {
    const pathDir = path.join(SRD_PATH, 'adversaries');
    if (!fs.existsSync(pathDir)) return;
    
    const files = fs.readdirSync(pathDir);
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const { content, lines } = parseMarkdownFile(path.join(pathDir, file));
        const rawTitle = lines[0];
        const title = toTitleCase(cleanMarkdown(rawTitle));
        
        let tier = 1;
        const tierLine = lines.find(l => l.includes('***Tier'));
        if (tierLine) {
            const match = tierLine.match(/Tier\s+(\d+)/);
            if (match) tier = parseInt(match[1]);
        }

        const id = `adversary-${slugify(title)}`;
        const data = { markdown: content };

        sqlOutput.push(createInsert(id, 'adversary', title, null, tier, data));
    });
}


// Run
try {
    sqlOutput = []; 
    subclassToParentClassMap = new Map();

    processClasses(); 
    processSubclasses();
    processAbilities();
    processAncestries();
    processCommunities();
    processWeapons();
    processArmor();
    processConsumables();
    processAdversaries();

    fs.writeFileSync(OUTPUT_PATH, sqlOutput.join('\n'));
    console.log(`SQL Seed file generated at: ${OUTPUT_PATH}`);
    console.log(`Total entries: ${sqlOutput.length}`);
} catch (err) {
    console.error('Error generating seed SQL:', err);
}