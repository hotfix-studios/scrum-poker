import { userController } from "../db/controllers/index.js";

interface PayloadDTO {
  [key: string]: any;
}

const _userProperties = [ "user", "owner", "sender", "account" ];

// TODO: rename to findOwnerId
export const findOwner = async (payload: PayloadDTO): Promise<number | null> => {
  return await recursePayload(payload);
};

export const recursePayload = async (payload: PayloadDTO): Promise<number | null> => {
  for (const key in payload) {
    // if false, will skip prototype props and continue to next key in payload
    console.log(`Key: ${key}`);
    if (payload.hasOwnProperty(key)) {
      const value = payload[key];
      console.log(`Value: ${value}`);
      if (_userProperties.includes(key)) {
        // grab id on key (key.id)
        const userQueryId = payload[key].id;
        console.log(`Id of User found: ${userQueryId}`);
        // check user document for .IsOwner === true
        const userIsOwner = await userController.userIsOwner(userQueryId);
        if (userIsOwner) {
          // if .IsOwner === true return document._id
          console.log(`found owner: ${userIsOwner}: ${userQueryId}`);
          return userQueryId;
        }
      } else if (typeof value === "object" && value !== null) {
        console.log(`recursing on ${value}`);
        const foundOwnerId = await recursePayload(value);
        if (foundOwnerId !== null) {
          return foundOwnerId;
        }
      } else {
        continue;
      }
    }
  }
  return null;
};



        // const ownerDocument = await userController.socketFindOneById(userQueryId);
