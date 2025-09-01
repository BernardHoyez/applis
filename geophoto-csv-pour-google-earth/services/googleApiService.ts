
import { GOOGLE_CLIENT_ID, GOOGLE_API_KEY, SCOPES } from '../constants';
import type { UserProfile, ProcessedPhoto } from '../types';

declare global {
  interface Window {
    gapi: any;
    google: any;
    tokenClient: any;
  }
}

let onGapiLoadedCallback: () => void;

export const initGoogleClient = (callback: () => void): Promise<void> => {
  onGapiLoadedCallback = callback;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:picker', () => {
        window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        }).then(() => {
          if (onGapiLoadedCallback) onGapiLoadedCallback();
          resolve();
        }).catch(reject);
      });
    };
    script.onerror = reject;
    document.body.appendChild(script);

    const gsiScript = document.createElement('script');
    gsiScript.src = 'https://accounts.google.com/gsi/client';
    gsiScript.async = true;
    gsiScript.defer = true;
    gsiScript.onload = () => {
      window.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '', // The callback is set at request time
      });
    };
    gsiScript.onerror = reject;
    document.body.appendChild(gsiScript);
  });
};


export const handleSignIn = (updateUser: (profile: UserProfile) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.tokenClient) {
      return reject("Google Token Client not initialized.");
    }

    window.tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        return reject(resp);
      }
      
      window.gapi.client.setToken({ access_token: resp.access_token });

      try {
        const userInfo = await window.gapi.client.oauth2.userinfo.get();
        const profile: UserProfile = {
          name: userInfo.result.name,
          email: userInfo.result.email,
          picture: userInfo.result.picture,
        };
        updateUser(profile);
        resolve();
      } catch(error) {
        reject(error)
      }
    };
    window.tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

export const handleSignOut = (updateUser: (profile: UserProfile | null) => void) => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {});
    window.gapi.client.setToken(null);
  }
  updateUser(null);
};

const createPicker = (token: string, callback: (docs: any[]) => void) => {
  const view = new window.google.picker.View(window.google.picker.ViewId.PHOTOS);
  view.setMimeTypes("image/jpeg,image/png,image/heic");
  const picker = new window.google.picker.PickerBuilder()
    .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
    .setAppId(GOOGLE_CLIENT_ID.split('-')[0])
    .setOAuthToken(token)
    .addView(view)
    .setDeveloperKey(GOOGLE_API_KEY)
    .setCallback((data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        callback(data.docs);
      }
    })
    .build();
  picker.setVisible(true);
};

export const showPicker = (callback: (docs: any[]) => void) => {
  const token = window.gapi.client.getToken();
  if (token) {
    createPicker(token.access_token, callback);
  } else {
    console.error("Not authenticated");
    // Optionally trigger re-authentication
  }
};

export const getFilesMetadata = async (fileIds: string[]): Promise<ProcessedPhoto[]> => {
  const processedPhotos: ProcessedPhoto[] = [];
  const requests = fileIds.map(id => 
    window.gapi.client.drive.files.get({
      fileId: id,
      fields: 'id, name, thumbnailLink, imageMediaMetadata(location)'
    })
  );

  const responses = await Promise.all(requests);

  for (const res of responses) {
    const file = res.result;
    if (file.imageMediaMetadata && file.imageMediaMetadata.location) {
      const { latitude, longitude } = file.imageMediaMetadata.location;
      if (latitude && longitude) {
        processedPhotos.push({
          id: file.id,
          name: file.name,
          thumbnailLink: file.thumbnailLink,
          latitude,
          longitude,
        });
      }
    }
  }

  return processedPhotos;
};
