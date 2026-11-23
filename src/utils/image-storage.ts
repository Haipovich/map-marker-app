import { Directory, File, Paths } from 'expo-file-system';

const IMAGES_DIR_NAME = 'marker-images';

function getImagesDirectory(): Directory {
  const directory = new Directory(Paths.document, IMAGES_DIR_NAME);
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
}

function extensionOf(uri: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(uri);
  return match ? match[1].toLowerCase() : 'jpg';
}

export async function persistImage(sourceUri: string): Promise<string> {
  const directory = getImagesDirectory();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extensionOf(sourceUri)}`;
  const target = new File(directory, name);
  await new File(sourceUri).copy(target);
  return target.uri;
}

export function deleteStoredImage(uri: string): void {
  try {
    const directory = getImagesDirectory();
    if (!uri.startsWith(directory.uri)) return;
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Не удалось удалить файл изображения', error);
  }
}