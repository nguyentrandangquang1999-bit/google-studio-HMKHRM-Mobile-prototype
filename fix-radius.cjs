const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            results.push(fullPath);
        }
    }
    return results;
}

const files = walk('src');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // rounded-xl -> rounded-md
    content = content.replace(/rounded-xl/g, 'rounded-md');
    
    // rounded-2xl -> rounded-lg
    content = content.replace(/rounded-2xl/g, 'rounded-lg');
    
    // rounded-3xl -> rounded-xl
    content = content.replace(/rounded-3xl/g, 'rounded-xl');
    
    // rounded-t-3xl -> rounded-t-xl
    content = content.replace(/rounded-t-3xl/g, 'rounded-t-xl');

    fs.writeFileSync(file, content, 'utf8');
}
console.log('Fixed border radius in all files.');
