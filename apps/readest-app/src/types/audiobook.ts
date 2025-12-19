export interface AudioChapter {
  id: string;
  title: string;
  start: number; // Start time in seconds
  end: number; // End time in seconds
}

export interface AudioFile {
  path: string;
  name: string;
  duration: number; // Total duration in seconds
  format: string; // 'mp3', 'm4b', etc.
}

export interface AudiobookMetadata {
  narrator?: string;
  duration?: number;
}
