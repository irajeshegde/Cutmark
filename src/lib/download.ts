/** Triggers a browser download for a blob. Must be called from a user gesture. */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Give the browser time to start reading the blob before freeing it.
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 10_000);
}
