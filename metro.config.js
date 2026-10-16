const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 3D modeller (assets/3d/*.glb) asset olarak paketlenir
config.resolver.assetExts.push('glb');

// three.js her yerden tek ve ESM kopyadan yüklenir. @react-three/fiber'in
// CommonJS derlemesi `require('three')` ile Node sürümünü (three.cjs) çeker;
// o sürüm açılışta process.emitWarning çağırır ve RN'de çöker. Ayrıca iki
// kopya yüklenirse sınıf kontrolleri (instanceof) bozulur.
const THREE_ESM = path.join(__dirname, 'node_modules/three/build/three.module.js');
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') return { type: 'sourceFile', filePath: THREE_ESM };
  return (upstream ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
