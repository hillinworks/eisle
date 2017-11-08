import { Document } from "mongoose";
import { IUser } from "../interfaces/IUser";

export interface IUserModel extends IUser, Document {

}