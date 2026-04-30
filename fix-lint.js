const fs = require('fs');
const path = require('path');

const filesToFixQuotes = [
  'src/app/about/page.tsx',
  'src/app/privacy/page.tsx',
  'src/app/terms/page.tsx'
];

const filesToFixImages = [
  'src/app/page.tsx',
  'src/app/pricing/page.tsx',
  'src/app/room/page.tsx',
  'src/app/setup/page.tsx',
  'src/app/sign-in/[[...sign-in]]/page.tsx',
  'src/app/sign-up/[[...sign-up]]/page.tsx'
];

// Fix quotes
filesToFixQuotes.forEach(file => {
  const filepath = path.join(__dirname, file);
  if (!fs.existsSync(filepath)) return;
  
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/We don't/g, "We don&apos;t");
  content = content.replace(/world's/g, "world&apos;s");
  content = content.replace(/"sees"/g, "&quot;sees&quot;");
  content = content.replace(/It's/g, "It&apos;s");
  content = content.replace(/"stream-and-forget"/g, "&quot;stream-and-forget&quot;");
  content = content.replace(/application's/g, "application&apos;s");
  
  fs.writeFileSync(filepath, content);
  console.log('Fixed quotes in', file);
});

// Fix images
filesToFixImages.forEach(file => {
  const filepath = path.join(__dirname, file);
  if (!fs.existsSync(filepath)) return;
  
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Replace <img src="..." className="..." /> with <Image src="..." unoptimized className="..." width={40} height={40} />
  content = content.replace(/<img\s+src="([^"]+)"\s+alt="([^"]*)"\s+className="([^"]+)"\s*\/>/g, 
    '<Image src="$1" alt="$2" className="$3" width={40} height={40} unoptimized />');
    
  content = content.replace(/<img\s+src="([^"]+)"\s+alt="([^"]*)"\s+width="([^"]+)"\s+height="([^"]+)"\s+className="([^"]+)"\s*\/>/g, 
    '<Image src="$1" alt="$2" width={$3} height={$4} className="$5" unoptimized />');

  // Some might be <img src="..." className="..." alt="..." />
  content = content.replace(/<img\s+src="([^"]+)"\s+className="([^"]+)"\s+alt="([^"]*)"\s*\/>/g, 
    '<Image src="$1" alt="$3" className="$2" width={40} height={40} unoptimized />');
    
  // Simple ones
  content = content.replace(/<img\s+src="([^"]+)"\s+alt="([^"]*)"\s*\/>/g, 
    '<Image src="$1" alt="$2" width={40} height={40} unoptimized />');
  
  fs.writeFileSync(filepath, content);
  console.log('Fixed images in', file);
});
