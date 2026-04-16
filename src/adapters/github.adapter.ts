import axios from "axios";

export class GithubAdapter {
  static async createUser(email: string) {
    console.log("Creating GitHub user:", email);

    return axios.post(
      "https://api.github.com/orgs/YOUR_ORG/invitations",
      {
        email
      },
      {
        headers: {
          Authorization: `Bearer YOUR_TOKEN`
        }
      }
    );
  }
}