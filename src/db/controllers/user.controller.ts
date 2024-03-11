import { User } from "../models/index.js";
import { ARepository } from "./base/ARepository.js";
import { Request, Response } from "express";
import { Schema, Model, FilterQuery } from "mongoose";

/**
 * This will be the Repository for User Model (CRUD)
 */
export class UserController extends ARepository {
  constructor() {
    super(User);
  }
};