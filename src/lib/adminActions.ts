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

export const createPic = async (pic: IPicInput, token: string, callback?: () => void) => {
  try {
    const socket = getSocket();
    const image = {
      ...pic,
      type: 'TimShermanMusic-music',
      artist: 'tim',
    };
    socket.transmit('newImage', { image, token });
    await delay(1.5);
    socket.disconnect();
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
    const socket = getSocket();
    socket.transmit('editImage', { editPic, token });
    await delay(1.5);
    socket.disconnect();
    if (callback) callback();
  } catch (err) {
    console.error('updatePic failed:', err);
  }
};

export const deletePic = async (picId: string, token: string, callback?: () => void) => {
  try {
    const socket = getSocket();
    socket.transmit('deleteImage', { data: picId, token });
    await delay(1.5);
    socket.disconnect();
    if (callback) callback();
  } catch (err) {
    console.error('deletePic failed:', err);
  }
};
