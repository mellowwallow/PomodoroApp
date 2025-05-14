import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'pomodoroApp',
  webDir: 'www',
  plugins: {
    LocalNotifications: {
      sound: 'beep.mp3',
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
    }
  }
};

export default config;
