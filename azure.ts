// azure.ts

const azureEndpoint = process.env.azureEndpoint || '';

export async function uploadToAzure(
  uri: string,
  name: string,
  type: string,
  onUploadProgress?: (percent: number) => void
): Promise<{ transcript: string }> {      // only transcript
  const form = new FormData();
  form.append('audioFile', { uri, name, type } as any);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    console.log("SENDING TO AZURE", azureEndpoint);
    xhr.open('POST', `${azureEndpoint}/api/upload`);
    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          console.log('Upload response:', data);
          resolve({ transcript: data.transcript });  // pull transcript
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    if (xhr.upload && onUploadProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onUploadProgress((e.loaded / e.total) * 100);
        }
      };
    }
    xhr.send(form as any);
  });
}
