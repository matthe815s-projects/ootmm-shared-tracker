export function stringifyBlob(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      }
      reader.onerror = reject;
      console.log(blob)
      reader.readAsText(blob);
    });
}