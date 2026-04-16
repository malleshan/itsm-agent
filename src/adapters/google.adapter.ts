import axios from "axios";

export class GoogleAdapter {
  static async createUser(email: string, password: string) {
    console.log("Creating Google user:", email);

    return {
      success: true,
      email
    };
  }
}