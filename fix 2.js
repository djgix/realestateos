const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('app');
let changedFiles = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // Match "const " followed by basically any spaces and equals, i.e. "const  = await createClient()"
  const newContent = content.replace(/const\s+=\s+await\s+createClient\(\)/g, "const supabase = await createClient()");
  
  // also handle "const supabase = createClient()" where supabase wasn't replaced yet
  const newContent2 = newContent.replace(/const\s+(\w+)\s*=\s*createClient\(\)/g, "const $1 = await createClient()");
  
  if (newContent2 !== content) {
    fs.writeFileSync(file, newContent2);
    changedFiles++;
    console.log('Fixed', file);
  }
}
console.log('Total fixed files:', changedFiles);
