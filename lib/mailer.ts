import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP_USER o SMTP_PASSWORD no configurados. Saltando envío de correo.");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Khael Tarotista" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Mensaje enviado: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error enviando correo:", error);
    return false;
  }
}
