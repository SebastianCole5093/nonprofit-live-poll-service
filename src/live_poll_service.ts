import { InfraiRealtime } from "./infrai_realtime.js";
import { z } from "zod";

export type PollInput = { sessionId: string; question: string; options: string[]; accountId: string };
export const pollRequest = z.object({ sessionId: z.string().min(1), question: z.string().min(1), options: z.array(z.string().min(1)).min(2), accountId: z.string().min(1) });

export function chooseLeadingOption(tallies: Record<string, number>): string {
  return Object.entries(tallies).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "No votes yet";
}

export async function runPoll(input: PollInput, client = new InfraiRealtime(process.env.INFRAI_API_KEY ?? "")) {
  input = pollRequest.parse(input);
  if (!process.env.INFRAI_API_KEY && client.constructor === InfraiRealtime) throw new Error("INFRAI_API_KEY is required");
  const channel = `nonprofit-session-${input.sessionId}`;
  await client.createChannel(channel);
  await client.publish(channel, "poll.started", { question: input.question, options: input.options }, input.accountId);
  return { channel, reminder: `Volunteers can vote in ${channel}`, report: "Poll opened; results stream through the session channel." };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runPoll({ sessionId: "spring-2026", question: "Which outreach matters most?", options: ["Meals", "Mentoring"], accountId: "demo-account" });
  console.log(JSON.stringify(result, null, 2));
}
