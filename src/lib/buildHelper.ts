import { db } from "~/server/db";
import { AuthHelper } from "./authHelper";

export const authHelper = new AuthHelper(db);
