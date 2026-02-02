import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'packageitappofficially@gmail.com',
      pass: 'epvuqqesdioohjvi'
    },
    tls: {
      rejectUnauthorized: false
    }
  });


  const mailOptions = {
    from: 'packageitappofficially@gmail.com',
    to: options.email,
    subject: options.subject,
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 15px; color: #333;">
        <h2>Password Reset Request</h2>
        <p>Hi,</p>
        <p>Click the button below to reset your password:</p>
        <a href="https://apply.studyfirstinfo.com/resetpassword?token=${options.resetToken}" 
           style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>This link will expire in 10 minutes.</p>
        <br><p>Regards,<br>PackageIt Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.email}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};
