import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Verifica se o app está rodando como APK nativo (Android/iOS)
 * ou como webapp no browser.
 */
export const isNativePlatform = (): boolean => {
  const platform = Capacitor.getPlatform();
  return platform === 'android' || platform === 'ios';
};

/**
 * Exporta conteúdo de texto para um arquivo.
 * - No browser: usa método tradicional com <a download>
 * - No Android: salva no cache e abre menu de compartilhamento
 *
 * @param content - Conteúdo do arquivo (texto)
 * @param fileName - Nome do arquivo com extensão (ex: "log.md")
 * @param mimeType - Tipo MIME (ex: "text/markdown")
 */
export const exportTextFile = async (
  content: string,
  fileName: string,
  mimeType: string
): Promise<void> => {

  if (isNativePlatform()) {
    // ========== ANDROID/iOS ==========
    try {
      // 1. Salva o arquivo no diretório de cache do app
      const result = await Filesystem.writeFile({
        path: fileName,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      // 2. Abre o menu de compartilhamento nativo
      await Share.share({
        title: `Exportar ${fileName}`,
        url: result.uri,
        dialogTitle: 'Salvar ou compartilhar arquivo',
      });

    } catch (error) {
      console.error('Erro ao exportar arquivo:', error);
      // Fallback: tenta método do browser mesmo assim
      exportTextFileBrowser(content, fileName, mimeType);
    }

  } else {
    // ========== BROWSER ==========
    exportTextFileBrowser(content, fileName, mimeType);
  }
};

/**
 * Método tradicional de download para browsers.
 * Cria um elemento <a> invisível e simula clique.
 */
const exportTextFileBrowser = (
  content: string,
  fileName: string,
  mimeType: string
): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
};

/**
 * Exporta um documento PDF.
 * - No browser: usa download direto do jsPDF
 * - No Android: salva no cache e abre menu de compartilhamento
 *
 * @param pdfBase64 - PDF em formato base64 (output do jsPDF)
 * @param fileName - Nome do arquivo (ex: "log.pdf")
 */
export const exportPdfFile = async (
  pdfBase64: string,
  fileName: string
): Promise<void> => {

  if (isNativePlatform()) {
    // ========== ANDROID/iOS ==========
    try {
      // 1. Salva o PDF no cache
      const result = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Cache,
        // Não usa Encoding pois é base64
      });

      // 2. Compartilha
      await Share.share({
        title: `Exportar ${fileName}`,
        url: result.uri,
        dialogTitle: 'Salvar ou compartilhar PDF',
      });

    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }
  }
  // No browser, o jsPDF.save() já faz o download diretamente
};
