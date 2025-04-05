
import prisma from "./libs/prisma";

import { fetchCurrentTokenDataV2 } from "./queries/get_current_token_data_v2";
import { getTokenMetadata } from "./utils/attributes";

async function syncTokenData() {
  try {

    // TODO: HOW CAN I FIND ALL OF THE COLLECTION ID
    const collections = await prisma.collection.findMany();
    
    for (const collection of collections) {
      console.log(`Syncing tokens for collection: ${collection.name}`);
      
      const tokenData = await fetchCurrentTokenDataV2(collection.id);
      
      for (const token of tokenData) {
        const attributes = await getTokenMetadata(token);
        
        const createdToken = await prisma.token.upsert({
          where: { id: token.token_data_id },
          update: {
            image_url: token.cdn_asset_uris.cdn_image_uri,
            rairity: 0,
          },
          create: {
            id: token.token_data_id,
            image_url: token.cdn_asset_uris.cdn_image_uri,
            collectionId: collection.id,
            rairity: 0, 
          },
        });
        
        await prisma.attributes.deleteMany({
          where: { tokenId: createdToken.id },
        });
        
        for (const attr of attributes) {
          await prisma.attributes.create({
            data: {
              trait_type: attr.trait_type,
              value: attr.value,
              tokenId: createdToken.id,
            },
          });
        }
      }
      
      console.log(`Finished syncing tokens for collection: ${collection.name}`);
    }
    
    console.log("Token sync completed successfully");
  } catch (error) {
    console.error("Error syncing token data:", error);
  }
}

// Run the sync function immediately on startup
syncTokenData();

// Then run it every 5 minutes (300000 milliseconds)
setInterval(syncTokenData, 5 * 60 * 1000);
