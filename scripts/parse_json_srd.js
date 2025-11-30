const fs = require('fs');
const path = require('path');

const JSON_DIR = path.join(__dirname, '../srd/json');
const OUTPUT_PATH = path.join(__dirname, '../supabase/seed_library.sql');

const escapeSql = (str) => {
  if (!str) return '';
  // Replace single quotes with two single quotes for SQL escaping
  return str.replace(/'/g, "''");
};

const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
};

const createInsert = (id, type, name, domain, tier, data) => {
  const json = JSON.stringify(data).replace(/'/g, "''");
  const domainVal = domain ? `'${escapeSql(domain)}'` : 'NULL';
  const tierVal = tier ? tier : 'NULL';
  const nameVal = escapeSql(name);

  return `INSERT INTO public.library (id, type, name, domain, tier, data) VALUES ('${id}', '${type}', '${nameVal}', ${domainVal}, ${tierVal}, '${json}'::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, name = EXCLUDED.name, domain = EXCLUDED.domain, tier = EXCLUDED.tier;`;
};

let sqlOutput = [];

function processClasses() {
  const filePath = path.join(JSON_DIR, 'classes.json');
  if (!fs.existsSync(filePath)) return;
  
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  
  items.forEach(item => {
    const id = `class-${slugify(item.name)}`;
    const data = {
      description: item.description,
      starting_evasion: parseInt(item.evasion) || 0,
      starting_hp: parseInt(item.hp) || 0,
      items_text: item.items,
      domains: [item.domain_1, item.domain_2].filter(Boolean),
      hope_feature: {
        name: item.hope_feat_name,
        description: item.hope_feat_text
      },
      class_features: item.class_feats || [], // Directly use the array from JSON
      subclass_names: [item.subclass_1, item.subclass_2].filter(Boolean),
      suggested: {
        traits: item.suggested_traits,
        primary_weapon: item.suggested_primary,
        secondary_weapon: item.suggested_secondary,
        armor: item.suggested_armor
      },
      background_questions: item.backgrounds || [],
      connection_questions: item.connections || []
    };

    sqlOutput.push(createInsert(id, 'class', item.name, null, null, data));
  });
}

function processSubclasses() {
  const filePath = path.join(JSON_DIR, 'subclasses.json');
  if (!fs.existsSync(filePath)) return;
  
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  
  items.forEach(item => {
    const id = `subclass-${slugify(item.name)}`;
    
    // Attempt to map parent class by checking class descriptions or subclass lists in class objects?
    // For now, we rely on the matching Logic in the app or manual map if needed. 
    // But actually, the class objects listed subclass names!
    // Ideally we'd link them here, but the subclass JSON doesn't have "parent_class".
    // We can infer it later or just store the data.
    
    const data = {
      description: item.description,
      spellcast_trait: item.spellcast_trait,
      foundation_features: item.foundations || [],
      specialization_features: item.specializations || [],
      mastery_features: item.masteries || [],
      extras: item.extras
    };

    sqlOutput.push(createInsert(id, 'subclass', item.name, null, null, data));
  });
}

function processAncestries() {
  const filePath = path.join(JSON_DIR, 'ancestries.json');
  if (!fs.existsSync(filePath)) return;
  
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  
  items.forEach(item => {
    const id = `ancestry-${slugify(item.name)}`;
    const data = {
      description: item.description,
      features: item.feats || []
    };
    sqlOutput.push(createInsert(id, 'ancestry', item.name, null, null, data));
  });
}

function processCommunities() {
  const filePath = path.join(JSON_DIR, 'communities.json');
  if (!fs.existsSync(filePath)) return;
  
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  
  items.forEach(item => {
    const id = `community-${slugify(item.name)}`;
    const data = {
      description: item.description,
      note: item.note,
      features: item.feats || []
    };
    sqlOutput.push(createInsert(id, 'community', item.name, null, null, data));
  });
}

function processAbilities() {
  const filePath = path.join(JSON_DIR, 'abilities.json');
  if (!fs.existsSync(filePath)) return;
  
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  
  items.forEach(item => {
    const type = item.type ? item.type.toLowerCase() : 'ability'; 
    const domain = item.domain;
    const id = `${type}-${slugify(domain)}-${slugify(item.name)}`;
    const tier = parseInt(item.level) || 1;
    
    const data = {
      description: item.text,
      recall_cost: parseInt(item.recall) || 0,
      level: tier
    };
    
    sqlOutput.push(createInsert(id, type, item.name, domain, tier, data));
  });
}

function processWeapons() {
  const filePath = path.join(JSON_DIR, 'weapons.json');
  if (!fs.existsSync(filePath)) return;
  
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  
  items.forEach(item => {
    const id = `weapon-${slugify(item.name)}`;
    const tier = parseInt(item.tier) || 1;
    
    const data = {
      type: item.physical_or_magical,
      hand: item.primary_or_secondary,
      trait: item.trait,
      range: item.range,
      damage: item.damage,
      burden: item.burden,
      feature: {
        name: item.feat_name,
        text: item.feat_text
      }
    };
    
    sqlOutput.push(createInsert(id, 'weapon', item.name, null, tier, data));
  });
}

function processArmor() {
  const filePath = path.join(JSON_DIR, 'armor.json');
  if (!fs.existsSync(filePath)) return;
  
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  
  items.forEach(item => {
    const id = `armor-${slugify(item.name)}`;
    const tier = parseInt(item.tier) || 1;
    
    const data = {
      base_score: parseInt(item.base_score) || 0,
      base_thresholds: item.base_thresholds,
      feature: {
        name: item.feat_name,
        text: item.feat_text
      }
    };
    
    sqlOutput.push(createInsert(id, 'armor', item.name, null, tier, data));
  });
}

function processConsumables() {
  const filePath = path.join(JSON_DIR, 'consumables.json');
  if (!fs.existsSync(filePath)) return;
  
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  
  items.forEach(item => {
    const id = `consumable-${slugify(item.name)}`;
    const data = {
      description: item.description
    };
    sqlOutput.push(createInsert(id, 'consumable', item.name, null, null, data));
  });
}

function processAdversaries() {
    const filePath = path.join(JSON_DIR, 'adversaries.json');
    if (!fs.existsSync(filePath)) return;
    
    const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
    
    items.forEach(item => {
        const id = `adversary-${slugify(item.name)}`;
        const tier = parseInt(item.tier) || 1;
        
        const data = {
            description: item.description,
            motives: item.motives_and_tactics,
            difficulty: item.difficulty,
            thresholds: item.thresholds,
            hp: item.hp,
            stress: item.stress,
            attack: {
                modifier: item.atk,
                name: item.attack,
                range: item.range,
                damage: item.damage
            },
            features: item.feats || []
        };
        
        sqlOutput.push(createInsert(id, 'adversary', item.name, null, tier, data));
    });
}

// Post-processing to link subclasses to classes based on name matching
function linkSubclassesToClasses() {
    // This function would ideally read the class items, find the subclass IDs, and update the subclass entries
    // For simplicity in this SQL generation script, we rely on the app logic or a more complex join.
    // However, we can create a map here if we process classes first.
    
    // Since we push to sqlOutput immediately, we can't easily update previous entries without finding them in the array.
    // But we CAN use the class data to emit updates for subclasses!
    
    const classFilePath = path.join(JSON_DIR, 'classes.json');
    if (!fs.existsSync(classFilePath)) return;
    const classes = JSON.parse(fs.readFileSync(classFilePath, 'utf8').replace(/^\uFEFF/, ''));
    
    classes.forEach(cls => {
       const classId = `class-${slugify(cls.name)}`;
       const subclasses = [cls.subclass_1, cls.subclass_2].filter(Boolean);
       
       subclasses.forEach(subName => {
           const subId = `subclass-${slugify(subName)}`;
           // Update the subclass entry's JSON to include parent_class_id
           // We use a SQL update for this.
           const updateSql = `UPDATE public.library SET data = jsonb_set(data, '{parent_class_id}', '${JSON.stringify(classId)}') WHERE id = '${subId}';`;
           sqlOutput.push(updateSql);
       });
    });
}


try {
  console.log('Starting JSON parse...');
  processClasses();
  processSubclasses();
  processAncestries();
  processCommunities();
  processAbilities();
  processWeapons();
  processArmor();
  processConsumables();
  processAdversaries();
  
  linkSubclassesToClasses(); // Add the linking SQL at the end
  
  fs.writeFileSync(OUTPUT_PATH, sqlOutput.join('\n'));
  console.log(`Successfully generated SQL seed at: ${OUTPUT_PATH}`);
  console.log(`Total entries: ${sqlOutput.length}`);
} catch (e) {
  console.error('Error parsing JSON:', e);
}