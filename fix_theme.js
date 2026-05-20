const fs = require('fs');
const path = require('path');

const dir = 'frontend/app/store-owner';
const subdirs = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());

const replacements = [
  { search: /border-white\/10 bg-white\/6/g, replace: "border-slate-200/50 bg-white" },
  { search: /bg-white\/6/g, replace: "bg-white" },
  { search: /border-white\/10/g, replace: "border-slate-200/50" },
  { search: /text-emerald-50\/70/g, replace: "text-slate-600" },
  { search: /text-emerald-50\/72/g, replace: "text-slate-600" },
  { search: /text-emerald-50\/75/g, replace: "text-slate-600" },
  { search: /text-emerald-50\/78/g, replace: "text-slate-600" },
  { search: /text-emerald-50\/60/g, replace: "text-slate-500" },
  { search: /text-emerald-50\/65/g, replace: "text-slate-500" },
  { search: /text-emerald-50\/55/g, replace: "text-slate-500" },
  { search: /text-emerald-50\/85/g, replace: "text-slate-600" },
  { search: /text-emerald-50\/90/g, replace: "text-slate-700" },
  { search: /bg-emerald-400\/10/g, replace: "bg-emerald-50" },
  { search: /border-emerald-400\/20/g, replace: "border-emerald-100" },
  { search: /text-emerald-300/g, replace: "text-emerald-700" },
  { search: /text-emerald-200/g, replace: "text-emerald-800" },
  { search: /text-emerald-100/g, replace: "text-emerald-700" },
  { search: /border-white\/8 bg-black\/10/g, replace: "border-slate-100 bg-slate-50" },
  { search: /bg-black\/10/g, replace: "bg-slate-50" },
  { search: /bg-black\/20/g, replace: "bg-slate-100" },
  { search: /border-white\/8/g, replace: "border-slate-100" },
  { search: /bg-white\/5/g, replace: "bg-white" },
  { search: /bg-white\/8/g, replace: "bg-emerald-100" }, 
  { search: /text-white\/90/g, replace: "text-slate-900" },
  { search: /text-white\/85/g, replace: "text-slate-800" },
  { search: /text-white\/80/g, replace: "text-slate-800" },
  { search: /text-white\/75/g, replace: "text-slate-700" },
  { search: /text-white\/70/g, replace: "text-slate-600" },
  { search: /text-white\/60/g, replace: "text-slate-500" },
  { search: /text-white\/50/g, replace: "text-slate-500" },
  { search: /text-white/g, replace: "text-slate-900" },
  { search: /text-slate-950/g, replace: "text-slate-900" },
  { search: /shadow-\[0_18px_36px_rgba\(0,0,0,0.16\)\]/g, replace: "shadow-xl shadow-slate-200/40" },
  { search: /accent-emerald-400/g, replace: "accent-emerald-600" },
  { search: /placeholder:text-emerald-50\/35/g, replace: "placeholder:text-slate-400" },
  { search: /focus:border-emerald-400\/40/g, replace: "focus:border-emerald-400" },
  { search: /hover:bg-white\/10/g, replace: "hover:bg-slate-100" },
  { search: /hover:border-white\/15/g, replace: "hover:border-slate-200" }
];

subdirs.forEach(subdir => {
  const filePath = path.join(dir, subdir, 'page.tsx');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(({search, replace}) => {
      content = content.replace(search, replace);
    });
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
});
