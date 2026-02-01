import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SafeArea } from '@capacitor-community/safe-area';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

/**
 * Initializes native Capacitor settings.
 * Should be called once on app initialization.
 */
export const initCapacitor = async (): Promise<void> => {
  const platform = Capacitor.getPlatform();

  // Add platform class to body for CSS targeting
  if (platform === 'android') {
    document.body.classList.add('platform-android');
    // REMOVED: detectAndroidNavigationMode (caused keyboard layout issues)
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

    // Make status bar match the card background color (--card-bg: 30 41 59 -> #1e293b)
    await StatusBar.setBackgroundColor({ color: '#1e293b' });

    console.log('[Capacitor] Status bar configured successfully');

    // Configure Keyboard to use Native resize (WebView shrinks) but allow scrolling
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
      
      // CRITICAL: Disable WebView scrolling!
      // This prevents the entire app view from being pushed up/panned.
      // We handle scrolling internally in our scrollable divs.
      await Keyboard.setScroll({ isDisabled: true }); 

      console.log('[Capacitor] Keyboard configured: Native Resize + Scroll Disabled');
    } catch (e) {
      console.warn('[Capacitor] Error configuring keyboard:', e);
    }
    
    // Update safe area insets using the plugin
    await updateSafeAreaInsets();

    // Listen for safe area changes (orientation, etc)
    // Commented out to prevent TS/Runtime errors if plugin is missing/outdated
    /*
    (SafeArea as any).addListener('safeAreaChanged', (data: any) => {
      const { insets } = data;
      document.documentElement.style.setProperty('--safe-area-inset-top', `${insets.top}px`);
      document.documentElement.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
      document.documentElement.style.setProperty('--safe-area-inset-left', `${insets.left}px`);
      document.documentElement.style.setProperty('--safe-area-inset-right', `${insets.right}px`);
      console.log('[Capacitor] Safe area changed:', insets);
    });
    */
    
  } catch (error) {
    console.warn('[Capacitor] Error configuring status bar:', error);
  }
};

/**
 * Updates the safe area insets CSS variables.
 */
export const updateSafeAreaInsets = async (): Promise<void> => {
  try {
    // Attempt to get safe area insets safely
    if (SafeArea && (SafeArea as any).getSafeAreaInsets) {
        const { insets } = await (SafeArea as any).getSafeAreaInsets();
        document.documentElement.style.setProperty('--safe-area-inset-top', `${insets.top}px`);
        document.documentElement.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
        document.documentElement.style.setProperty('--safe-area-inset-left', `${insets.left}px`);
        document.documentElement.style.setProperty('--safe-area-inset-right', `${insets.right}px`);
        console.log('[Capacitor] Safe area updated:', insets);
    } else {
        console.warn('[Capacitor] SafeArea plugin not available or missing getSafeAreaInsets');
    }
  } catch (e) {
    console.warn('[Capacitor] Failed to get safe area insets:', e);
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
 * Updates the status bar background color.
 * @param color - The hex color to set (e.g. #1e293b)
 */
export const updateStatusBarColor = async (color: string): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setBackgroundColor({ color });
  } catch (error) {
    console.warn('[Capacitor] Error updating status bar color:', error);
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