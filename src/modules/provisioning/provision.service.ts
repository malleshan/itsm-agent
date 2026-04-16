import { SlackAdapter } from "../../adapters/slack.adapter";
import { GithubAdapter } from "../../adapters/github.adapter";
import { GoogleAdapter } from "../../adapters/google.adapter";

import { generateCompanyEmail } from "../../utils/helpers";
import { generatePassword } from "../../utils/password";

const ROLE_ACCESS: Record<string, string[]> = {
  developer: ["github", "slack", "google"],
  hr: ["slack"],
};

export const provisionUser = async (employee: any) => {
  try {
    // 🔥 1. Generate company email + password
    const email = generateCompanyEmail(employee.name);
    const password = generatePassword();

    console.log("📧 Generated Email:", email);
    console.log("🔐 Generated Password:", password);

    // 🔥 2. Get tools based on role
    const tools = ROLE_ACCESS[employee.role] || [];

    console.log("🛠 Tools assigned:", tools);

    // 🔥 3. Provision tools
    await Promise.all(
      tools.map(async (tool: string) => {
        try {
          if (tool === "slack") {
            await SlackAdapter.createUser(email);
          }

          if (tool === "github") {
            await GithubAdapter.createUser(email);
          }

          if (tool === "google") {
            await GoogleAdapter.createUser(email, password);
          }

          console.log(`✅ ${tool} provisioned for ${email}`);
        } catch (err: any) {
          console.error(`❌ ${tool} failed for ${email}`, err.message);
        }
      })
    );

    // 🔥 4. (NEXT STEP) send email here
    // await sendWelcomeEmail(email, password, tools);

    return {
      email,
      password,
      tools,
    };

  } catch (error) {
    console.error("❌ Provisioning failed:", error);
    throw error;
  }
};