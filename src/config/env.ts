import dotenv from "dotenv";
dotenv.config();

const requiredEnv = [
	"SLACK_WEBHOOK_ALERT_1",
	"SLACK_WEBHOOK_ALERT_2",
	"SLACK_WEBHOOK_ERROR",
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
	throw new Error(`slack webhook not found: ${missingEnv.join(", ")} `);
}

export const config = {
	slack: {
		webhookUrl1: process.env.SLACK_WEBHOOK_ALERT_1!,
		webhookUrl2: process.env.SLACK_WEBHOOK_ALERT_2!,
		webhookErrorUrl: process.env.SLACK_WEBHOOK_ERROR!,
	},
};
