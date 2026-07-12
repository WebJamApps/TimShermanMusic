/**
 * @file adminActions.ts
 * @description Admin socket actions for managing gigs and slideshow pictures.
 */

import scc from 'socketcluster-client';

export interface IGigInput {
  datetime: string | null;
  venue: string;
  tickets: string;
  city: string;
  usState: string;
  duration: number;
  promoImageUrl: string;
}

export interface IPicInput {
  url: string;
  title: string;
  comments: string; // 'showCaption' or ''
}

const getSocket = () => {
  return scc.create({
    hostname: process.env.SCS_HOST || 'localhost',
    port: Number(process.env.SCS_PORT) || 8888,
    autoConnect: true,
    secure: process.env.SOCKETCLUSTER_SECURE !== 'false',
  });
};

const delay = (seconds: number) => new Promise(resolve => {
  setTimeout(resolve, seconds * 1000);
});

export const createGig = async (gig: IGigInput, token: string, callback?: () => void) => {
  try {
    const socket = getSocket();
    const payload = {
      gig: {
        ...gig,
        artist: 'tim',
      },
      token,
    };
    socket.transmit('newGig', payload);
    await delay(1.5);
    socket.disconnect();
    if (callback) callback();
  } catch (err) {
    console.error('createGig failed:', err);
  }
};

export const updateGig = async (
  gigId: string,
  gig: Partial<IGigInput>,
  token: string,
  callback?: () => void,
) => {
  try {
    const socket = getSocket();
    const cleanGig = { ...gig, artist: 'tim' };
    socket.transmit('editGig', { gigId, token, gig: cleanGig });
    await delay(1.5);
    socket.disconnect();
    if (callback) callback();
  } catch (err) {
    console.error('updateGig failed:', err);
  }
};

export const deleteGig = async (gigId: string, token: string, callback?: () => void) => {
  try {
    const socket = getSocket();
    socket.transmit('deleteGig', { gig: { gigId }, token });
    await delay(1.5);
    socket.disconnect();
    if (callback) callback();
  } catch (err) {
    console.error('deleteGig failed:', err);
  }
};

// Photo (slideshow pic) writes go over REST to web-jam-back's `/book` collection,
// mirroring updateBio below — NOT the SocketCluster `jamPics` collection. That
// socket path used to feed JaMmusic's (Josh & Maria's) private collection, which
// caused a real prod tenant leak: a photo added on timshermanmusic.com appeared
// on joshandmariamusic.com. Every write here MUST target `/book` and MUST carry
// `artist: 'tim'` so it never lands in — or touches — another tenant's data.
export const createPic = async (pic: IPicInput, token: string, callback?: () => void) => {
  try {
    const backendUrl =
      process.env.BackendUrl || (import.meta.env.DEV ? 'http://localhost:7000' : '');

    const body = {
      title: pic.title,
      url: pic.url,
      comments: pic.comments,
      type: 'TimShermanMusic-music',
      artist: 'tim',
    };

    const res = await fetch(`${backendUrl}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    if (callback) callback();
  } catch (err) {
    console.error('createPic failed:', err);
  }
};

export const updatePic = async (
  editPic: { _id: string; url: string; title: string; comments: string; type: string },
  token: string,
  callback?: () => void,
) => {
  try {
    const backendUrl =
      process.env.BackendUrl || (import.meta.env.DEV ? 'http://localhost:7000' : '');

    const body = {
      title: editPic.title,
      url: editPic.url,
      comments: editPic.comments,
    };

    const res = await fetch(`${backendUrl}/book/${editPic._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    if (callback) callback();
  } catch (err) {
    console.error('updatePic failed:', err);
  }
};

export const deletePic = async (picId: string, token: string, callback?: () => void) => {
  try {
    const backendUrl =
      process.env.BackendUrl || (import.meta.env.DEV ? 'http://localhost:7000' : '');

    const res = await fetch(`${backendUrl}/book/${picId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    if (callback) callback();
  } catch (err) {
    console.error('deletePic failed:', err);
  }
};

export const updateBio = async (
  bioText: string,
  token: string,
  callback?: () => void,
) => {
  try {
    const backendUrl =
      process.env.BackendUrl || (import.meta.env.DEV ? 'http://localhost:7000' : '');

    // Check if bio already exists in the backend
    const checkRes = await fetch(`${backendUrl}/book?type=bio&artist=tim`);
    let bioExists = false;
    if (checkRes.ok) {
      const data = await checkRes.json();
      bioExists = !!(Array.isArray(data) && data[0]);
    }

    const method = bioExists ? 'PUT' : 'POST';
    const url = bioExists
      ? `${backendUrl}/book/one?type=bio&artist=tim`
      : `${backendUrl}/book`;

    const body = bioExists
      ? { comments: bioText }
      : { title: 'Bio', type: 'bio', artist: 'tim', comments: bioText };

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    if (callback) callback();
  } catch (err) {
    console.error('updateBio failed:', err);
  }
};
