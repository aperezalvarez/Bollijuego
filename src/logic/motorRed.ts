import TcpSocket from 'react-native-tcp-socket';
import { NetworkInfo } from 'react-native-network-info';
import { PermissionsAndroid, Platform } from 'react-native';
import { CasoGenerado } from './motorMisterio';

let servidorLocal: any = null;
let socketsServidor: any[] = [];
let socketsClienteActivos: any[] = [];
let invitadoConectado = false;
let pinHost = '';
let casoActualHost: CasoGenerado | null = null;
let modoActualHost: string = '';

export const apagarRed = () => {
  socketsServidor.forEach(socket => {
    try { socket.destroy(); } catch (e) {}
  });
  socketsServidor = [];

  socketsClienteActivos.forEach(socket => {
    try { socket.destroy(); } catch (e) {}
  });
  socketsClienteActivos = [];

  if (servidorLocal) {
    try {
      servidorLocal.close();
    } catch (e) {}
    servidorLocal = null;
  }
  
  invitadoConectado = false;
  pinHost = '';
  casoActualHost = null;
  modoActualHost = '';
};

export const crearSala = async (caso: CasoGenerado, modo: string): Promise<string | null> => {
  try {
    apagarRed();

    invitadoConectado = false;
    casoActualHost = caso;
    modoActualHost = modo;
    
    pinHost = Math.floor(1000 + Math.random() * 9000).toString();

    servidorLocal = TcpSocket.createServer((socket) => {
      socketsServidor.push(socket);

      socket.on('data', (data) => {
        const mensaje = data.toString();
        if (mensaje === pinHost && casoActualHost) {
          socket.write(JSON.stringify({ caso: casoActualHost, modo: modoActualHost }));
          invitadoConectado = true;
          
          setTimeout(() => {
            try { socket.destroy(); } catch (e) {}
          }, 1500);
        } else {
          socket.write('ERROR_PIN');
          setTimeout(() => {
            try { socket.destroy(); } catch (e) {}
          }, 500);
        }
      });

      socket.on('close', () => {
        socketsServidor = socketsServidor.filter(s => s !== socket);
      });
      
      socket.on('error', () => {});
    });

    servidorLocal.on('error', () => {
      apagarRed();
    });

    servidorLocal.listen({ port: 3000, host: '0.0.0.0', reuseAddress: true });

    return pinHost;
  } catch (error) {
    return null;
  }
};

const intentarConexionDirecta = (ip: string, pin: string, modoLocal: string, timeoutMs: number): Promise<CasoGenerado | null> => {
  return new Promise((resolve) => {
    let resuelto = false;
    let buffer = '';
    
    const client = TcpSocket.createConnection({ port: 3000, host: ip }, () => {
      client.write(pin);
    });

    socketsClienteActivos.push(client);

    const limpiarCliente = () => {
      try { client.destroy(); } catch (e) {}
      socketsClienteActivos = socketsClienteActivos.filter(s => s !== client);
    };

    client.on('data', (data) => {
      if (resuelto) return;
      const respuesta = data.toString();
      
      if (respuesta.includes('ERROR_PIN')) {
        resuelto = true;
        limpiarCliente();
        resolve(null);
        return;
      }

      buffer += respuesta;

      try {
        const parseado = JSON.parse(buffer);
        if (parseado && parseado.caso && parseado.modo === modoLocal) {
          resuelto = true;
          resolve(parseado.caso as CasoGenerado);
        } else {
          resuelto = true;
          resolve(null);
        }
        limpiarCliente();
      } catch (e) {}
    });

    client.on('error', () => {
      if (!resuelto) {
        resuelto = true;
        limpiarCliente();
        resolve(null);
      }
    });
    
    setTimeout(() => {
      if (!resuelto) {
        resuelto = true;
        limpiarCliente();
        resolve(null);
      }
    }, timeoutMs);
  });
};

export const unirseSala = async (codigoSala: string, modoLocal: string): Promise<CasoGenerado | null> => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Permiso de red local",
          message: "Bollijuego necesita acceso a la red para encontrar la partida local.",
          buttonNeutral: "Preguntar luego",
          buttonNegative: "Cancelar",
          buttonPositive: "Aceptar"
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return null;
      }
    }

    const gatewayIp = await NetworkInfo.getGatewayIPAddress();
    
    if (gatewayIp && gatewayIp !== '0.0.0.0') {
      const casoGateway = await intentarConexionDirecta(gatewayIp, codigoSala, modoLocal, 1500);
      if (casoGateway) {
        return casoGateway;
      }
    }

    const ip = await NetworkInfo.getIPV4Address();
    if (!ip || ip === '0.0.0.0' || ip.startsWith('127.')) return null;

    const partesIp = ip.split('.');
    if (partesIp.length !== 4) return null;
    
    const subred = `${partesIp[0]}.${partesIp[1]}.${partesIp[2]}.`;
    
    for (let i = 1; i <= 254; i += 20) {
      const promesas = [];
      for (let j = i; j < i + 20 && j <= 254; j++) {
        const ipPrueba = `${subred}${j}`;
        promesas.push(intentarConexionDirecta(ipPrueba, codigoSala, modoLocal, 1000));
      }
      
      const resultados = await Promise.all(promesas);
      const casoEncontrado = resultados.find(res => res !== null);
      
      if (casoEncontrado) {
        return casoEncontrado;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

export const comprobarEstadoSala = async (codigoSala: string): Promise<boolean> => {
  return invitadoConectado;
};