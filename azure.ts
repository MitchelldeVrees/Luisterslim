import Constants from 'expo-constants';

const { azureEndpoint } = (Constants.expoConfig?.extra ?? {}) as { azureEndpoint: string };

export async function uploadToAzure(
  uri: string,
  name: string,
  type: string,
  onUploadProgress?: (percent: number) => void
): Promise<{ statusUrl: string; operationId: string }> {
  const form = new FormData();
  form.append('file', { uri, name, type } as any);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${azureEndpoint}/api/upload`);
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 202) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ statusUrl: data.statusUrl, operationId: data.operationId });
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

export async function pollStatus(url: string): Promise<{ transcript: string }> {
  let delay = 3000;
  while (true) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'succeeded') {
      return { transcript: data.transcript as string };
    }
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.5, 15000);
  }
}
