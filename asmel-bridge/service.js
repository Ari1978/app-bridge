const Service = require('node-windows').Service;

const svc = new Service({
  name: 'ASMEL Bridge',
  description: 'Sincroniza ASMEL con Access',
  script: require('path').join(__dirname, 'dist/app.js'),
});

svc.on('install', () => {
  svc.start();
  console.log('✅ Servicio instalado y corriendo');
});

svc.install();