import { headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';

type DeviceInfo = {
  device_type: string | undefined;
  device_os: string | undefined;
  device_name: string | undefined;
  browser: string | undefined;
  ip: string;
  location: string;
  userAgent: string | null;
};

/**
 * @description 使用 ipinfo.io API 获取 IP 地址和大致位置
 * @returns 返回包含 `ip` 和 `location`（城市/地区）的对象
 * @remarks 如果请求失败，则返回 'unknown' 作为默认值
 */
export const getLocationFromIp = async (): Promise<{
  ip: string;
  location: string;
}> => {
  const res = await fetch('https://ipinfo.io/json', { cache: 'no-store' });
  if (!res.ok) return { ip: 'unknown', location: 'unknown' };
  const data = await res.json();
  return {
    ip: data.ip,
    location: `${data.city}/${data.region}`,
  };
};

/**
 * @description 从 User-Agent 请求头解析设备和浏览器信息，并用 IP 和位置数据丰富信息
 * @returns 返回包含设备类型、操作系统、设备名称、浏览器、IP 地址、位置和完整 User-Agent 字符串的 `DeviceInfo` 对象
 * @remarks 使用 UAParser 库解析 User-Agent，并调用 getLocationFromIp 获取位置信息
 */
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  const header = await headers();
  const userAgent = header.get('user-agent') || '';
  const parser = new UAParser(userAgent);
  const { ip, location } = await getLocationFromIp();

  return {
    device_type: parser.getDevice().type,
    device_os: parser.getOS().name,
    device_name: parser.getDevice().model,
    browser: parser.getBrowser().name,
    ip,
    location,
    userAgent,
  };
};
