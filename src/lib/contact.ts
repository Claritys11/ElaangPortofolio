import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string().trim().min(1, "Tell me your name").max(80),
  contact: z.string().trim().min(3, "Email or handle so I can reply").max(120),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "A bit more detail, please").max(4000),
  website: z.string().optional(),
});

export type ContactInput = z.infer<typeof ContactSchema>;

export function formatContactMessage(i: ContactInput) {
  return {
    title: i.subject?.trim() || `Message from ${i.name}`,
    content: `From: ${i.name} (${i.contact})\n\n${i.message}`,
    username: i.name,
    source: "contact-form" as const,
  };
}
