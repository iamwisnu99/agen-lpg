const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://ibnux.github.io/data-indonesia/provinsi.json';
https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const provinces = JSON.parse(data);
    let results = [];
    let completed = 0;
    
    provinces.forEach(prov => {
      const regUrl = `https://ibnux.github.io/data-indonesia/kabupaten/${prov.id}.json`;
      https.get(regUrl, (resReg) => {
        let regData = '';
        resReg.on('data', chunk => regData += chunk);
        resReg.on('end', () => {
          const regencies = JSON.parse(regData);
          regencies.forEach(reg => {
            // Title case formatting
            const formatName = (str) => {
              return str.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
            };
            results.push(
              `${formatName(reg.nama)}, ${formatName(prov.nama)}`
            );
          });
          
          completed++;
          if(completed === provinces.length) {
            // Sort A-Z
            results.sort((a,b) => a.localeCompare(b));
            
            const dir = path.join(process.cwd(), 'src', 'data');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            
            fs.writeFileSync(path.join(dir, 'wilayah.json'), JSON.stringify(results, null, 2));
            console.log('Berhasil mengunduh ' + results.length + ' data wilayah ke src/data/wilayah.json');
          }
        });
      });
    });
  });
}).on('error', console.error);
