/**
 * Trigger a client-side JSON download: Blob -> object URL -> synthetic anchor
 * click -> revoke. One shared implementation for every "Download JSON" button.
 */
export function downloadJson(fileName: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
