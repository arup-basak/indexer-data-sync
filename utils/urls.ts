export const refine_image_url = (url: string) => {
  if (url.startsWith("ipfs://")) {
    const id = url.replace("ipfs://", "");
    return `http://ipfs.io/ipfs/${id}`;
  }
  return url;
};
