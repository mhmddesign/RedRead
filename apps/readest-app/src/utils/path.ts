import { join } from '@tauri-apps/api/path';
import { isContentURI, isFileURI, isValidURL } from './misc';

export const getFilename = (fileOrUri: string) => {
  if (isValidURL(fileOrUri) || isContentURI(fileOrUri) || isFileURI(fileOrUri)) {
    try {
      fileOrUri = decodeURI(fileOrUri);
    } catch (e) {
      console.warn('Failed to decode URI', fileOrUri, e);
    }
  }
  // Handle Windows UNC paths (starting with \\) by preserving the double slash if present at start
  const isUNC = fileOrUri.startsWith('\\\\');
  const normalizedPath = fileOrUri.replace(/\\/g, '/');
  
  const parts = normalizedPath.split('/');
  const lastPart = parts.pop();
  return (lastPart || '').split('?')[0]!;
};

export const getBaseFilename = (filename: string) => {
  const normalizedPath = filename.replace(/\\/g, '/');
  const name = normalizedPath.split('/').pop() || '';

  const parts = name.split('.');
  if (parts.length <= 1) {
    return name;
  }

  return parts.slice(0, -1).join('.');
};

export const getDirPath = (filePath: string) => {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  parts.pop();
  return parts.join('/');
};

export const joinPaths = async (...paths: string[]) => {
  return await join(...paths);
};
