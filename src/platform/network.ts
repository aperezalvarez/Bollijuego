import NetInfo, {NetInfoStateType} from '@react-native-community/netinfo';
import type {NetEnv} from '../net/discovery';

/** IP y máscara REALES de la Wi-Fi (sin permiso de ubicación; antes se pedía ACCESS_FINE_LOCATION sin necesidad). */
export async function getNetEnv(): Promise<NetEnv> {
  try {
    const s = await NetInfo.fetch();
    if (s.type === NetInfoStateType.wifi || s.type === NetInfoStateType.ethernet) {
      return {ip: s.details.ipAddress ?? null, subnet: s.details.subnet ?? null};
    }
  } catch {
    // sin información de red
  }
  return {ip: null, subnet: null};
}
