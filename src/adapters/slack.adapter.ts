import axios from "axios";

export class SlackAdapter {
  static async createUser(email: string) {
    console.log("Creating Slack user:", email);

    return axios.post("https://slack.com/api/users.admin.invite", {
      email
    });
  }
}