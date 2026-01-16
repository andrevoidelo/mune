import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Initializes native Capacitor settings.
 * Should be called once on app initialization.
 */
export const initCapacitor = async (): Promise<void> => {
  const platform = Capacitor.getPlatform();

  // Add platform class to body for CSS targeting
  if (platform === 'android') {
    document.body.classList.add('platform-android');
  } else if (platform === 'ios') {
    document.body.classList.add('platform-ios');
  }

  if (!Capacitor.isNativePlatform()) {
    // Not running on Android/iOS, skip native configurations
    return;
  }

  try {
    // Configure status bar to overlay (WebView occupies entire screen)
    await StatusBar.setOverlaysWebView({ overlay: true });

    // Set status bar style (light icons for dark background - default)
    await StatusBar.setStyle({ style: Style.Dark });

    // Make status bar transparent
    await StatusBar.setBackgroundColor({ color: '#00000000' });

    console.log('[Capacitor] Status bar configured successfully');
  } catch (error) {
    console.warn('[Capacitor] Error configuring status bar:', error);
  }
};

/**
 * Updates the status bar style based on theme brightness.
 * @param isDarkTheme - true for dark themes (light status bar icons), false for light themes (dark icons)
 */
export const updateStatusBarStyle = async (isDarkTheme: boolean): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // Style.Dark = light icons (for dark backgrounds)
    // Style.Light = dark icons (for light backgrounds)
    await StatusBar.setStyle({ style: isDarkTheme ? Style.Dark : Style.Light });
  } catch (error) {
    console.warn('[Capacitor] Error updating status bar style:', error);
  }
};

/**
 * Calculates relative luminance of a hex color.
 * Returns true if the color is considered "dark" (luminance < 0.5)
 */
export const isColorDark = (hexColor: string): boolean => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Calculate relative luminance using sRGB formula
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance < 0.5;
};
