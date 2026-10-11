const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('c:/Users/Jean Marc bassahak/Documents/trae_projects/2dayna2day/frontend');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('import Link from "next/link"')) {
    content = content.replace(/import Link from ["']next\/link["'];?/g, 'import { Link } from "@/navigation";');
    fs.writeFileSync(f, content);
  }
});
