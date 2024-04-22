import { Schema, Model, model, Document, FlattenMaps } from "mongoose";
import { OctokitTypes } from "../../../types/index.js";
// TODO: This is a hack. TS couldn't infer correct type when actual type passed in (was using typeof User)
// import type { User } from "../../models/index.js";

// TODO: the typings for _model are all messed up and not inferring correctly...
export abstract class ARepository {

  public readonly _model: Model<any>;

  /**
   * @summary This Abstract base class will have the core Read/Write operations for req/res
   * @param typeof User to infer mongoose model type
   */
  constructor(model: Model<any>) {
    this._model = model;
  }

  // TODO: weak Types and unsure return is truthy/falsy
  async create(item: Array<any> | Object): Promise<boolean> {
    return await this._model.create(item) ? true : false;
  }

  /**
   * @summary must only be used for User and Repository Controllers
   * @param documentId number id to lookup User (Organization) or Repo
   * @param users Array of associated users from REST to map and write to DB
   */
  createAssociatedUsers = async (documentId: number, users: OctokitTypes.User[]): Promise<void> => {
    const usersDTO = users.map((user: OctokitTypes.User) => {
      return {
        _id: user.id,
        name: user.login,
        avatar_url: user.avatar_url
      }
    });

    try {

      await this._model.updateOne({ _id: documentId }, { associated_users: usersDTO });
    } catch (error) {

      console.error(`Error writing to ${this._model.modelName}`);
      console.error(`Failed createAssociatedUsers -- updating document ${documentId}`);
      throw error;
    }
  };

  async update<T>(id: string, item: T): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async delete(id: string): Promise<boolean> {

    throw new Error("Method not implemented.");
  }

  async find(filter: { [key: string]: any } = {}): Promise<any[]> {
    try {

      return this._model.find(filter);
    } catch (error) {

      throw error(`Internal server error when getting all from ${this._model}:`, error);
    }
  }

  async findOne(filter: { [key: string]: any } = {}): Promise<any[] | any> {
    return await this._model.findOne(filter);
  };

  /**
   * @param _id id for document lookup
   * @param projections array of strings to filter document data by
   * @returns e.g.: `{ _id: 000000000, projections[0]: 'document-data', projections[1]: 'https://...' }`
   */
  async findDocumentProjectionById(_id: number, projections: string[]): Promise<Partial<typeof Document>>{
    /* TODO: Partial Document needs to change to a type with obj.name & obj.type.. */
    return await this._model.findById(_id, projections);
  };

  async httpFindOneById (id: string | number): Promise<any | any[]> {
    if (typeof id === "number") id = id.toString();

    try {

      const document = await this._model.findById(id);
      return document;

    } catch (error) {

      console.error(`Internal server error when getting ${this._model}:`, error);
      throw error;
    }
  }

  async socketFindOneById (id: number): Promise<Document<any>> { // TODO: change Type to FlattenMaps<any> if .lean()
    try {

      const document = await this._model.findById(id); // TODO: check if .lean() js obj is better than mongoose doc

      if (!document) {
        console.error(`Could not find ${this._model} document by id: ${id}, returning:`, document);
      }

      return document;

    } catch (error) {

      console.error(`Internal server error when getting ${this._model}: document by id`, error);
      throw error; // Rethrow the error or handle it as needed
    }
  }

};