# PrintBluetooth


Pré-requisitos:

- Yarn/Npm

Tendo isso, startamos o aplicativo

Instalar as Libs:
> yarn

Rodar:
> yarn android

## Solução de Possíveis erros:
___
- Dentro do visual studio code criar a pasta android/app/src/main/assets

- Alterar o regex da LIB metro.config 
node_modules\metro-config\src\defaults\blacklist.js
  > var sharedBlacklist = [
    /node_modules[\/\\]react[\/\\]dist[\/\\].*/,
    /website\/node_modules\/.*/,
    /heapCapture\/bundle\.js/,
    /.*\/__tests__\/.*/
  ];

3 - Rodar o comando abaixo:
  > react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
  
OU

> yarn react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
